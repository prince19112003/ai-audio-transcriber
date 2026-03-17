document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const tabRecord = document.getElementById('tab-record');
    const tabUpload = document.getElementById('tab-upload');
    const sectionRecord = document.getElementById('section-record');
    const sectionUpload = document.getElementById('section-upload');
    
    const btnRecord = document.getElementById('btn-record');
    const iconRecord = document.getElementById('icon-record');
    const recordingTimer = document.getElementById('recording-timer');
    const recordStatusText = document.getElementById('record-status-text');
    
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileDetails = document.getElementById('file-details');
    const fileName = document.getElementById('file-name');
    const btnRemoveFile = document.getElementById('btn-remove-file');
    const btnUploadSubmit = document.getElementById('btn-upload-submit');
    
    const loadingState = document.getElementById('loading-state');
    const sectionResult = document.getElementById('section-result');
    const transcriptionText = document.getElementById('transcription-text');
    
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    
    const toastContainer = document.getElementById('toast-container');
    
    // State variables
    let isRecording = false;
    let mediaRecorder;
    let audioChunks = [];
    let selectedFile = null;
    let timerInterval;
    let secondsRecorded = 0;
    
    // ==== TAB SWITCHING ====
    function switchTab(tab) {
        if (tab === 'record') {
            tabRecord.classList.add('text-indigo-600', 'border-indigo-600');
            tabRecord.classList.remove('text-gray-500', 'border-transparent');
            tabUpload.classList.remove('text-indigo-600', 'border-indigo-600');
            tabUpload.classList.add('text-gray-500', 'border-transparent');
            
            sectionRecord.classList.remove('hidden');
            sectionRecord.classList.add('flex');
            sectionUpload.classList.add('hidden');
            sectionUpload.classList.remove('flex');
            
            resetUI('tabs');
        } else {
            tabUpload.classList.add('text-indigo-600', 'border-indigo-600');
            tabUpload.classList.remove('text-gray-500', 'border-transparent');
            tabRecord.classList.remove('text-indigo-600', 'border-indigo-600');
            tabRecord.classList.add('text-gray-500', 'border-transparent');
            
            sectionUpload.classList.remove('hidden');
            sectionUpload.classList.add('flex');
            sectionRecord.classList.add('hidden');
            sectionRecord.classList.remove('flex');
            
            if (isRecording) stopRecording();
            resetUI('tabs');
        }
    }
    
    tabRecord.addEventListener('click', () => switchTab('record'));
    tabUpload.addEventListener('click', () => switchTab('upload'));
    
    // ==== RECORDING LOGIC ====
    btnRecord.addEventListener('click', async () => {
        if (!isRecording) {
            await startRecording();
        } else {
            stopRecording();
        }
    });
    
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = event => {
                if (event.data.size > 0) audioChunks.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];
                // Stop tracks to release mic
                stream.getTracks().forEach(track => track.stop());
                
                // create file from blob
                const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
                processTranscription(file);
            };
            
            mediaRecorder.start();
            isRecording = true;
            
            btnRecord.classList.add('mic-button-recording');
            iconRecord.classList.remove('fa-microphone');
            iconRecord.classList.add('fa-stop');
            recordStatusText.textContent = "Recording... Click to stop";
            
            recordingTimer.classList.remove('opacity-0');
            secondsRecorded = 0;
            updateTimerDisplay();
            timerInterval = setInterval(() => {
                secondsRecorded++;
                updateTimerDisplay();
            }, 1000);
            
            showToast('Recording started', 'success');
        } catch (error) {
            console.error('Error accessing microphone:', error);
            showToast('Microphone access denied. Please check permissions.', 'error');
        }
    }
    
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
        isRecording = false;
        
        btnRecord.classList.remove('mic-button-recording');
        iconRecord.classList.remove('fa-stop');
        iconRecord.classList.add('fa-microphone');
        recordStatusText.textContent = "Processing audio...";
        
        clearInterval(timerInterval);
        recordingTimer.classList.add('opacity-0');
        recordingTimer.textContent = "00:00";
    }
    
    function updateTimerDisplay() {
        const mins = Math.floor(secondsRecorded / 60).toString().padStart(2, '0');
        const secs = (secondsRecorded % 60).toString().padStart(2, '0');
        recordingTimer.textContent = `${mins}:${secs}`;
    }
    
    // ==== UPLOAD LOGIC ====
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            handleFileSelection(fileInput.files[0]);
        }
    });
    
    function handleFileSelection(file) {
        if (file.size > 25 * 1024 * 1024) {
            showToast('File too large. Maximum size is 25MB.', 'error');
            return;
        }
        if (!file.type.startsWith('audio/')) {
            showToast('Please upload an audio file.', 'error');
            return;
        }
        
        selectedFile = file;
        fileName.textContent = file.name;
        
        dropZone.classList.add('hidden');
        fileDetails.classList.remove('hidden');
        btnUploadSubmit.classList.remove('hidden');
    }
    
    btnRemoveFile.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        fileDetails.classList.add('hidden');
        btnUploadSubmit.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });
    
    btnUploadSubmit.addEventListener('click', () => {
        if (selectedFile) {
            processTranscription(selectedFile);
        }
    });
    
    // ==== API CALL ====
    async function processTranscription(file) {
        sectionRecord.classList.add('hidden');
        sectionUpload.classList.add('hidden');
        loadingState.classList.remove('hidden');
        loadingState.classList.add('flex');
        sectionResult.classList.add('hidden');
        
        const formData = new FormData();
        formData.append('audio', file);
        
        try {
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to transcribe audio');
            }
            
            loadingState.classList.add('hidden');
            loadingState.classList.remove('flex');
            sectionResult.classList.remove('hidden');
            
            transcriptionText.value = data.text;
            showToast('Transcription successful!', 'success');
            
        } catch (error) {
            console.error('Transcription error:', error);
            showToast(error.message || 'An error occurred during transcription.', 'error');
            resetUI('error');
        }
    }
    
    // ==== RESULT ACTIONS ====
    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(transcriptionText.value)
            .then(() => showToast('Copied to clipboard', 'info'))
            .catch(err => console.error('Error copying text:', err));
    });
    
    btnDownload.addEventListener('click', () => {
        const text = transcriptionText.value;
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `transcription-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast('Download started', 'info');
    });
    
    // ==== UTILS ====
    function resetUI(context) {
        loadingState.classList.add('hidden');
        loadingState.classList.remove('flex');
        sectionResult.classList.add('hidden');
        transcriptionText.value = '';
        
        if (context === 'error') {
            if (tabRecord.classList.contains('text-indigo-600')) {
                sectionRecord.classList.remove('hidden');
                sectionRecord.classList.add('flex');
                recordStatusText.textContent = "Ready";
            } else {
                sectionUpload.classList.remove('hidden');
                sectionUpload.classList.add('flex');
            }
        }
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }
});
