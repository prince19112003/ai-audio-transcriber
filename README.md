# AI Audio Transcriber

A modern, highly accurate, and lightweight Audio-to-Text Transcription Web Application using the Groq Whisper API.

## Features
- **High Accuracy Transcription**: Powered by Groq `whisper-large-v3` model (supports English, Hindi, Hinglish perfectly).
- **Two Modalities**: Live Record via Microphone, or Upload Audio File (mp3, wav, m4a, webm).
- **Lightweight**: Vanilla HTML5, CSS3, JS on the frontend. No heavy frameworks.
- **Beautiful UI**: Modern, clean, and fully responsive design customized with Tailwind CSS. Native CSS animations (pulsing mic).
- **Secure Backend**: Lightweight Node.js/Express.js backend securely forwards requests to protect the Groq API key.

## Requirements
- Node.js installed (v16+ recommended).
- A Groq API Key from [Groq Console](https://console.groq.com/).

## Installation

1. Clone or download this project.
2. Navigate to the project directory and install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy the example `.env` file to create a real `.env` file:
   ```bash
   cp .env.example .env
   ```
   Open the `.env` file and replace `your_groq_api_key_here` with your actual Groq API Key.
4. Start the server:
   ```bash
   npm start
   ```

## Usage
Open your web browser and navigate to the address shown in your terminal (typically `http://localhost:3000`).

- **Live Record**: Go to the "Live Record" tab, grant microphone permissions, click the mic to start recording, and click it again to stop. The audio will transcribe immediately!
- **Upload File**: Go to the "Upload File" tab and browse or drag-and-drop an audio file (up to 25MB limit). Click 'Transcribe Audio' to begin.
- **Save Results**: Copy text directly to clipboard or download as a `.txt` file using the UI buttons.
