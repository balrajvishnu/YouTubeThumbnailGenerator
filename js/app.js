// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const uploadArea = document.getElementById('uploadArea');
const uploadedImages = document.getElementById('uploadedImages');
const mainHeadline = document.getElementById('mainHeadline');
const subHeadline = document.getElementById('subHeadline');
const fontFamily = document.getElementById('fontFamily');
const fontSize = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const layoutBtn = document.getElementById('layoutBtn');
const colorBtn = document.getElementById('colorBtn');
const generateBtn = document.getElementById('generateBtn');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('thumbnailCanvas');
const ctx = canvas.getContext('2d');

// Constants
const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;
const MAX_IMAGES = 5;

// State
let uploadedImagesList = [];
let currentLayoutIndex = 0;
let currentColorIndex = 0;
let mainTextPosition = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.15 };
let subTextPosition = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.85 };
let isDragging = false;
let dragTarget = null;
let lastMousePos = { x: 0, y: 0 };

// Color schemes for text
const colorSchemes = [
    {
        name: 'Pure White',
        colors: ['#FFFFFF', '#F8F8F8'],
        stroke: '#000000',
        glow: '#FFFFFF'
    },
    {
        name: 'Light Blue',
        colors: ['#E0F7FF', '#B5E8FF'],
        stroke: '#000000',
        glow: '#00A3FF'
    },
    {
        name: 'Soft Yellow',
        colors: ['#FFF9E5', '#FFE5A3'],
        stroke: '#000000',
        glow: '#FFB800'
    },
    {
        name: 'Light Pink',
        colors: ['#FFE5F1', '#FFB5D8'],
        stroke: '#000000',
        glow: '#FF69B4'
    },
    {
        name: 'Mint Green',
        colors: ['#E5FFF2', '#B5FFD8'],
        stroke: '#000000',
        glow: '#00CC77'
    },
    {
        name: 'Lavender',
        colors: ['#F5E6FF', '#E0B5FF'],
        stroke: '#000000',
        glow: '#9933FF'
    }
];

// Event Listeners
imageUpload.addEventListener('change', handleImageUpload);
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('drop', handleDrop);
uploadArea.addEventListener('dragleave', handleDragLeave);
fontSize.addEventListener('input', (e) => {
    updateFontSizeValue();
    if (uploadedImagesList.length > 0) {
        clearCanvas();
        drawImagesLayout();
        drawTextOverlays();
        drawText();
    }
});
layoutBtn.addEventListener('click', changeLayout);
colorBtn.addEventListener('click', changeColor);
generateBtn.addEventListener('click', generateThumbnail);
downloadBtn.addEventListener('click', downloadThumbnail);

// Add canvas mouse event listeners
canvas.addEventListener('mousedown', handleCanvasMouseDown);
canvas.addEventListener('mousemove', handleCanvasMouseMove);
canvas.addEventListener('mouseup', handleCanvasMouseUp);
canvas.addEventListener('mouseleave', handleCanvasMouseUp);
canvas.style.cursor = 'default';

// Initialize font size display
updateFontSizeValue();
colorBtn.textContent = `🎨 ${colorSchemes[currentColorIndex].name}`;

// Handle file upload
function handleImageUpload(e) {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
    processImageFiles(files);
}

// Handle drag and drop
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = 'var(--primary-color)';
    uploadArea.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.backgroundColor = 'transparent';
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.style.borderColor = 'var(--border-color)';
    uploadArea.style.backgroundColor = 'transparent';
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    processImageFiles(files);
}

// Process uploaded images
function processImageFiles(files) {
    if (uploadedImagesList.length + files.length > MAX_IMAGES) {
        alert(`You can only upload up to ${MAX_IMAGES} images.`);
        return;
    }

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                uploadedImagesList.push({
                    element: img,
                    file: file
                });
                displayUploadedImages();
                generateThumbnail();
            };
        };
        reader.readAsDataURL(file);
    });
}

// Display uploaded images
function displayUploadedImages() {
    uploadedImages.innerHTML = '';
    uploadedImagesList.forEach((img, index) => {
        const container = document.createElement('div');
        container.className = 'uploaded-image-container';
        
        const imgElement = document.createElement('img');
        imgElement.src = img.element.src;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-image';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = () => {
            uploadedImagesList.splice(index, 1);
            displayUploadedImages();
            if (uploadedImagesList.length > 0) {
                generateThumbnail();
            } else {
                clearCanvas();
                downloadBtn.disabled = true;
            }
        };
        
        container.appendChild(imgElement);
        container.appendChild(deleteBtn);
        uploadedImages.appendChild(container);
    });
}

// Update font size value display
function updateFontSizeValue() {
    fontSizeValue.textContent = `${fontSize.value}px`;
}

// Change layout
function changeLayout() {
    if (uploadedImagesList.length === 0) {
        alert('Please upload at least one image first.');
        return;
    }
    
    const maxLayouts = getLayoutCount();
    currentLayoutIndex = (currentLayoutIndex + 1) % maxLayouts;
    
    // Force redraw with new layout
    clearCanvas();
    drawImagesLayout();
    drawTextOverlays();
    drawText();
}

// Change color scheme
function changeColor() {
    if (uploadedImagesList.length === 0) {
        alert('Please upload at least one image first.');
        return;
    }
    currentColorIndex = (currentColorIndex + 1) % colorSchemes.length;
    colorBtn.textContent = `🎨 ${colorSchemes[currentColorIndex].name}`;
    generateThumbnail();
}

// Get number of available layouts
function getLayoutCount() {
    const count = uploadedImagesList.length;
    switch(count) {
        case 1: return 4; // Full, Left, Right, Center
        case 2: return 4; // Horizontal, Vertical, 70-30, Diagonal
        case 3: return 3; // Three image layouts
        case 4: return 2; // Grid layouts
        case 5: return 2; // Grid variations
        default: return 1;
    }
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Generate thumbnail
function generateThumbnail() {
    if (uploadedImagesList.length === 0) {
        alert('Please upload at least one image first.');
        return;
    }

    clearCanvas();
    drawImagesLayout();
    drawTextOverlays();
    drawText();
    downloadBtn.disabled = false;
}

// Draw dark overlays for text
function drawTextOverlays() {
    // Top overlay
    const gradientTop = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT * 0.3);
    gradientTop.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    gradientTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradientTop;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);

    // Bottom overlay
    const gradientBottom = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.7, 0, CANVAS_HEIGHT);
    gradientBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradientBottom.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
    ctx.fillStyle = gradientBottom;
    ctx.fillRect(0, CANVAS_HEIGHT * 0.7, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);
}

// Draw text
function drawText() {
    const mainText = mainHeadline.value;
    const subText = subHeadline.value;
    const scheme = colorSchemes[currentColorIndex];
    
    if (mainText) {
        drawTextWithEffects(mainText, mainTextPosition.x, mainTextPosition.y, scheme);
    }
    
    if (subText) {
        drawTextWithEffects(subText, subTextPosition.x, subTextPosition.y, scheme);
    }
}

// Draw text with effects
function drawTextWithEffects(text, x, y, scheme) {
    const size = parseInt(fontSize.value);
    ctx.font = `bold ${size}px ${fontFamily.value}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textWidth = ctx.measureText(text).width;
    const gradient = ctx.createLinearGradient(
        x - textWidth / 2,
        y - size/2,
        x + textWidth / 2,
        y + size/2
    );
    
    gradient.addColorStop(0, scheme.colors[0]);
    gradient.addColorStop(1, scheme.colors[1]);

    // Draw stroke
    ctx.strokeStyle = scheme.stroke;
    ctx.lineWidth = size / 8;
    ctx.strokeText(text, x, y);

    // Draw gradient text
    ctx.fillStyle = gradient;
    ctx.fillText(text, x, y);
}

// Draw images layout
function drawImagesLayout() {
    const count = uploadedImagesList.length;
    const layouts = {
        1: [
            // Full cover
            () => drawImage(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0),
            // Left side
            () => drawImage(0, 0, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT, 0),
            // Right side
            () => drawImage(CANVAS_WIDTH * 0.3, 0, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT, 0),
            // Center focus
            () => {
                const padding = CANVAS_WIDTH * 0.15;
                drawImage(padding, 0, CANVAS_WIDTH - (padding * 2), CANVAS_HEIGHT, 0);
            }
        ],
        2: [
            // Horizontal split
            () => {
                drawImage(0, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT, 0);
                drawImage(CANVAS_WIDTH/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT, 1);
            },
            // Vertical split
            () => {
                drawImage(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT/2, 0);
                drawImage(0, CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT/2, 1);
            },
            // 70-30 split
            () => {
                drawImage(0, 0, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT, 0);
                drawImage(CANVAS_WIDTH * 0.7, 0, CANVAS_WIDTH * 0.3, CANVAS_HEIGHT, 1);
            },
            // Diagonal split
            () => {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(CANVAS_WIDTH, 0);
                ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.lineTo(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT);
                ctx.closePath();
                ctx.clip();
                drawImage(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0);
                ctx.restore();

                ctx.save();
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT);
                ctx.lineTo(0, CANVAS_HEIGHT);
                ctx.closePath();
                ctx.clip();
                drawImage(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 1);
                ctx.restore();
            }
        ],
        3: [
            // One large, two small
            () => {
                drawImage(0, 0, CANVAS_WIDTH * 0.6, CANVAS_HEIGHT, 0);
                drawImage(CANVAS_WIDTH * 0.6, 0, CANVAS_WIDTH * 0.4, CANVAS_HEIGHT/2, 1);
                drawImage(CANVAS_WIDTH * 0.6, CANVAS_HEIGHT/2, CANVAS_WIDTH * 0.4, CANVAS_HEIGHT/2, 2);
            },
            // Horizontal thirds
            () => {
                const thirdWidth = CANVAS_WIDTH / 3;
                uploadedImagesList.forEach((img, i) => {
                    drawImage(i * thirdWidth, 0, thirdWidth, CANVAS_HEIGHT, i);
                });
            },
            // Center focus with sides
            () => {
                drawImage(CANVAS_WIDTH * 0.25, 0, CANVAS_WIDTH * 0.5, CANVAS_HEIGHT, 0);
                drawImage(0, 0, CANVAS_WIDTH * 0.25, CANVAS_HEIGHT, 1);
                drawImage(CANVAS_WIDTH * 0.75, 0, CANVAS_WIDTH * 0.25, CANVAS_HEIGHT, 2);
            }
        ],
        4: [
            // Grid 2x2
            () => {
                const halfWidth = CANVAS_WIDTH / 2;
                const halfHeight = CANVAS_HEIGHT / 2;
                drawImage(0, 0, halfWidth, halfHeight, 0);
                drawImage(halfWidth, 0, halfWidth, halfHeight, 1);
                drawImage(0, halfHeight, halfWidth, halfHeight, 2);
                drawImage(halfWidth, halfHeight, halfWidth, halfHeight, 3);
            },
            // One large, three small
            () => {
                drawImage(0, 0, CANVAS_WIDTH * 0.6, CANVAS_HEIGHT, 0);
                const smallWidth = CANVAS_WIDTH * 0.4;
                const smallHeight = CANVAS_HEIGHT / 3;
                for (let i = 1; i < 4; i++) {
                    drawImage(CANVAS_WIDTH * 0.6, (i-1) * smallHeight, smallWidth, smallHeight, i);
                }
            }
        ],
        5: [
            // Cross layout
            () => {
                const centerSize = CANVAS_WIDTH * 0.4;
                const sideSize = (CANVAS_WIDTH - centerSize) / 2;
                // Center
                drawImage(sideSize, 0, centerSize, CANVAS_HEIGHT, 0);
                // Left side
                drawImage(0, 0, sideSize, CANVAS_HEIGHT/2, 1);
                drawImage(0, CANVAS_HEIGHT/2, sideSize, CANVAS_HEIGHT/2, 2);
                // Right side
                drawImage(sideSize + centerSize, 0, sideSize, CANVAS_HEIGHT/2, 3);
                drawImage(sideSize + centerSize, CANVAS_HEIGHT/2, sideSize, CANVAS_HEIGHT/2, 4);
            },
            // Grid with large center
            () => {
                const centerSize = CANVAS_WIDTH * 0.5;
                const sideSize = (CANVAS_WIDTH - centerSize) / 2;
                // Center
                drawImage(sideSize, CANVAS_HEIGHT * 0.1, centerSize, CANVAS_HEIGHT * 0.8, 0);
                // Corners
                drawImage(0, 0, sideSize, CANVAS_HEIGHT/2, 1);
                drawImage(0, CANVAS_HEIGHT/2, sideSize, CANVAS_HEIGHT/2, 2);
                drawImage(CANVAS_WIDTH - sideSize, 0, sideSize, CANVAS_HEIGHT/2, 3);
                drawImage(CANVAS_WIDTH - sideSize, CANVAS_HEIGHT/2, sideSize, CANVAS_HEIGHT/2, 4);
            }
        ]
    };

    if (layouts[count] && layouts[count][currentLayoutIndex]) {
        layouts[count][currentLayoutIndex]();
    } else {
        // Default grid layout for unexpected number of images
        const gridSize = Math.ceil(Math.sqrt(count));
        const cellWidth = CANVAS_WIDTH / gridSize;
        const cellHeight = CANVAS_HEIGHT / gridSize;
        
        uploadedImagesList.forEach((img, i) => {
            const row = Math.floor(i / gridSize);
            const col = i % gridSize;
            drawImage(
                col * cellWidth,
                row * cellHeight,
                cellWidth,
                cellHeight,
                i
            );
        });
    }
}

// Draw single image
function drawImage(x, y, width, height, index) {
    const img = uploadedImagesList[index].element;
    const scale = Math.max(width / img.width, height / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const offsetX = x + (width - scaledWidth) / 2;
    const offsetY = y + (height - scaledHeight) / 2;
    
    ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
}

// Download thumbnail
function downloadThumbnail() {
    const link = document.createElement('a');
    link.download = 'youtube-thumbnail.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Handle canvas mouse events
function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    
    // Check if mouse is near either text position
    const mainText = mainHeadline.value;
    const subText = subHeadline.value;
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const hitRadius = fontSize / 2;

    if (mainText && isNearText(mouseX, mouseY, mainTextPosition, hitRadius)) {
        isDragging = true;
        dragTarget = 'main';
        canvas.style.cursor = 'move';
    } else if (subText && isNearText(mouseX, mouseY, subTextPosition, hitRadius)) {
        isDragging = true;
        dragTarget = 'sub';
        canvas.style.cursor = 'move';
    }

    lastMousePos = { x: mouseX, y: mouseY };
}

function handleCanvasMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Update cursor style based on proximity to text
    if (!isDragging) {
        const mainText = mainHeadline.value;
        const subText = subHeadline.value;
        const fontSize = parseInt(document.getElementById('fontSize').value);
        const hitRadius = fontSize / 2;

        if ((mainText && isNearText(mouseX, mouseY, mainTextPosition, hitRadius)) ||
            (subText && isNearText(mouseX, mouseY, subTextPosition, hitRadius))) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    }

    if (isDragging && dragTarget) {
        const dx = mouseX - lastMousePos.x;
        const dy = mouseY - lastMousePos.y;

        if (dragTarget === 'main') {
            mainTextPosition.x += dx;
            mainTextPosition.y += dy;
        } else {
            subTextPosition.x += dx;
            subTextPosition.y += dy;
        }

        lastMousePos = { x: mouseX, y: mouseY };

        // Redraw the canvas
        clearCanvas();
        drawImagesLayout();
        drawTextOverlays();
        drawText();
    }
}

function handleCanvasMouseUp() {
    isDragging = false;
    dragTarget = null;
    canvas.style.cursor = 'default';
}

function isNearText(mouseX, mouseY, textPos, radius) {
    const dx = mouseX - textPos.x;
    const dy = mouseY - textPos.y;
    return (dx * dx + dy * dy) <= radius * radius;
}