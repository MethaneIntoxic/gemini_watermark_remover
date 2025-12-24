import { WatermarkEngine } from './engine.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initialized');
    
    // UI Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    
    // Batch UI Elements
    const batchPreviewSection = document.getElementById('batchPreviewSection');
    const batchResultsGrid = document.getElementById('batchResultsGrid');
    const batchProgress = document.getElementById('batchProgress');
    const batchProgressBar = document.getElementById('batchProgressBar');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const downloadAllIndividualBtn = document.getElementById('downloadAllIndividualBtn');
    const batchResetBtn = document.getElementById('batchResetBtn');
    
    // Images
    const originalImage = document.getElementById('originalImage');
    const processedImage = document.getElementById('processedImage');
    
    // Metadata Fields
    const originalSize = document.getElementById('originalSize');
    const resultSize = document.getElementById('resultSize');
    const resultStatus = document.getElementById('resultStatus');
    
    // Buttons & Overlay
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');

    let engine = null;
    let processedResults = []; // Store batch results for download

    // --- Init ---
    try {
        engine = await WatermarkEngine.create();
        console.log('Engine loaded successfully');
    } catch (e) {
        console.error('Engine load error:', e);
        alert("Error: Could not load background assets. Please ensure 'assets/bg_48.png' and 'assets/bg_96.png' exist.");
    }

    // --- Event Listeners ---
    // Drag & Drop Logic
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    uploadArea.addEventListener('dragover', () => uploadArea.classList.add('border-gemini-blue', 'bg-blue-50'));
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('border-gemini-blue', 'bg-blue-50'));
    
    uploadArea.addEventListener('drop', (e) => {
        uploadArea.classList.remove('border-gemini-blue', 'bg-blue-50');
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
        console.log('File input changed, files:', e.target.files);
        handleFiles(e.target.files);
    });

    // Single image reset
    resetBtn.addEventListener('click', () => {
        previewSection.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        fileInput.value = '';
        originalImage.src = '';
        processedImage.src = '';
        processedResults = [];
    });

    // Batch reset
    batchResetBtn.addEventListener('click', () => {
        batchPreviewSection.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        fileInput.value = '';
        batchResultsGrid.innerHTML = '';
        processedResults = [];
        batchProgressBar.style.width = '0%';
    });

    // Download All as Individual Files
    downloadAllIndividualBtn.addEventListener('click', async () => {
        if (processedResults.length === 0) return;
        
        downloadAllIndividualBtn.disabled = true;
        const originalText = downloadAllIndividualBtn.querySelector('span').textContent;
        downloadAllIndividualBtn.querySelector('span').textContent = 'Downloading...';

        try {
            // Download each file with a small delay to avoid browser blocking
            for (let i = 0; i < processedResults.length; i++) {
                const result = processedResults[i];
                const a = document.createElement('a');
                a.href = result.url;
                a.download = result.filename;
                a.click();
                
                // Small delay between downloads to prevent browser blocking
                if (i < processedResults.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
        } catch (error) {
            console.error('Error downloading files:', error);
            alert('Error downloading files. Please try downloading individually or use ZIP.');
        } finally {
            downloadAllIndividualBtn.disabled = false;
            downloadAllIndividualBtn.querySelector('span').textContent = originalText;
        }
    });

    // Download All as ZIP
    downloadAllBtn.addEventListener('click', async () => {
        if (processedResults.length === 0) return;
        
        downloadAllBtn.disabled = true;
        const originalText = downloadAllBtn.querySelector('span').textContent;
        downloadAllBtn.querySelector('span').textContent = 'Creating ZIP...';

        try {
            const zip = new JSZip();
            
            for (const result of processedResults) {
                const response = await fetch(result.url);
                const blob = await response.blob();
                zip.file(result.filename, blob);
            }
            
            const zipBlob = await zip.generateAsync({ 
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });
            
            const a = document.createElement('a');
            a.href = URL.createObjectURL(zipBlob);
            a.download = `cleaned_images_${Date.now()}.zip`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Error creating ZIP file. Please try downloading images individually.');
        } finally {
            downloadAllBtn.disabled = false;
            downloadAllBtn.querySelector('span').textContent = originalText;
        }
    });

    // --- Processing Logic ---
    async function handleFiles(files) {
        if (!files.length) return;
        
        // Filter only image files
        const imageFiles = Array.from(files).filter(file => file.type.match('image.*'));
        
        if (imageFiles.length === 0) {
            alert("Please upload valid images (PNG, JPG, WebP)");
            return;
        }

        // Check if single or batch processing
        if (imageFiles.length === 1) {
            await handleSingleFile(imageFiles[0]);
        } else {
            await handleBatchFiles(imageFiles);
        }
    }

    // --- Single File Processing ---
    async function handleSingleFile(file) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
        loadingText.textContent = 'Processing...';

        try {
            if (!engine) engine = await WatermarkEngine.create();
            
            const result = await engine.process(file);
            
            // 1. Update Images
            originalImage.src = result.originalSrc;
            const processedUrl = URL.createObjectURL(result.blob);
            processedImage.src = processedUrl;
            
            // Store for potential download
            processedResults = [{
                url: processedUrl,
                filename: `clean_${file.name.replace(/\.[^/.]+$/, "")}.png`,
                blob: result.blob
            }];
            
            // 2. Update Metadata (Top Right Corner)
            const sizeText = `${result.width} × ${result.height} px`;
            originalSize.textContent = sizeText;
            resultSize.textContent = sizeText;
            resultStatus.textContent = "Watermark Removed";
            
            // 3. Setup Download
            downloadBtn.onclick = () => {
                const a = document.createElement('a');
                a.href = processedUrl;
                a.download = `clean_${file.name.replace(/\.[^/.]+$/, "")}.png`;
                a.click();
            };

            // 4. Show Results
            uploadArea.classList.add('hidden');
            batchPreviewSection.classList.add('hidden');
            previewSection.classList.remove('hidden');

        } catch (error) {
            console.error(error);
            alert("An error occurred during processing.");
        } finally {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');
        }
    }

    // --- Batch File Processing ---
    async function handleBatchFiles(files) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.classList.add('flex');
        
        processedResults = [];
        batchResultsGrid.innerHTML = '';
        
        const totalFiles = files.length;
        let processedCount = 0;

        try {
            if (!engine) engine = await WatermarkEngine.create();

            // Show batch preview section
            uploadArea.classList.add('hidden');
            previewSection.classList.add('hidden');
            batchPreviewSection.classList.remove('hidden');
            
            // Disable download buttons until processing is complete
            downloadAllBtn.disabled = true;
            downloadAllIndividualBtn.disabled = true;

            // Process each file
            for (const file of files) {
                loadingText.textContent = `Processing ${processedCount + 1} of ${totalFiles}...`;
                batchProgress.textContent = `Processing ${processedCount + 1} of ${totalFiles} images...`;
                
                try {
                    const result = await engine.process(file);
                    const processedUrl = URL.createObjectURL(result.blob);
                    
                    // Store result
                    const filename = `clean_${file.name.replace(/\.[^/.]+$/, "")}.png`;
                    processedResults.push({
                        url: processedUrl,
                        filename: filename,
                        blob: result.blob,
                        originalName: file.name,
                        width: result.width,
                        height: result.height
                    });
                    
                    // Create result card
                    const card = createResultCard(processedUrl, filename, file.name, result.width, result.height);
                    batchResultsGrid.appendChild(card);
                    
                } catch (error) {
                    console.error(`Error processing ${file.name}:`, error);
                    // Create error card
                    const errorCard = createErrorCard(file.name);
                    batchResultsGrid.appendChild(errorCard);
                }
                
                processedCount++;
                const progress = (processedCount / totalFiles) * 100;
                batchProgressBar.style.width = `${progress}%`;
            }
            
            // Update final status
            batchProgress.textContent = `Completed! ${processedResults.length} of ${totalFiles} images processed successfully.`;
            downloadAllBtn.disabled = false;
            downloadAllIndividualBtn.disabled = false;

        } catch (error) {
            console.error('Batch processing error:', error);
            alert("An error occurred during batch processing.");
        } finally {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.classList.remove('flex');
        }
    }

    // --- Helper: Create Result Card ---
    function createResultCard(processedUrl, filename, originalName, width, height) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-theme-cardDark rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow';
        
        card.innerHTML = `
            <div class="aspect-square bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2Y5ZmRmZCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjJmMmYyIi8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMjYyOTMwIi8+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMWQxZjI0Ii8+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiMxZDFmMjQiLz48L3N2Zz4=')] flex items-center justify-center p-2">
                <img src="${processedUrl}" alt="${originalName}" class="max-w-full max-h-full object-contain rounded" />
            </div>
            <div class="p-3 border-t border-gray-100 dark:border-gray-700">
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <p class="text-xs font-semibold text-green-600 dark:text-green-400">Watermark Removed</p>
                </div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title="${originalName}">${originalName}</p>
                <p class="text-xs text-slate-400 dark:text-slate-500">${width} × ${height} px</p>
                <button class="download-single-btn mt-3 w-full py-2 px-3 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary dark:text-indigo-400 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    <iconify-icon icon="ph:download-simple-bold" width="16"></iconify-icon>
                    Download
                </button>
            </div>
        `;
        
        // Add download handler
        const downloadSingleBtn = card.querySelector('.download-single-btn');
        downloadSingleBtn.addEventListener('click', () => {
            const a = document.createElement('a');
            a.href = processedUrl;
            a.download = filename;
            a.click();
        });
        
        return card;
    }

    // --- Helper: Create Error Card ---
    function createErrorCard(filename) {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-theme-cardDark rounded-xl shadow-sm overflow-hidden border border-red-200 dark:border-red-900/50';
        
        card.innerHTML = `
            <div class="aspect-square bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <div class="text-center p-4">
                    <iconify-icon icon="ph:warning-circle-bold" class="text-4xl text-red-400"></iconify-icon>
                    <p class="text-sm text-red-500 dark:text-red-400 mt-2">Processing Failed</p>
                </div>
            </div>
            <div class="p-3 border-t border-red-100 dark:border-red-900/30">
                <div class="flex items-center gap-2 mb-2">
                    <span class="w-2 h-2 rounded-full bg-red-500"></span>
                    <p class="text-xs font-semibold text-red-600 dark:text-red-400">Error</p>
                </div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title="${filename}">${filename}</p>
            </div>
        `;
        
        return card;
    }
});