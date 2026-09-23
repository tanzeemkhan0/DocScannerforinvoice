export interface Point {
  x: number;
  y: number;
}

// Robust fallback that uses Canvas 2D clipping to crop the document.
// This guarantees no white/blank screens on mobile devices due to matrix math precision issues,
// while perfectly removing the background outside the selected polygon.
export function warpPerspective(
  srcCanvas: HTMLCanvasElement,
  srcPts: Point[],
  dstW: number, // Kept for signature compatibility
  dstH: number
): HTMLCanvasElement {
  if (!srcCanvas || !srcPts || srcPts.length !== 4) return srcCanvas;

  // Ensure points are valid numbers to prevent NaN errors in canvas drawing
  const validPts = srcPts.map(p => ({
    x: isNaN(p.x) ? 0 : p.x,
    y: isNaN(p.y) ? 0 : p.y
  }));

  // Find the bounding box of the selected polygon
  const minX = Math.max(0, Math.floor(Math.min(...validPts.map(p => p.x))));
  const minY = Math.max(0, Math.floor(Math.min(...validPts.map(p => p.y))));
  const maxX = Math.min(srcCanvas.width, Math.ceil(Math.max(...validPts.map(p => p.x))));
  const maxY = Math.min(srcCanvas.height, Math.ceil(Math.max(...validPts.map(p => p.y))));

  const cropW = Math.max(1, maxX - minX);
  const cropH = Math.max(1, maxY - minY);

  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = cropW;
  dstCanvas.height = cropH;
  const ctx = dstCanvas.getContext('2d');
  
  if (!ctx) return srcCanvas;

  // Fill with white background (so areas outside the polygon but inside the bounding box are white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cropW, cropH);

  ctx.save();
  // Create clipping path for the exact polygon
  ctx.beginPath();
  ctx.moveTo(validPts[0].x - minX, validPts[0].y - minY);
  ctx.lineTo(validPts[1].x - minX, validPts[1].y - minY);
  ctx.lineTo(validPts[2].x - minX, validPts[2].y - minY);
  ctx.lineTo(validPts[3].x - minX, validPts[3].y - minY);
  ctx.closePath();
  ctx.clip();

  // Draw the original image offset by the bounding box minimums
  ctx.drawImage(srcCanvas, -minX, -minY);
  ctx.restore();

  return dstCanvas;
}

// Applies a high-contrast grayscale filter to simulate a scanned document
export function applyScanFilter(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Reduced contrast and added brightness to prevent mobile photos from turning completely black
  const contrast = 1.2; 
  const intercept = 128 * (1 - contrast);
  const brightness = 20; 

  for (let i = 0; i < data.length; i += 4) {
    // Skip fully transparent pixels
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Convert to grayscale
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Apply contrast and brightness
    gray = gray * contrast + intercept + brightness;
    
    // Clamp values
    gray = Math.max(0, Math.min(255, gray));

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // alpha remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
