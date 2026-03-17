const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "missing_key_fallback",
});

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve static files from 'public' directory
app.use(express.json());

// Set up multer for handling file uploads (in-memory storage initially)
// However, Groq SDK expects a ReadStream or File object,
// so it's often easier to save temporarily to disk and then read it.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate a unique filename with proper extension
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

// API Route for transcription
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!process.env.GROQ_API_KEY) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Server Error: GROQ_API_KEY is not configured in the .env file.' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  const filePath = req.file.path;

  try {
    // Call Groq Whisper API

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3', // Groq's high-accuracy whisper model
      language: 'hi', // Specifically instruct the model to focus on Hindi
    });

    // Clean up temporary file
    fs.unlinkSync(filePath);

    // Send successful response
    res.json({ text: transcription.text });

  } catch (error) {
    console.error('Transcription error:', error.message || error);
    
    // Attempt to clean up temp file even if there is an error
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

module.exports = app;
