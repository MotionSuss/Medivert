document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Initialize variables
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const previewContainer = document.getElementById('previewContainer');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const convertBtn = document.getElementById('convertBtn');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progress');
    const statusElement = document.getElementById('status');
    
    let files = [];
    const { jsPDF } = window.jspdf;
    
    // Event listeners
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    clearAllBtn.addEventListener('click', clearAllFiles);
    convertBtn.addEventListener('click', convertToPdf);
    
    // Drag and drop events
    dropArea.addEventListener('dragenter', handleDragEnter, false);
    dropArea.addEventListener('dragover', handleDragOver, false);
    dropArea.addEventListener('dragleave', handleDragLeave, false);
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('highlight');
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('highlight');
        
        const dt = e.dataTransfer;
        const droppedFiles = dt.files;
        
        if (droppedFiles.length > 0) {
            handleFiles(droppedFiles);
        }
    }
    
    function handleFileSelect(e) {
        const selectedFiles = e.target.files;
        if (selectedFiles.length > 0) {
            handleFiles(selectedFiles);
        }
    }
    
    function handleFiles(newFiles) {
        const imageFiles = Array.from(newFiles).filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select image files only.');
            return;
        }
        
        files = [...files, ...imageFiles];
        updateFilePreviews();
        updateButtons();
        fileInput.value = '';
    }
    
    function updateFilePreviews() {
        previewContainer.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const preview = document.createElement('div');
                preview.className = 'image-preview';
                
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = file.name;
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-btn';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeFile(index);
                });
                
                preview.appendChild(img);
                preview.appendChild(removeBtn);
                previewContainer.appendChild(preview);
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    function removeFile(index) {
        files.splice(index, 1);
        updateFilePreviews();
        updateButtons();
    }
    
    function clearAllFiles() {
        files = [];
        fileInput.value = '';
        updateFilePreviews();
        updateButtons();
    }
    
    function updateButtons() {
        clearAllBtn.disabled = files.length === 0;
        convertBtn.disabled = files.length === 0;
    }
    
    async function convertToPdf() {
        if (files.length === 0) return;
        
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        statusElement.textContent = 'Processing...';
        
        const pageSize = document.getElementById('pdfSize').value;
        const orientation = document.getElementById('pdfOrientation').value;
        const margin = parseInt(document.getElementById('pdfMargin').value);
        const layout = document.getElementById('pdfLayout').value;
        
        try {
            const pdf = await createPdf(files, pageSize, orientation, margin, layout);
            pdf.save('images.pdf');
            
            statusElement.textContent = 'Conversion complete!';
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 3000);
        } catch (error) {
            console.error('Error creating PDF:', error);
            statusElement.textContent = 'Error: ' + error.message;
            progressBar.style.backgroundColor = 'var(--danger-color)';
        }
    }
    
    async function createPdf(files, pageSize, orientation, margin, layout) {
        return new Promise(async (resolve, reject) => {
            try {
                let pdf;
                let isFirstImage = true;

                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const imageData = await loadImage(file);
                    
                    const progress = Math.round(((i + 1) / files.length) * 100);
                    progressBar.style.width = `${progress}%`;
                    statusElement.textContent = `Processing image ${i + 1} of ${files.length}`;
                    
                    if (isFirstImage) {
                        const imgProps = calculateImageDimensions(
                            imageData.img,
                            pageSize,
                            orientation,
                            margin
                        );
                        
                        pdf = new jsPDF({
                            orientation: imgProps.orientation,
                            unit: 'mm',
                            format: pageSize === 'auto' ? imgProps.pageSize : pageSize
                        });
                        
                        pdf.addImage(
                            imageData.img, 
                            'JPEG', 
                            margin, 
                            margin, 
                            imgProps.width, 
                            imgProps.height
                        );
                        
                        isFirstImage = false;
                    } else {
                        const imgProps = calculateImageDimensions(
                            imageData.img,
                            pageSize,
                            orientation,
                            margin,
                            pdf
                        );
                        
                        if (layout === 'all-in-one') {
                            const currentPageHeight = pdf.internal.pageSize.getHeight();
                            const currentY = pdf.internal.getCurrentPageInfo().pageContext.obj._Y;
                            
                            if (currentY + imgProps.height + margin > currentPageHeight) {
                                pdf.addPage();
                                pdf.addImage(
                                    imageData.img, 
                                    'JPEG', 
                                    margin, 
                                    margin, 
                                    imgProps.width, 
                                    imgProps.height
                                );
                            } else {
                                pdf.addImage(
                                    imageData.img, 
                                    'JPEG', 
                                    margin, 
                                    currentY + margin, 
                                    imgProps.width, 
                                    imgProps.height
                                );
                            }
                        } else {
                            pdf.addPage();
                            pdf.addImage(
                                imageData.img, 
                                'JPEG', 
                                margin, 
                                margin, 
                                imgProps.width, 
                                imgProps.height
                            );
                        }
                    }
                    
                    // Small delay to allow UI to update
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
                resolve(pdf);
            } catch (error) {
                reject(error);
            }
        });
    }

    function loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    resolve({ img, file });
                };
                img.onerror = function() {
                    reject(new Error(`Failed to load image: ${file.name}`));
                };
                img.src = e.target.result;
            };
            reader.onerror = function() {
                reject(new Error(`Failed to read file: ${file.name}`));
            };
            reader.readAsDataURL(file);
        });
    }

    function calculateImageDimensions(img, pageSize, orientation, margin, existingPdf) {
        let imgWidth = img.width;
        let imgHeight = img.height;
        
        let pageWidth, pageHeight;
        if (existingPdf) {
            pageWidth = existingPdf.internal.pageSize.getWidth() - (margin * 2);
            pageHeight = existingPdf.internal.pageSize.getHeight() - (margin * 2);
        } else if (pageSize === 'auto') {
            const pxToMm = 25.4 / 96;
            pageWidth = imgWidth * pxToMm;
            pageHeight = imgHeight * pxToMm;
            return {
                width: pageWidth,
                height: pageHeight,
                orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
                pageSize: [pageWidth + (margin * 2), pageHeight + (margin * 2)]
            };
        } else {
            const tempPdf = new jsPDF({
                orientation: orientation === 'auto' 
                    ? (imgWidth > imgHeight ? 'landscape' : 'portrait')
                    : orientation,
                unit: 'mm',
                format: pageSize
            });
            pageWidth = tempPdf.internal.pageSize.getWidth() - (margin * 2);
            pageHeight = tempPdf.internal.pageSize.getHeight() - (margin * 2);
        }
        
        const currentOrientation = orientation === 'auto'
            ? (imgWidth > imgHeight ? 'landscape' : 'portrait')
            : orientation;
        
        const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
        imgWidth *= ratio;
        imgHeight *= ratio;
        
        return {
            width: imgWidth,
            height: imgHeight,
            orientation: currentOrientation
        };
    }
});