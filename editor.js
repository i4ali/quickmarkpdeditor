
const { PDFDocument, rgb, StandardFonts } = PDFLib;
pdfjsLib.GlobalWorkerOptions.workerSrc = `lib/pdf.worker.min.js`;

let pdfDoc = null;
let scale = 1.5;
let addedElements = [];
let originalPdfBytes = null;
let signaturePad = null;
let savedSignature = null;
let currentPage = 1;

function makeDraggable(element) {
    let offsetX, offsetY;
    const handle = element.querySelector('.drag-handle');

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        
        offsetX = e.clientX - element.offsetLeft;
        offsetY = e.clientY - element.offsetTop;

        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;

        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function addDraggableText() {
    if (!pdfDoc) {
        alert('Please open a PDF first.');
        return;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '100px';
    container.style.left = '100px';

    const handle = document.createElement('div');
    handle.classList.add('drag-handle');
    handle.style.width = '20px';
    handle.style.height = '20px';
    handle.style.backgroundColor = 'gray';
    handle.style.cursor = 'move';
    handle.style.position = 'absolute';
    handle.style.top = '-20px';
    handle.style.left = '-20px';
    container.appendChild(handle);

    const textDiv = document.createElement('div');
    textDiv.setAttribute('contenteditable', 'true');
    textDiv.style.border = '1px dashed #000';
    textDiv.style.padding = '5px';
    textDiv.style.backgroundColor = 'rgba(255, 255, 0, 0.2)';
    textDiv.innerText = 'New Text';

    const deleteButton = createDeleteButton();
    container.appendChild(deleteButton);
    container.appendChild(textDiv);

    const pageContainer = document.querySelector(`.page-container[data-page-number="${currentPage}"]`);
    pageContainer.appendChild(container);
    makeDraggable(container);

    addedElements.push({type: 'text', element: container, page: currentPage});
}

function makeResizable(element) {
    const resizeHandle = document.createElement('div');
    resizeHandle.style.width = '10px';
    resizeHandle.style.height = '10px';
    resizeHandle.style.background = 'blue';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.right = '0';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.cursor = 'se-resize';
    element.appendChild(resizeHandle);

    resizeHandle.onmousedown = function(e) {
        e.stopPropagation();
        e.preventDefault();
        document.onmousemove = function(e) {
            const rect = element.getBoundingClientRect();
            element.style.width = e.clientX - rect.left + 'px';
            element.querySelector('img').style.width = '100%';
        };
        document.onmouseup = function() {
            document.onmousemove = null;
            document.onmouseup = null;
        };
    };
}

function createDeleteButton() {
    const button = document.createElement('button');
    button.innerText = 'X';
    button.style.position = 'absolute';
    button.style.top = '-10px';
    button.style.right = '-10px';
    button.style.background = 'red';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.addEventListener('click', (e) => {
        const elementToRemove = e.target.parentElement;
        const pageContainer = elementToRemove.parentElement;
        pageContainer.removeChild(elementToRemove);
        addedElements = addedElements.filter(item => item.element !== elementToRemove);
    });
    return button;
}



function addDraggableSignature(signatureDataUrl) {
    if (!pdfDoc) {
        alert('Please open a PDF first.');
        return;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '100px';
    container.style.left = '100px';

    const handle = document.createElement('div');
    handle.classList.add('drag-handle');
    handle.style.width = '20px';
    handle.style.height = '20px';
    handle.style.backgroundColor = 'gray';
    handle.style.cursor = 'move';
    handle.style.position = 'absolute';
    handle.style.top = '-20px';
    handle.style.left = '-20px';
    container.appendChild(handle);

    const sigImg = document.createElement('img');
    sigImg.src = signatureDataUrl;
    sigImg.style.width = '150px';
    sigImg.style.height = 'auto';

    const deleteButton = createDeleteButton();
    container.appendChild(deleteButton);
    container.appendChild(sigImg);

    const pageContainer = document.querySelector(`.page-container[data-page-number="${currentPage}"]`);
    pageContainer.appendChild(container);
    makeDraggable(container);
    makeResizable(container);

    addedElements.push({type: 'signature', element: container, page: currentPage});
}

async function renderPdf(data) {
    const pdfViewer = document.getElementById('pdf-viewer');
    pdfViewer.innerHTML = '';
    addedElements = [];
    const loadingTask = pdfjsLib.getDocument(data);
    pdfDoc = await loadingTask.promise;

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale });

        const pageContainer = document.createElement('div');
        pageContainer.classList.add('page-container');
        pageContainer.dataset.pageNumber = i;
        pageContainer.style.position = 'relative';

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;

        pageContainer.appendChild(canvas);
        pdfViewer.appendChild(pageContainer);
    }

    pdfViewer.addEventListener('scroll', () => {
        const pageContainers = document.querySelectorAll('.page-container');
        for (const pageContainer of pageContainers) {
            const rect = pageContainer.getBoundingClientRect();
            if (rect.top >= 0 && rect.top < pdfViewer.clientHeight) {
                currentPage = parseInt(pageContainer.dataset.pageNumber);
                break;
            }
        }
    });
}

function resetAll() {
    if (!pdfDoc) {
        alert('No PDF is currently open.');
        return;
    }

    const confirmed = confirm('Are you sure you want to remove all changes? This will clear all text, signatures, and annotations.');
    if (!confirmed) {
        return;
    }

    // Remove all free feature elements (text and signatures)
    addedElements.forEach(item => {
        if (item.element && item.element.parentElement) {
            item.element.remove();
        }
    });
    addedElements = [];

    // Clear all premium annotations
    annotationManager.clearAllAnnotations();

    // Remove all drawing canvases
    const drawingCanvases = document.querySelectorAll('.drawing-canvas');
    drawingCanvases.forEach(canvas => canvas.remove());

    // Clear active tool
    currentActiveTool = null;
    const allTools = document.querySelectorAll('#toolbar button.premium');
    allTools.forEach(btn => btn.style.border = 'none');

    // Hide color picker
    const colorPicker = document.getElementById('color-picker');
    if (colorPicker) {
        colorPicker.style.display = 'none';
    }

    alert('All changes have been removed. The PDF is back to its original state.');
}

function getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    const canvas = element.parentElement.querySelector('canvas');
    const canvasRect = canvas.getBoundingClientRect();
    return {
        x: rect.left - canvasRect.left,
        y: rect.top - canvasRect.top
    };
}

async function savePdf() {
    if (!originalPdfBytes) {
        alert('Please open a PDF first.');
        return;
    }

    try {
        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const pages = pdfDoc.getPages();

        // Save existing text and signature elements
        for (const added of addedElements) {
            try {
                const { element, type, page } = added;
                const { x, y } = getElementPosition(element);
                const targetPage = pages[page - 1];

                if (type === 'text') {
                    const textDiv = element.querySelector('div[contenteditable=true]');
                    const text = textDiv.innerText;
                    targetPage.drawText(text, {
                        x: x / scale,
                        y: targetPage.getHeight() - y / scale - (textDiv.clientHeight / scale),
                        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
                        size: 12,
                        color: rgb(0, 0, 0),
                    });
                } else if (type === 'signature') {
                    const imgElement = element.querySelector('img');
                    const pngImageBytes = await fetch(imgElement.src).then(res => res.arrayBuffer());
                    const pngImage = await pdfDoc.embedPng(pngImageBytes);
                    targetPage.drawImage(pngImage, {
                        x: x / scale,
                        y: targetPage.getHeight() - y / scale - (imgElement.height / scale),
                        width: imgElement.width / scale,
                        height: imgElement.height / scale,
                    });
                }
            } catch (error) {
                console.error('Error processing element:', error);
                // Continue with other elements
            }
        }

        // Save premium annotations
        const annotations = annotationManager.getAnnotations();

        for (const annotation of annotations) {
            try {
                const targetPage = pages[annotation.page - 1];
                const { element, type } = annotation;

                if (type === 'highlight') {
                    const highlightDiv = element.querySelector('div:not(.drag-handle):not(button)');
                    if (highlightDiv) {
                        const rect = element.getBoundingClientRect();
                        const pageContainer = element.parentElement;
                        const canvas = pageContainer.querySelector('canvas');
                        if (!canvas) {
                            console.warn('Canvas not found for highlight');
                            continue;
                        }
                        const canvasRect = canvas.getBoundingClientRect();

                        const x = (rect.left - canvasRect.left) / scale;
                        const y = (rect.top - canvasRect.top) / scale;
                        // Use offsetWidth/offsetHeight from the container element instead of style
                        const width = element.offsetWidth / scale;
                        const height = element.offsetHeight / scale;

                        const color = hexToRgb(annotation.color);

                        targetPage.drawRectangle({
                            x: x,
                            y: targetPage.getHeight() - y - height,
                            width: width,
                            height: height,
                            color: rgb(color.r / 255, color.g / 255, color.b / 255),
                            opacity: 0.4,
                            borderWidth: 0,
                        });
                    }
                } else if (type === 'drawing') {
                    const canvas = annotation.element;
                    const dataUrl = annotation.dataUrl || canvas.toDataURL();
                    const pngImageBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
                    const pngImage = await pdfDoc.embedPng(pngImageBytes);

                    targetPage.drawImage(pngImage, {
                        x: 0,
                        y: 0,
                        width: canvas.width / scale,
                        height: canvas.height / scale,
                    });
                } else if (type === 'shape') {
                    const shapeDiv = element.querySelector('div:not(.drag-handle):not(button)');
                    if (shapeDiv) {
                        const rect = element.getBoundingClientRect();
                        const pageContainer = element.parentElement;
                        const canvas = pageContainer.querySelector('canvas');
                        if (!canvas) {
                            console.warn('Canvas not found for shape');
                            continue;
                        }
                        const canvasRect = canvas.getBoundingClientRect();

                        const x = (rect.left - canvasRect.left) / scale;
                        const y = (rect.top - canvasRect.top) / scale;
                        const width = shapeDiv.offsetWidth / scale;
                        const height = shapeDiv.offsetHeight / scale;

                        const color = hexToRgb(annotation.color);

                        if (annotation.subtype === 'rectangle') {
                            targetPage.drawRectangle({
                                x: x,
                                y: targetPage.getHeight() - y - height,
                                width: width,
                                height: height,
                                borderColor: rgb(color.r / 255, color.g / 255, color.b / 255),
                                borderWidth: 2,
                            });
                        } else if (annotation.subtype === 'circle') {
                            const centerX = x + width / 2;
                            const centerY = targetPage.getHeight() - y - height / 2;

                            targetPage.drawEllipse({
                                x: centerX,
                                y: centerY,
                                xScale: width / 2,
                                yScale: height / 2,
                                borderColor: rgb(color.r / 255, color.g / 255, color.b / 255),
                                borderWidth: 2,
                            });
                        } else if (annotation.subtype === 'line' || annotation.subtype === 'arrow') {
                            // Get container position relative to page, then subtract canvas offset
                            const containerLeft = parseFloat(element.style.left) || 0;
                            const containerTop = parseFloat(element.style.top) || 0;

                            // Get canvas position relative to page container
                            const canvasRect = canvas.getBoundingClientRect();
                            const pageRect = pageContainer.getBoundingClientRect();
                            const canvasOffsetX = canvasRect.left - pageRect.left;
                            const canvasOffsetY = canvasRect.top - pageRect.top;

                            // Calculate arrow start position relative to canvas
                            const startX = (containerLeft - canvasOffsetX) / scale;
                            const startY = (containerTop - canvasOffsetY) / scale;

                            const transform = shapeDiv.style.transform;
                            const rotation = parseFloat(transform.match(/rotate\(([-\d.]+)deg\)/)?.[1] || 0);
                            // Get line width from container, not cloned element (which has width='100%')
                            const lineWidth = parseFloat(element.style.width) || element.offsetWidth;

                            const rad = rotation * Math.PI / 180;
                            const x2 = startX + (lineWidth / scale) * Math.cos(rad);
                            const y2 = startY + (lineWidth / scale) * Math.sin(rad);

                            targetPage.drawLine({
                                start: { x: startX, y: targetPage.getHeight() - startY },
                                end: { x: x2, y: targetPage.getHeight() - y2 },
                                thickness: 2,
                                color: rgb(color.r / 255, color.g / 255, color.b / 255),
                            });

                            if (annotation.subtype === 'arrow') {
                                const arrowSize = 8;
                                const angle1 = rad - Math.PI / 6;
                                const angle2 = rad + Math.PI / 6;

                                targetPage.drawLine({
                                    start: { x: x2, y: targetPage.getHeight() - y2 },
                                    end: { x: x2 - arrowSize * Math.cos(angle1), y: targetPage.getHeight() - (y2 - arrowSize * Math.sin(angle1)) },
                                    thickness: 2,
                                    color: rgb(color.r / 255, color.g / 255, color.b / 255),
                                });

                                targetPage.drawLine({
                                    start: { x: x2, y: targetPage.getHeight() - y2 },
                                    end: { x: x2 - arrowSize * Math.cos(angle2), y: targetPage.getHeight() - (y2 - arrowSize * Math.sin(angle2)) },
                                    thickness: 2,
                                    color: rgb(color.r / 255, color.g / 255, color.b / 255),
                                });
                            }
                        }
                    }
                } else if (type === 'note') {
                    const rect = element.getBoundingClientRect();
                    const pageContainer = element.parentElement;
                    const canvas = pageContainer.querySelector('canvas');
                    if (!canvas) {
                        console.warn('Canvas not found for note');
                        continue;
                    }
                    const canvasRect = canvas.getBoundingClientRect();

                    const x = (rect.left - canvasRect.left) / scale;
                    const y = (rect.top - canvasRect.top) / scale;

                    // Get text from the data attribute on the note icon
                    const noteIcon = element.querySelector('.sticky-note-icon');
                    const noteText = noteIcon ? (noteIcon.getAttribute('data-note-text') || annotation.text || '') : (annotation.text || '');

                    if (noteText && noteText.trim()) {
                        // Draw sticky note with text inside
                        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                        const fontSize = 9;
                        const maxWidth = 120;
                        const padding = 5;

                        // Word wrap the text with character-level breaking for long words
                        const words = noteText.split(' ');
                        const lines = [];
                        let currentLine = '';
                        const maxLineWidth = maxWidth - (padding * 2);

                        for (const word of words) {
                            const testLine = currentLine ? currentLine + ' ' + word : word;
                            const testWidth = font.widthOfTextAtSize(testLine, fontSize);

                            if (testWidth <= maxLineWidth) {
                                // Word fits on current line
                                currentLine = testLine;
                            } else {
                                // Word doesn't fit
                                const wordWidth = font.widthOfTextAtSize(word, fontSize);

                                if (wordWidth <= maxLineWidth) {
                                    // Word fits on its own line
                                    if (currentLine) {
                                        lines.push(currentLine);
                                    }
                                    currentLine = word;
                                } else {
                                    // Word is too long, need character-level breaking
                                    if (currentLine) {
                                        lines.push(currentLine);
                                        currentLine = '';
                                    }

                                    // Break the long word character by character
                                    let remainingWord = word;
                                    while (remainingWord.length > 0) {
                                        let chunk = '';
                                        for (let i = 1; i <= remainingWord.length; i++) {
                                            const testChunk = remainingWord.substring(0, i);
                                            if (font.widthOfTextAtSize(testChunk, fontSize) <= maxLineWidth) {
                                                chunk = testChunk;
                                            } else {
                                                break;
                                            }
                                        }
                                        if (chunk.length === 0) {
                                            // Even single character doesn't fit, take at least one char
                                            chunk = remainingWord.substring(0, 1);
                                        }
                                        lines.push(chunk);
                                        remainingWord = remainingWord.substring(chunk.length);
                                    }
                                }
                            }
                        }
                        if (currentLine) {
                            lines.push(currentLine);
                        }

                        const lineHeight = fontSize + 2;
                        const noteHeight = Math.max(40, lines.length * lineHeight + padding * 2);
                        const noteWidth = maxWidth;

                        // Draw the sticky note background
                        targetPage.drawRectangle({
                            x: x,
                            y: targetPage.getHeight() - y - noteHeight,
                            width: noteWidth,
                            height: noteHeight,
                            color: rgb(1, 0.96, 0.7),
                            borderColor: rgb(1, 0.8, 0.2),
                            borderWidth: 1,
                        });

                        // Draw text lines inside the note
                        lines.forEach((line, index) => {
                            targetPage.drawText(line, {
                                x: x + padding,
                                y: targetPage.getHeight() - y - padding - (index + 1) * lineHeight,
                                font: font,
                                size: fontSize,
                                color: rgb(0, 0, 0),
                            });
                        });
                    } else {
                        // Draw empty sticky note (just the icon)
                        targetPage.drawRectangle({
                            x: x,
                            y: targetPage.getHeight() - y - 30,
                            width: 30,
                            height: 30,
                            color: rgb(1, 0.84, 0),
                            borderColor: rgb(1, 0.65, 0),
                            borderWidth: 1,
                        });
                    }
                } else if (type === 'text-decoration') {
                    const decorationDiv = element.querySelector('div:not(.drag-handle):not(button)');
                    if (decorationDiv) {
                        const rect = element.getBoundingClientRect();
                        const pageContainer = element.parentElement;
                        const canvas = pageContainer.querySelector('canvas');
                        if (!canvas) {
                            console.warn('Canvas not found for decoration');
                            continue;
                        }
                        const canvasRect = canvas.getBoundingClientRect();

                        const x = (rect.left - canvasRect.left) / scale;
                        const y = (rect.top - canvasRect.top) / scale;
                        // Use offsetWidth from the container element instead of style
                        const width = element.offsetWidth / scale;

                        const color = hexToRgb(annotation.color);

                        targetPage.drawLine({
                            start: { x: x, y: targetPage.getHeight() - y },
                            end: { x: x + width, y: targetPage.getHeight() - y },
                            thickness: 2,
                            color: rgb(color.r / 255, color.g / 255, color.b / 255),
                        });
                    }
                }
            } catch (error) {
                console.error(`Error processing ${annotation.type} annotation:`, error);
                // Continue with other annotations
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'annotated.pdf';
        link.click();
    } catch (error) {
        console.error('Error saving PDF:', error);
        alert(`Error saving PDF: ${error.message}. Check console for details.`);
    }
}
// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 0 }; // Default yellow
}

// Premium feature state
let isPremiumUser = false;
let currentActiveTool = null;
let selectedShape = 'rectangle';

window.addEventListener('DOMContentLoaded', async () => {
    const openPdfButton = document.getElementById('open-pdf');
    const fileInput = document.getElementById('file-input');
    const addTextButton = document.getElementById('add-text');
    const manageSignatureButton = document.getElementById('manage-signature');
    const addSignatureButton = document.getElementById('add-signature');
    const resetBtn = document.getElementById('reset-btn');
    const savePdfButton = document.getElementById('save-pdf');
    const signatureModal = document.getElementById('signature-modal');
    const signatureCanvas = document.getElementById('signature-canvas');
    const saveSignatureButton = document.getElementById('save-signature');
    const clearSignatureButton = document.getElementById('clear-signature');
    const closeModalButton = document.getElementById('close-modal');

    // Premium UI elements
    const upgradeBtn = document.getElementById('upgrade-btn');
    const upgradeModal = document.getElementById('upgrade-modal');
    const closeUpgradeModal = document.getElementById('close-upgrade-modal');
    const purchaseBtn = document.getElementById('purchase-btn');
    const activateLicenseBtn = document.getElementById('activate-license-btn');
    const licenseKeyInput = document.getElementById('license-key-input');

    // Premium tool buttons
    const highlightBtn = document.getElementById('highlight-btn');
    const drawBtn = document.getElementById('draw-btn');
    const shapesBtn = document.getElementById('shapes-btn');
    const notesBtn = document.getElementById('notes-btn');
    const decorationBtn = document.getElementById('decoration-btn');

    // Color picker
    const colorPicker = document.getElementById('color-picker');
    const colorButtons = document.querySelectorAll('.color-btn');

    // Shape selector
    const shapeSelector = document.getElementById('shape-selector');
    const shapeButtons = document.querySelectorAll('#shape-selector button');

    signaturePad = new SignaturePad(signatureCanvas);
    chrome.storage.local.get('signature', (result) => {
        if (result.signature) {
            savedSignature = result.signature;
        }
    });

    // Initialize license status
    await initializePremiumStatus();

    // Free feature event listeners
    openPdfButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
        if (event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        if (file.type !== 'application/pdf') {
            console.error('Not a PDF file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            originalPdfBytes = e.target.result;
            const typedarray = new Uint8Array(originalPdfBytes);
            renderPdf(typedarray);
        };
        reader.readAsArrayBuffer(file);
    });

    addTextButton.addEventListener('click', () => {
        // Deactivate any active annotation tool before adding text
        annotationManager.setTool(null);
        setActiveTool(null);
        colorPicker.style.display = 'none';
        addDraggableText();
    });

    manageSignatureButton.addEventListener('click', () => {
        signatureModal.style.display = 'flex';
        if (savedSignature) {
            signaturePad.fromDataURL(savedSignature);
        }
    });

    addSignatureButton.addEventListener('click', () => {
        if (savedSignature) {
            // Deactivate any active annotation tool before adding signature
            annotationManager.setTool(null);
            setActiveTool(null);
            colorPicker.style.display = 'none';
            addDraggableSignature(savedSignature);
        } else {
            alert('Please save a signature first.');
        }
    });

    savePdfButton.addEventListener('click', () => {
        savePdf();
    });

    resetBtn.addEventListener('click', () => {
        resetAll();
    });

    closeModalButton.addEventListener('click', () => {
        signatureModal.style.display = 'none';
    });

    clearSignatureButton.addEventListener('click', () => {
        signaturePad.clear();
        chrome.storage.local.remove('signature');
        savedSignature = null;
    });

    saveSignatureButton.addEventListener('click', () => {
        if (signaturePad.isEmpty()) {
            alert('Please provide a signature first.');
        } else {
            const dataURL = signaturePad.toDataURL();
            chrome.storage.local.set({ signature: dataURL }, () => {
                savedSignature = dataURL;
                alert('Signature saved!');
                signatureModal.style.display = 'none';
            });
        }
    });

    // Premium feature event listeners
    upgradeBtn.addEventListener('click', () => {
        upgradeModal.style.display = 'flex';
    });

    closeUpgradeModal.addEventListener('click', () => {
        upgradeModal.style.display = 'none';
    });

    purchaseBtn.addEventListener('click', async () => {
        // In production, this would integrate with payment processor (Stripe, PayPal, etc.)
        // For now, we'll simulate purchase
        const confirmPurchase = confirm('Simulate purchase of QuickMark PDF Pro for $3.99?');
        if (confirmPurchase) {
            await licenseManager.activatePremium();
            alert('Thank you for your purchase! Premium features are now unlocked.');
            upgradeModal.style.display = 'none';
            await initializePremiumStatus();
        }
    });

    activateLicenseBtn.addEventListener('click', async () => {
        const key = licenseKeyInput.value.trim();
        if (!key) {
            alert('Please enter a license key.');
            return;
        }

        try {
            await licenseManager.activatePremium(key);
            alert('License activated successfully! Premium features are now unlocked.');
            upgradeModal.style.display = 'none';
            licenseKeyInput.value = '';
            await initializePremiumStatus();
        } catch (error) {
            alert('Invalid license key. Please check and try again.');
        }
    });

    // Premium tool buttons with feature gating
    highlightBtn.addEventListener('click', async () => {
        if (!await checkPremiumAccess('highlight')) return;
        setActiveTool('highlight');
        colorPicker.style.display = 'inline-flex';
        annotationManager.setTool('highlight');
        setupPageInteractions();
    });

    drawBtn.addEventListener('click', async () => {
        if (!await checkPremiumAccess('draw')) return;
        setActiveTool('draw');
        colorPicker.style.display = 'inline-flex';
        annotationManager.setTool('draw');
        setupDrawingCanvases();
    });

    shapesBtn.addEventListener('click', async (e) => {
        if (!await checkPremiumAccess('shapes')) return;
        // Show shape selector popup
        const rect = shapesBtn.getBoundingClientRect();
        shapeSelector.style.display = 'block';
        shapeSelector.style.left = rect.left + 'px';
        shapeSelector.style.top = (rect.bottom + 5) + 'px';
    });

    notesBtn.addEventListener('click', async () => {
        if (!await checkPremiumAccess('notes')) return;
        setActiveTool('notes');
        colorPicker.style.display = 'none';
        annotationManager.setTool('notes');
        setupNotesMode();
    });

    decorationBtn.addEventListener('click', async () => {
        if (!await checkPremiumAccess('text-decoration')) return;
        setActiveTool('decoration');
        colorPicker.style.display = 'inline-flex';
        annotationManager.setTool('text-decoration');
        setupTextDecorationMode();
    });

    // Color picker event listeners
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.getAttribute('data-color');
            annotationManager.setColor(color);
        });
    });

    // Set default color
    colorButtons[0].classList.add('active');

    // Shape selector event listeners
    shapeButtons.forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!await checkPremiumAccess('shapes')) return;
            selectedShape = btn.getAttribute('data-shape');
            shapeSelector.style.display = 'none';
            setActiveTool('shapes');
            colorPicker.style.display = 'inline-flex';
            annotationManager.setTool('shapes');
            setupShapeMode(selectedShape);
        });
    });

    // Close shape selector when clicking outside
    document.addEventListener('click', (e) => {
        if (!shapesBtn.contains(e.target) && !shapeSelector.contains(e.target)) {
            shapeSelector.style.display = 'none';
        }
    });
});

async function initializePremiumStatus() {
    isPremiumUser = await licenseManager.checkPremiumStatus();
    updatePremiumUI();
}

function updatePremiumUI() {
    const premiumButtons = document.querySelectorAll('.premium');

    if (isPremiumUser) {
        premiumButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('locked');
        });
        document.getElementById('upgrade-btn').style.display = 'none';
    } else {
        premiumButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('locked');
        });
        document.getElementById('upgrade-btn').style.display = 'block';
    }
}

async function checkPremiumAccess(feature) {
    const hasAccess = await licenseManager.hasFeatureAccess(feature);
    if (!hasAccess) {
        licenseManager.showUpgradeModal();
        return false;
    }
    return true;
}

function setActiveTool(toolName) {
    // Clear previous active tool styling
    const allTools = document.querySelectorAll('#toolbar button.premium');
    allTools.forEach(btn => btn.style.border = 'none');

    // Set active tool styling if toolName is provided
    if (toolName) {
        const activeButton = document.getElementById(`${toolName}-btn`);
        if (activeButton) {
            activeButton.style.border = '3px solid #FFD700';
        }
    }

    currentActiveTool = toolName;
}

function setupPageInteractions() {
    // Setup highlight mode for all pages
    const pageContainers = document.querySelectorAll('.page-container');
    pageContainers.forEach((container, index) => {
        const pageNumber = parseInt(container.getAttribute('data-page-number'));
        annotationManager.addHighlight(pageNumber);
    });
}

function setupDrawingCanvases() {
    // Setup drawing canvases for all pages
    const pageContainers = document.querySelectorAll('.page-container');
    pageContainers.forEach((container, index) => {
        const pageNumber = parseInt(container.getAttribute('data-page-number'));
        annotationManager.initDrawingCanvas(pageNumber);
    });
}

function setupShapeMode(shapeType) {
    // Setup shape drawing for all pages
    const pageContainers = document.querySelectorAll('.page-container');
    pageContainers.forEach((container, index) => {
        const pageNumber = parseInt(container.getAttribute('data-page-number'));
        annotationManager.addShape(shapeType, pageNumber);
    });
}

function setupNotesMode() {
    // Setup notes mode - click to place sticky notes
    const pageContainers = document.querySelectorAll('.page-container');
    pageContainers.forEach((container, index) => {
        const pageNumber = parseInt(container.getAttribute('data-page-number'));

        const clickHandler = (e) => {
            if (currentActiveTool !== 'notes') return;

            // Don't create a new note if we just finished dragging
            if (annotationManager.isDragging) return;

            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            annotationManager.addStickyNote(pageNumber, x, y);
        };

        container.addEventListener('click', clickHandler);
    });
}

function setupTextDecorationMode() {
    // Setup text decoration mode for all pages
    const pageContainers = document.querySelectorAll('.page-container');
    pageContainers.forEach((container, index) => {
        const pageNumber = parseInt(container.getAttribute('data-page-number'));
        annotationManager.addTextDecoration('line', pageNumber);
    });
}
