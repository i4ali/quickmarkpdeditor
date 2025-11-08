// Annotation Tools Implementation for QuickMark PDF Premium
// Includes: Highlighting, Drawing, Shapes, Sticky Notes, Text Decorations

class AnnotationManager {
    constructor() {
        this.currentTool = null;
        this.currentColor = '#FFFF00'; // Default yellow
        this.drawingCanvas = null;
        this.isDrawing = false;
        this.annotations = [];
        this.tempShape = null;
        this.isDragging = false;
    }

    setTool(toolName) {
        this.currentTool = toolName;
        this.clearTempDrawings();
    }

    setColor(color) {
        this.currentColor = color;
    }

    clearTempDrawings() {
        if (this.tempShape) {
            this.tempShape.remove();
            this.tempShape = null;
        }

        // Only hide temporary highlight overlays that are direct children of page-container
        // (saved highlights are inside annotation containers with drag-handles)
        document.querySelectorAll('.page-container > .highlight-overlay').forEach(overlay => {
            overlay.style.display = 'none';
            overlay.style.visibility = 'hidden';
            overlay.style.opacity = '0';
            overlay.style.width = '0px';
            overlay.style.height = '0px';
        });

        // Remove any leftover temporary shape elements
        document.querySelectorAll('.shape-rectangle, .shape-circle, .shape-line, .shape-arrow').forEach(el => {
            // Only remove if it's not inside an annotation container (has drag-handle sibling)
            const parent = el.parentElement;
            if (parent && !parent.querySelector('.drag-handle')) {
                el.remove();
            }
        });

        // Remove any temporary decoration elements (they have no class but specific styling)
        document.querySelectorAll('.page-container > div').forEach(el => {
            // Check if it's a temporary element (no drag-handle, positioned absolute, has specific styling)
            if (el.style.position === 'absolute' &&
                el.style.height === '2px' &&
                el.style.backgroundColor &&
                el.style.pointerEvents === 'none' &&
                !el.querySelector('.drag-handle') &&
                !el.classList.contains('highlight-overlay') &&
                !el.className.startsWith('shape-')) {
                el.remove();
            }
        });
    }

    // HIGHLIGHTING TOOL
    addHighlight(pageNumber) {
        const pageContainer = document.querySelector(`.page-container[data-page-number="${pageNumber}"]`);

        // Check if highlight listeners are already attached to this page
        if (pageContainer.dataset.highlightEnabled === 'true') {
            // Just update the overlay color if it exists
            const existingOverlay = pageContainer.querySelector('.highlight-overlay');
            if (existingOverlay) {
                existingOverlay.style.backgroundColor = this.currentColor;
            }
            return;
        }

        // Mark this page as having highlight listeners
        pageContainer.dataset.highlightEnabled = 'true';

        // Check if highlight overlay already exists for this page
        let highlightOverlay = pageContainer.querySelector('.highlight-overlay');
        if (highlightOverlay) {
            // Remove existing overlay and re-create with current color
            highlightOverlay.remove();
        }

        highlightOverlay = document.createElement('div');
        highlightOverlay.className = 'highlight-overlay';
        highlightOverlay.style.position = 'absolute';
        highlightOverlay.style.display = 'none';
        highlightOverlay.style.backgroundColor = this.currentColor;
        highlightOverlay.style.opacity = '0.4';
        highlightOverlay.style.pointerEvents = 'none';
        pageContainer.appendChild(highlightOverlay);

        let startX, startY;

        const onMouseDown = (e) => {
            if (this.currentTool !== 'highlight') return;

            const rect = pageContainer.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            highlightOverlay.style.backgroundColor = this.currentColor; // Use current color
            highlightOverlay.style.left = startX + 'px';
            highlightOverlay.style.top = startY + 'px';
            highlightOverlay.style.width = '0px';
            highlightOverlay.style.height = '0px';
            highlightOverlay.style.display = 'block';
        };

        const onMouseMove = (e) => {
            if (this.currentTool !== 'highlight' || !startX) return;

            const rect = pageContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            const left = Math.min(startX, currentX);
            const top = Math.min(startY, currentY);

            highlightOverlay.style.left = left + 'px';
            highlightOverlay.style.top = top + 'px';
            highlightOverlay.style.width = width + 'px';
            highlightOverlay.style.height = height + 'px';
        };

        const onMouseUp = (e) => {
            if (this.currentTool !== 'highlight' || !startX) return;

            const container = this.createAnnotationContainer(highlightOverlay, pageNumber, 'highlight');
            pageContainer.appendChild(container);

            this.annotations.push({
                type: 'highlight',
                element: container,
                page: pageNumber,
                color: this.currentColor
            });

            // Hide the overlay instead of removing it so it can be reused
            highlightOverlay.style.display = 'none';
            startX = null;
            startY = null;
        };

        pageContainer.addEventListener('mousedown', onMouseDown);
        pageContainer.addEventListener('mousemove', onMouseMove);
        pageContainer.addEventListener('mouseup', onMouseUp);
    }

    // FREEHAND DRAWING TOOL
    initDrawingCanvas(pageNumber) {
        const pageContainer = document.querySelector(`.page-container[data-page-number="${pageNumber}"]`);

        // Remove existing canvas if it exists to ensure fresh creation with correct dimensions
        const existingCanvas = pageContainer.querySelector('.drawing-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        const newCanvas = document.createElement('canvas');
        newCanvas.className = 'drawing-canvas';
        newCanvas.style.position = 'absolute';
        newCanvas.style.pointerEvents = 'auto';
        newCanvas.style.cursor = 'crosshair';

        const pdfCanvas = pageContainer.querySelector('canvas');

        // Get the actual displayed dimensions and position of the PDF canvas
        const pdfRect = pdfCanvas.getBoundingClientRect();
        const containerRect = pageContainer.getBoundingClientRect();

        // Calculate PDF canvas offset relative to page container
        const leftOffset = pdfRect.left - containerRect.left;
        const topOffset = pdfRect.top - containerRect.top;

        // Position drawing canvas to align with PDF canvas
        newCanvas.style.left = leftOffset + 'px';
        newCanvas.style.top = topOffset + 'px';

        // Set canvas internal resolution to match PDF canvas
        newCanvas.width = pdfCanvas.width;
        newCanvas.height = pdfCanvas.height;

        // Set canvas display size to match PDF canvas display size
        newCanvas.style.width = pdfRect.width + 'px';
        newCanvas.style.height = pdfRect.height + 'px';


        pageContainer.appendChild(newCanvas);
        this.setupDrawingEvents(newCanvas, pageNumber);
    }

    setupDrawingEvents(canvas, pageNumber) {
        const ctx = canvas.getContext('2d');
        let drawing = false;
        let lastX = 0;
        let lastY = 0;

        canvas.addEventListener('mousedown', (e) => {
            if (this.currentTool !== 'draw') return;
            drawing = true;
            const rect = canvas.getBoundingClientRect();
            // Scale coordinates from display size to canvas internal size
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            lastX = (e.clientX - rect.left) * scaleX;
            lastY = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!drawing || this.currentTool !== 'draw') return;

            const rect = canvas.getBoundingClientRect();
            // Scale coordinates from display size to canvas internal size
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            ctx.strokeStyle = this.currentColor;
            ctx.lineWidth = 3; // Slightly thicker for better visibility
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            lastX = x;
            lastY = y;
        });

        canvas.addEventListener('mouseup', () => {
            if (drawing) {
                drawing = false;
                // Save the drawing
                this.annotations.push({
                    type: 'drawing',
                    element: canvas,
                    page: pageNumber,
                    dataUrl: canvas.toDataURL()
                });
            }
        });

        canvas.addEventListener('mouseleave', () => {
            drawing = false;
        });
    }

    // SHAPES TOOL (Rectangle, Circle, Arrow, Line)
    addShape(shapeType, pageNumber) {
        const pageContainer = document.querySelector(`.page-container[data-page-number="${pageNumber}"]`);

        // Check if shape listeners are already attached to this page
        if (pageContainer.dataset.shapeEnabled === 'true') {
            // Just store the new shape type, don't add duplicate listeners
            pageContainer.dataset.currentShape = shapeType;
            return;
        }

        // Mark this page as having shape listeners
        pageContainer.dataset.shapeEnabled = 'true';
        pageContainer.dataset.currentShape = shapeType;

        let startX, startY;
        let shapeElement;

        const onMouseDown = (e) => {
            if (this.currentTool !== 'shapes') return;

            // Get current shape type from dataset
            const currentShapeType = pageContainer.dataset.currentShape;

            const rect = pageContainer.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            shapeElement = document.createElement('div');
            shapeElement.className = `shape-${currentShapeType}`;
            shapeElement.style.position = 'absolute';
            shapeElement.style.border = `2px solid ${this.currentColor}`;
            shapeElement.style.pointerEvents = 'none';

            if (currentShapeType === 'rectangle') {
                shapeElement.style.backgroundColor = 'transparent';
            } else if (currentShapeType === 'circle') {
                shapeElement.style.borderRadius = '50%';
                shapeElement.style.backgroundColor = 'transparent';
            }

            pageContainer.appendChild(shapeElement);
        };

        const onMouseMove = (e) => {
            if (this.currentTool !== 'shapes' || !startX || !shapeElement) return;

            // Get current shape type from dataset
            const currentShapeType = pageContainer.dataset.currentShape;

            const rect = pageContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            if (currentShapeType === 'rectangle' || currentShapeType === 'circle') {
                const width = Math.abs(currentX - startX);
                const height = Math.abs(currentY - startY);
                const left = Math.min(startX, currentX);
                const top = Math.min(startY, currentY);

                shapeElement.style.left = left + 'px';
                shapeElement.style.top = top + 'px';
                shapeElement.style.width = width + 'px';
                shapeElement.style.height = height + 'px';
            } else if (currentShapeType === 'line' || currentShapeType === 'arrow') {
                this.drawLine(shapeElement, startX, startY, currentX, currentY, currentShapeType === 'arrow');
            }
        };

        const onMouseUp = (e) => {
            if (this.currentTool !== 'shapes' || !startX || !shapeElement) return;

            // Get current shape type from dataset
            const currentShapeType = pageContainer.dataset.currentShape;

            const container = this.createAnnotationContainer(shapeElement, pageNumber, 'shape');
            pageContainer.appendChild(container);

            this.annotations.push({
                type: 'shape',
                subtype: currentShapeType,
                element: container,
                page: pageNumber,
                color: this.currentColor
            });

            shapeElement.remove();
            shapeElement = null;
            startX = null;
            startY = null;
        };

        pageContainer.addEventListener('mousedown', onMouseDown);
        pageContainer.addEventListener('mousemove', onMouseMove);
        pageContainer.addEventListener('mouseup', onMouseUp);
    }

    drawLine(element, x1, y1, x2, y2, hasArrow) {
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        element.style.width = length + 'px';
        element.style.height = '2px';
        element.style.backgroundColor = this.currentColor;
        element.style.border = 'none';
        element.style.left = x1 + 'px';
        element.style.top = y1 + 'px';
        element.style.transformOrigin = '0 0';
        element.style.transform = `rotate(${angle}deg)`;

        if (hasArrow) {
            // Add arrow head (simplified triangle)
            element.innerHTML = `<div style="position:absolute;right:-8px;top:-4px;width:0;height:0;border-left:8px solid ${this.currentColor};border-top:5px solid transparent;border-bottom:5px solid transparent;"></div>`;
        }
    }

    // STICKY NOTES TOOL
    addStickyNote(pageNumber, x, y, text = '') {
        const pageContainer = document.querySelector(`.page-container[data-page-number="${pageNumber}"]`);

        const noteIcon = document.createElement('div');
        noteIcon.className = 'sticky-note-icon';
        noteIcon.style.position = 'absolute';
        noteIcon.style.left = x + 'px';
        noteIcon.style.top = y + 'px';
        noteIcon.style.width = '30px';
        noteIcon.style.height = '30px';
        noteIcon.style.backgroundColor = '#FFD700';
        noteIcon.style.border = '2px solid #FFA500';
        noteIcon.style.borderRadius = '4px';
        noteIcon.style.cursor = 'pointer';
        noteIcon.style.display = 'flex';
        noteIcon.style.alignItems = 'center';
        noteIcon.style.justifyContent = 'center';
        noteIcon.style.fontSize = '18px';
        noteIcon.innerHTML = '📝';
        // Store actual text in data attribute
        noteIcon.setAttribute('data-note-text', text);
        // Set tooltip - show text if exists, otherwise show instruction
        noteIcon.title = text ? text : 'Click to add/edit note';

        const container = this.createAnnotationContainer(noteIcon, pageNumber, 'note');
        pageContainer.appendChild(container);

        // Find the cloned note icon inside the container and make it clickable
        const clonedNoteIcon = container.querySelector('.sticky-note-icon');
        if (clonedNoteIcon) {
            clonedNoteIcon.style.pointerEvents = 'auto';
            clonedNoteIcon.style.zIndex = '999'; // Ensure it's above other elements

            // Create custom tooltip element
            const tooltip = document.createElement('div');
            tooltip.className = 'note-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
            tooltip.style.color = 'white';
            tooltip.style.padding = '6px 10px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.fontSize = '12px';
            tooltip.style.maxWidth = '200px';
            tooltip.style.wordWrap = 'break-word';
            tooltip.style.zIndex = '10000';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.display = 'none';
            tooltip.style.whiteSpace = 'pre-wrap';
            document.body.appendChild(tooltip);

            // Show tooltip on hover
            clonedNoteIcon.addEventListener('mouseenter', (e) => {
                const noteText = clonedNoteIcon.getAttribute('data-note-text') || '';
                tooltip.textContent = noteText ? noteText : 'Click to add/edit note';
                tooltip.style.display = 'block';

                // Position tooltip near the note
                const rect = clonedNoteIcon.getBoundingClientRect();
                tooltip.style.left = (rect.right + 10) + 'px';
                tooltip.style.top = rect.top + 'px';
            });

            clonedNoteIcon.addEventListener('mouseleave', (e) => {
                tooltip.style.display = 'none';
            });

            // Prevent mousedown from bubbling (which would create new note)
            clonedNoteIcon.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();
            });

            clonedNoteIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                // Hide tooltip during edit
                tooltip.style.display = 'none';

                // Get current text from data attribute
                const currentText = clonedNoteIcon.getAttribute('data-note-text') || '';
                const newText = prompt('Enter your note:', currentText);
                if (newText !== null) {
                    // Update data attribute
                    clonedNoteIcon.setAttribute('data-note-text', newText);
                    // Update annotation
                    const annotation = this.annotations.find(a => a.element === container);
                    if (annotation) {
                        annotation.text = newText;
                    }
                }
            });

            // Store tooltip reference for cleanup
            container._tooltip = tooltip;
        }

        this.annotations.push({
            type: 'note',
            element: container,
            page: pageNumber,
            text: text,
            x: x,
            y: y
        });
    }

    // TEXT DECORATIONS (Strikethrough, Underline)
    addTextDecoration(decorationType, pageNumber) {
        const pageContainer = document.querySelector(`.page-container[data-page-number="${pageNumber}"]`);
        let startX, startY;
        let decorationElement;

        const onMouseDown = (e) => {
            if (this.currentTool !== 'text-decoration') return;

            const rect = pageContainer.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;

            decorationElement = document.createElement('div');
            decorationElement.style.position = 'absolute';
            decorationElement.style.height = '2px';
            decorationElement.style.backgroundColor = this.currentColor;
            decorationElement.style.pointerEvents = 'none';

            pageContainer.appendChild(decorationElement);
        };

        const onMouseMove = (e) => {
            if (this.currentTool !== 'text-decoration' || !startX || !decorationElement) return;

            const rect = pageContainer.getBoundingClientRect();
            const currentX = e.clientX - rect.left;

            const width = Math.abs(currentX - startX);
            const left = Math.min(startX, currentX);

            decorationElement.style.left = left + 'px';
            decorationElement.style.top = startY + 'px';
            decorationElement.style.width = width + 'px';
        };

        const onMouseUp = (e) => {
            if (this.currentTool !== 'text-decoration' || !startX || !decorationElement) return;

            const container = this.createAnnotationContainer(decorationElement, pageNumber, 'decoration');
            pageContainer.appendChild(container);

            this.annotations.push({
                type: 'text-decoration',
                subtype: decorationType,
                element: container,
                page: pageNumber,
                color: this.currentColor
            });

            decorationElement.remove();
            decorationElement = null;
            startX = null;
            startY = null;
        };

        pageContainer.addEventListener('mousedown', onMouseDown);
        pageContainer.addEventListener('mousemove', onMouseMove);
        pageContainer.addEventListener('mouseup', onMouseUp);
    }

    // Helper function to create annotation container with drag and delete
    createAnnotationContainer(element, pageNumber, type) {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = element.style.left;
        container.style.top = element.style.top;
        container.style.width = element.style.width || element.offsetWidth + 'px';
        container.style.height = element.style.height || element.offsetHeight + 'px';

        // Clone the element
        const clonedElement = element.cloneNode(true);
        clonedElement.style.position = 'relative';
        clonedElement.style.left = '0';
        clonedElement.style.top = '0';
        clonedElement.style.width = '100%';
        clonedElement.style.height = '100%';
        clonedElement.style.pointerEvents = 'none'; // Keep pointer-events none for the annotation itself

        // Add drag handle
        const handle = document.createElement('div');
        handle.className = 'drag-handle';
        handle.style.width = '15px';
        handle.style.height = '15px';
        handle.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
        handle.style.cursor = 'move';
        handle.style.position = 'absolute';
        handle.style.top = '-15px';
        handle.style.left = '-15px';
        handle.style.borderRadius = '50%';
        handle.style.zIndex = '1000';
        handle.style.pointerEvents = 'auto';

        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = '×';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.top = '-15px';
        deleteBtn.style.right = '-15px';
        deleteBtn.style.width = '20px';
        deleteBtn.style.height = '20px';
        deleteBtn.style.background = 'red';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '14px';
        deleteBtn.style.lineHeight = '1';
        deleteBtn.style.padding = '0';
        deleteBtn.style.zIndex = '1001';
        deleteBtn.style.pointerEvents = 'auto';

        // Prevent mousedown from bubbling to page container (which would start a new highlight/shape)
        deleteBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            e.preventDefault();
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            // Clean up tooltip if it exists
            if (container._tooltip) {
                container._tooltip.remove();
            }
            container.remove();
            this.annotations = this.annotations.filter(a => a.element !== container);
        });

        container.appendChild(handle);
        container.appendChild(deleteBtn);
        container.appendChild(clonedElement);

        // Make draggable
        this.makeDraggable(container);

        return container;
    }

    makeDraggable(element) {
        let offsetX, offsetY;
        let hasMoved = false;
        const handle = element.querySelector('.drag-handle');
        const self = this;

        handle.onmousedown = (e) => {
            e.preventDefault();
            e.stopPropagation();

            hasMoved = false;
            self.isDragging = false;

            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

        function elementDrag(e) {
            e.preventDefault();

            hasMoved = true;
            self.isDragging = true;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            element.style.left = x + 'px';
            element.style.top = y + 'px';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;

            // Set isDragging to false after a short delay to prevent click event
            if (hasMoved) {
                setTimeout(() => {
                    self.isDragging = false;
                }, 50);
            } else {
                self.isDragging = false;
            }
        }
    }

    getAnnotations() {
        return this.annotations;
    }

    clearAllAnnotations() {
        this.annotations.forEach(annotation => {
            // Clean up tooltip if it exists
            if (annotation.element._tooltip) {
                annotation.element._tooltip.remove();
            }
            annotation.element.remove();
        });
        this.annotations = [];
    }
}

// Global instance
const annotationManager = new AnnotationManager();
