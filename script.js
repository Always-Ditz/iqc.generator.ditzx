// Configuration
const CONFIG = {
    backgroundImage: 'https://files.catbox.moe/37665w.jpeg',
    apiEndpoint: '/api/generate',
    downloadEndpoint: '/api/download'
};

// DOM Elements
const loader = document.getElementById('loader');
const content = document.getElementById('content');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const actionButtons = document.getElementById('actionButtons');
const preview = document.getElementById('preview');
const previewPlaceholder = document.querySelector('.preview-placeholder');
const messageTextarea = document.getElementById('messageText');

// Form inputs
const timeInput = document.getElementById('time');
const messageInput = document.getElementById('messageText');
const carrierInput = document.getElementById('carrierName');
const batteryInput = document.getElementById('batteryPercentage');
const signalInput = document.getElementById('signalStrength');

// Store current image data
let currentImageUrl = null;
let currentParams = null;

// Preload background image with fade in effect
function initializeApp() {
    const bgImg = new Image();
    bgImg.src = CONFIG.backgroundImage;
    
    bgImg.onload = function() {
        setTimeout(() => {
            loader.classList.add('fade-out');
            content.classList.remove('hidden');
            
            setTimeout(() => {
                content.classList.add('show');
                loader.style.display = 'none';
            }, 500);
        }, 1000);
    };

    bgImg.onerror = function() {
        console.error('Failed to load background image');
        setTimeout(() => {
            loader.classList.add('fade-out');
            content.classList.remove('hidden');
            content.classList.add('show');
            loader.style.display = 'none';
        }, 1000);
    };
}

// Template button functionality
function setupTemplateButtons() {
    const templateBtns = document.querySelectorAll('.template-btn');
    
    templateBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.getAttribute('data-text');
            messageTextarea.value = text;
            messageTextarea.focus();
        });
    });
}

// Validate form inputs
function validateForm() {
    const time = timeInput.value.trim();
    const message = messageInput.value.trim();

    if (!time) {
        alert('Mohon isi waktu!');
        timeInput.focus();
        return false;
    }

    if (!message) {
        alert('Mohon isi pesan!');
        messageInput.focus();
        return false;
    }

    return true;
}

// Build query parameters
function buildQueryParams() {
    return new URLSearchParams({
        time: timeInput.value,
        messageText: messageInput.value,
        carrierName: carrierInput.value || 'INDOSAT OOREDOO',
        batteryPercentage: batteryInput.value || '8',
        signalStrength: signalInput.value || '4'
    });
}

// Update button state
function setButtonState(button, state, text) {
    button.disabled = state === 'loading';
    
    const icons = {
        generate: {
            loading: 'fa-spinner fa-spin',
            success: 'fa-check',
            idle: 'fa-magic'
        },
        download: {
            loading: 'fa-spinner fa-spin',
            success: 'fa-check',
            idle: 'fa-download'
        }
    };
    
    const buttonType = button.id === 'generateBtn' ? 'generate' : 'download';
    const icon = icons[buttonType][state] || icons[buttonType].idle;
    
    button.innerHTML = `<i class="fas ${icon}"></i> ${text}`;
}

// Show preview image
function showPreview(imageUrl) {
    preview.src = imageUrl;
    preview.classList.add('show');
    if (previewPlaceholder) {
        previewPlaceholder.style.display = 'none';
    }
}

// Show action buttons
function showActionButtons() {
    actionButtons.classList.remove('hidden');
    setTimeout(() => {
        actionButtons.classList.add('show');
    }, 100);
}

// Hide action buttons
function hideActionButtons() {
    actionButtons.classList.remove('show');
    setTimeout(() => {
        actionButtons.classList.add('hidden');
    }, 500);
}

// Generate preview
async function generatePreview() {
    // Validate form
    if (!validateForm()) {
        return;
    }

    // Set loading state
    setButtonState(generateBtn, 'loading', 'Generating...');

    try {
        // Build parameters
        currentParams = buildQueryParams();
        const apiUrl = `${CONFIG.apiEndpoint}?${currentParams.toString()}`;

        // Fetch image from backend API
        const response = await fetch(apiUrl);
        
        // Handle cooldown (429 status)
        if (response.status === 429) {
            const errorData = await response.json();
            alert(`⏰ Cooldown Active!\n${errorData.message}\n\nGunakan waktu ini untuk mikir kata-kata yang lebih keren! 😎`);
            setButtonState(generateBtn, 'idle', 'Generate Preview');
            return;
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // Get blob and create object URL
        const blob = await response.blob();
        
        // Revoke previous URL if exists
        if (currentImageUrl) {
            URL.revokeObjectURL(currentImageUrl);
        }
        
        currentImageUrl = URL.createObjectURL(blob);

        // Show preview
        showPreview(currentImageUrl);

        // Show action buttons
        showActionButtons();

        // Set success state
        setButtonState(generateBtn, 'success', 'Generated!');

        // Reset button after 2 seconds
        setTimeout(() => {
            setButtonState(generateBtn, 'idle', 'Generate Preview');
        }, 2000);

    } catch (error) {
        console.error('Generate error:', error);
        
        // Show error message
        const errorMsg = error.message || 'Terjadi kesalahan saat generate image';
        alert(`Error: ${errorMsg}\nSilakan coba lagi.`);
        
        // Reset button
        setButtonState(generateBtn, 'idle', 'Generate Preview');
    }
}

// Download image
async function downloadImage() {
    if (!currentParams) {
        alert('Silakan generate preview terlebih dahulu!');
        return;
    }

    // Set loading state
    setButtonState(downloadBtn, 'loading', 'Downloading...');

    try {
        const downloadUrl = `${CONFIG.downloadEndpoint}?${currentParams.toString()}`;
        
        // Create temporary link for download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `iqc-${Date.now()}.png`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);

        // Set success state
        setButtonState(downloadBtn, 'success', 'Downloaded!');

        // Reset button after 2 seconds
        setTimeout(() => {
            setButtonState(downloadBtn, 'idle', 'Download Image');
        }, 2000);

    } catch (error) {
        console.error('Download error:', error);
        alert('Gagal download image. Silakan coba lagi.');
        setButtonState(downloadBtn, 'idle', 'Download Image');
    }
}

// Reset form and preview
function resetForm() {
    // Reset form inputs
    timeInput.value = '11:26';
    messageInput.value = 'minimal gak ngemis';
    carrierInput.value = 'INDOSAT OOREDOO';
    batteryInput.value = '8';
    signalInput.value = '4';

    // Reset preview
    preview.classList.remove('show');
    preview.src = '';
    if (previewPlaceholder) {
        previewPlaceholder.style.display = 'block';
    }

    // Hide action buttons
    hideActionButtons();

    // Revoke object URL
    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
        currentImageUrl = null;
    }

    // Reset params
    currentParams = null;

    // Focus on first input
    timeInput.focus();
}

// Event listeners
function setupEventListeners() {
    // Generate button
    generateBtn.addEventListener('click', generatePreview);

    // Download button
    downloadBtn.addEventListener('click', downloadImage);

    // Reset button
    resetBtn.addEventListener('click', resetForm);

    // Enter key on textarea
    messageInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            generatePreview();
        }
    });

    // Prevent form submission on enter
    const inputs = [timeInput, carrierInput, batteryInput, signalInput];
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                generatePreview();
            }
        });
    });
}

// Initialize application
window.addEventListener('load', function() {
    initializeApp();
    setupTemplateButtons();
    setupEventListeners();
});

// Handle visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden
    } else {
        // Page is visible again
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (currentImageUrl) {
        URL.revokeObjectURL(currentImageUrl);
    }
});