document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    const processingArea = document.getElementById('processingArea');
    const resultArea = document.getElementById('resultArea');
    const originalImage = document.getElementById('originalImage');
    const enhancedImage = document.getElementById('enhancedImage');
    const downloadPng = document.getElementById('downloadPng');
    const downloadJpeg = document.getElementById('downloadJpeg');
    const processAnother = document.getElementById('processAnother');
    const jpegQuality = document.getElementById('jpegQuality');
    const qualityValue = document.getElementById('qualityValue');
    const qualityControl = document.getElementById('qualityControl');
    const progressText = document.getElementById('progressText');
    
    let enhancedImageData = null;
    let fileName = '';
    let isJpegQualitySelected = false;
    
    // Event listeners for drag and drop
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
        dropZone.style.backgroundColor = '#f8fafc';
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#bdc3c7';
        dropZone.style.backgroundColor = 'transparent';
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#bdc3c7';
        dropZone.style.backgroundColor = 'transparent';
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect({ target: fileInput });
        }
    });
    
    // Download buttons
    downloadPng.addEventListener('click', downloadAsPng);
    
    downloadJpeg.addEventListener('click', function() {
        if (!isJpegQualitySelected) {
            // First click - show quality options
            qualityControl.style.display = 'block';
            isJpegQualitySelected = true;
            downloadJpeg.textContent = 'Confirm JPEG Download';
        } else {
            // Second click - download with selected quality
            downloadAsJpeg();
            qualityControl.style.display = 'none';
            isJpegQualitySelected = false;
            downloadJpeg.textContent = 'JPEG (Compressed)';
        }
    });
    
    jpegQuality.addEventListener('input', () => {
        qualityValue.textContent = `${jpegQuality.value}%`;
    });
    
    processAnother.addEventListener('click', resetForm);
    
    async function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPEG, PNG)');
            return;
        }
        
        fileName = file.name.split('.')[0];
        
        // Show original image
        const reader = new FileReader();
        reader.onload = function(e) {
            originalImage.src = e.target.result;
            
            // Show processing area
            uploadArea.style.display = 'none';
            processingArea.style.display = 'block';
            resultArea.style.display = 'none';
            
            // Process the image
            processImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
    
    async function processImage(imageSrc) {
        try {
            progressText.textContent = 'Loading image...';
            
            // Create an image element to work with
            const img = new Image();
            img.src = imageSrc;
            
            await new Promise((resolve) => {
                img.onload = resolve;
            });
            
            progressText.textContent = 'Preparing image data...';
            
            // Create a canvas to work with the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions to image dimensions
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            progressText.textContent = 'Enhancing image quality...';
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Apply some basic enhancements
            const enhancedData = applyBasicEnhancements(imageData);
            
            // Create enhanced image
            const enhancedCanvas = document.createElement('canvas');
            const enhancedCtx = enhancedCanvas.getContext('2d');
            
            // Upscale by 2x for demonstration
            enhancedCanvas.width = img.width * 2;
            enhancedCanvas.height = img.height * 2;
            
            // Put the enhanced data back
            const newImageData = new ImageData(
                new Uint8ClampedArray(enhancedData),
                enhancedCanvas.width,
                enhancedCanvas.height
            );
            
            enhancedCtx.putImageData(newImageData, 0, 0);
            
            // Convert to data URL for display
            enhancedImage.src = enhancedCanvas.toDataURL('image/png');
            enhancedImageData = enhancedCanvas;
            
            // Show result area
            processingArea.style.display = 'none';
            resultArea.style.display = 'block';
            
        } catch (error) {
            console.error('Error processing image:', error);
            progressText.textContent = 'Error processing image. Please try another.';
            setTimeout(() => {
                processingArea.style.display = 'none';
                uploadArea.style.display = 'block';
            }, 2000);
        }
    }
    
    function applyBasicEnhancements(imageData) {
        // This is a simplified enhancement process
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        
        // Create a 2x upscaled version
        const upscaleFactor = 2;
        const newWidth = width * upscaleFactor;
        const newHeight = height * upscaleFactor;
        const newData = new Uint8ClampedArray(newWidth * newHeight * 4);
        
        // Simple upscaling with bilinear interpolation
        for (let y = 0; y < newHeight; y++) {
            for (let x = 0; x < newWidth; x++) {
                const origX = x / upscaleFactor;
                const origY = y / upscaleFactor;
                
                const x1 = Math.floor(origX);
                const y1 = Math.floor(origY);
                const x2 = Math.min(x1 + 1, width - 1);
                const y2 = Math.min(y1 + 1, height - 1);
                
                // Get the 4 surrounding pixels
                const idx1 = (y1 * width + x1) * 4;
                const idx2 = (y1 * width + x2) * 4;
                const idx3 = (y2 * width + x1) * 4;
                const idx4 = (y2 * width + x2) * 4;
                
                // Bilinear interpolation
                const xRatio = origX - x1;
                const yRatio = origY - y1;
                const xOpposite = 1 - xRatio;
                const yOpposite = 1 - yRatio;
                
                const newIdx = (y * newWidth + x) * 4;
                
                for (let i = 0; i < 4; i++) {
                    // Skip alpha channel for interpolation
                    if (i === 3) {
                        newData[newIdx + i] = data[idx1 + i];
                        continue;
                    }
                    
                    const val = (
                        data[idx1 + i] * xOpposite * yOpposite +
                        data[idx2 + i] * xRatio * yOpposite +
                        data[idx3 + i] * xOpposite * yRatio +
                        data[idx4 + i] * xRatio * yRatio
                    );
                    
                    // Simple sharpening by slightly increasing contrast
                    let enhancedVal = val;
                    if (i < 3) { // Only for RGB channels
                        const avg = (data[idx1 + i] + data[idx2 + i] + data[idx3 + i] + data[idx4 + i]) / 4;
                        enhancedVal = val + (val - avg) * 0.3;
                    }
                    
                    // Simple noise reduction by clamping extreme values
                    if (i < 3) {
                        const minVal = Math.min(data[idx1 + i], data[idx2 + i], data[idx3 + i], data[idx4 + i]);
                        const maxVal = Math.max(data[idx1 + i], data[idx2 + i], data[idx3 + i], data[idx4 + i]);
                        
                        if (enhancedVal < minVal * 0.9) enhancedVal = minVal * 0.9;
                        if (enhancedVal > maxVal * 1.1) enhancedVal = maxVal * 1.1;
                    }
                    
                    newData[newIdx + i] = Math.max(0, Math.min(255, enhancedVal));
                }
            }
        }
        
        return newData;
    }
    
    function downloadAsPng() {
        if (!enhancedImageData) return;
        
        enhancedImageData.toBlob((blob) => {
            saveAs(blob, `${fileName}_enhanced.png`);
        }, 'image/png');
    }
    
    function downloadAsJpeg() {
        if (!enhancedImageData) return;
        
        const quality = parseInt(jpegQuality.value) / 100;
        enhancedImageData.toBlob((blob) => {
            saveAs(blob, `${fileName}_enhanced.jpg`);
        }, 'image/jpeg', quality);
    }
    
    function resetForm() {
        uploadArea.style.display = 'block';
        processingArea.style.display = 'none';
        resultArea.style.display = 'none';
        enhancedImageData = null;
        fileInput.value = '';
        qualityControl.style.display = 'none';
        downloadJpeg.textContent = 'JPEG (Compressed)';
        isJpegQualitySelected = false;
    }
});