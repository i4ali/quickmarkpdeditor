
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

    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfDoc.getPages();

    for (const added of addedElements) {
        const { element, type, page } = added;
        const { x, y } = getElementPosition(element);
        const targetPage = pages[page - 1];

        if (type === 'text') {
            const textDiv = element.querySelector('div[contenteditable=true]');
            const text = textDiv.innerHTML;
            targetPage.drawText(text, {
                x: x / scale,
                y: targetPage.getHeight() - y / scale - (textDiv.clientHeight / scale),
                font: await pdfDoc.embedFont(StandardFonts.Helvetica),
                size: 12 / scale,
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
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'signed.pdf';
    link.click();
}

window.addEventListener('DOMContentLoaded', () => {
    const openPdfButton = document.getElementById('open-pdf');
    const fileInput = document.getElementById('file-input');
    const addTextButton = document.getElementById('add-text');
    const manageSignatureButton = document.getElementById('manage-signature');
    const addSignatureButton = document.getElementById('add-signature');
    const savePdfButton = document.getElementById('save-pdf');
    const signatureModal = document.getElementById('signature-modal');
    const signatureCanvas = document.getElementById('signature-canvas');
    const saveSignatureButton = document.getElementById('save-signature');
    const clearSignatureButton = document.getElementById('clear-signature');
    const closeModalButton = document.getElementById('close-modal');

    signaturePad = new SignaturePad(signatureCanvas);
    chrome.storage.local.get('signature', (result) => {
        if (result.signature) {
            savedSignature = result.signature;
        }
    });

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
            addDraggableSignature(savedSignature);
        } else {
            alert('Please save a signature first.');
        }
    });

    savePdfButton.addEventListener('click', () => {
        savePdf();
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
});
