import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Check, RefreshCw, Loader2, Wand2 } from 'lucide-react';
import { Point, warpPerspective, applyScanFilter } from '../utils/scannerMath';

interface DocumentScannerProps {
  onClose: () => void;
  onCapture: (file: File) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = ({ onClose, onCapture }) => {
  const [mode, setMode] = useState<'camera' | 'crop'>('camera');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Default to color to prevent dark images from turning completely black on mobile
  const [filterMode, setFilterMode] = useState<'color' | 'bw'>('color');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [activePoint, setActivePoint] = useState<number | null>(null);

  // Initialize Camera
  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Fallback dimensions in case videoWidth is not ready
    canvas.width = video.videoWidth || video.clientWidth || 1080;
    canvas.height = video.videoHeight || video.clientHeight || 1920;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedCanvas(canvas);
    
    // Initialize crop points (10% inset from edges to ensure they are visible and draggable)
    const insetX = canvas.width * 0.10;
    const insetY = canvas.height * 0.10;
    setPoints([
      { x: insetX, y: insetY }, // Top Left
      { x: canvas.width - insetX, y: insetY }, // Top Right
      { x: canvas.width - insetX, y: canvas.height - insetY }, // Bottom Right
      { x: insetX, y: canvas.height - insetY }, // Bottom Left
    ]);
    
    setMode('crop');
  };

  const handleRetake = () => {
    setCapturedCanvas(null);
    setMode('camera');
  };

  // SVG Dragging Logic
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    setActivePoint(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePoint === null || !svgRef.current || !capturedCanvas) return;
    
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;

    const cursorPt = pt.matrixTransform(ctm.inverse());

    // Clamp coordinates to canvas boundaries to prevent invalid math
    const clampedX = Math.max(0, Math.min(capturedCanvas.width, cursorPt.x));
    const clampedY = Math.max(0, Math.min(capturedCanvas.height, cursorPt.y));

    setPoints(prev => {
      const newPts = [...prev];
      newPts[activePoint] = { x: clampedX, y: clampedY };
      return newPts;
    });
  };

  const handlePointerUp = () => {
    setActivePoint(null);
  };

  const handleCropAndProcess = () => {
    if (!capturedCanvas) return;
    setIsProcessing(true);
    
    // Use a timeout to allow the UI to render the loading state
    setTimeout(() => {
      try {
        // CRITICAL FIX: Sort points to ensure they are always in Top-Left, Top-Right, Bottom-Right, Bottom-Left order.
        // This prevents the "bowtie" distortion if the user crosses the points.
        const sortedByY = [...points].sort((a, b) => a.y - b.y);
        const top = [sortedByY[0], sortedByY[1]].sort((a, b) => a.x - b.x);
        const bottom = [sortedByY[2], sortedByY[3]].sort((a, b) => b.x - a.x);
        const orderedPoints = [top[0], top[1], bottom[0], bottom[1]];

        let finalCanvas = warpPerspective(capturedCanvas, orderedPoints, 0, 0);
        
        // Apply Adobe Scan-like filter if selected
        if (filterMode === 'bw') {
          finalCanvas = applyScanFilter(finalCanvas);
        }

        // Scale down if too large to prevent Gemini API payload issues (max 1600px)
        const MAX_DIM = 1600;
        if (finalCanvas.width > MAX_DIM || finalCanvas.height > MAX_DIM) {
          const scale = Math.min(MAX_DIM / finalCanvas.width, MAX_DIM / finalCanvas.height);
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.floor(finalCanvas.width * scale);
          scaledCanvas.height = Math.floor(finalCanvas.height * scale);
          const sCtx = scaledCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(finalCanvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            finalCanvas = scaledCanvas;
          }
        }
        
        finalCanvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "scanned_document.jpg", { type: "image/jpeg" });
            onCapture(file);
          } else {
            throw new Error("Failed to create image blob");
          }
          setIsProcessing(false);
        }, 'image/jpeg', 0.9);
      } catch (err) {
        console.error("Cropping failed", err);
        setIsProcessing(false);
        alert("Failed to crop image. Please try again.");
      }
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header - Changed from absolute to relative flow to prevent overlapping the crop area */}
      <div className="flex justify-between items-center p-4 bg-gray-900 text-white border-b border-gray-800 z-10">
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700">
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold">
          {mode === 'camera' ? 'Scan Document' : 'Adjust Borders'}
        </h2>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      {/* Main Content Area - Added touch-none to prevent mobile scrolling while dragging */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black touch-none">
        {error ? (
          <div className="text-red-400 p-4 text-center">{error}</div>
        ) : mode === 'camera' ? (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted // CRITICAL: Muted is required for autoplay to work on iOS/Android Safari/Chrome
            className="w-full h-full object-cover"
          />
        ) : (
          capturedCanvas && (
            <div 
              className="relative inline-block max-w-full max-h-full w-full h-full flex items-center justify-center"
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <img 
                src={capturedCanvas.toDataURL('image/jpeg')} 
                alt="Captured" 
                className={`max-w-full max-h-full object-contain pointer-events-none ${filterMode === 'bw' ? 'grayscale contrast-125 brightness-110' : ''}`}
              />
              
              {/* SVG Overlay for Cropping */}
              <svg 
                ref={svgRef}
                viewBox={`0 0 ${capturedCanvas.width} ${capturedCanvas.height}`}
                preserveAspectRatio="xMidYMid meet"
                className="absolute top-0 left-0 w-full h-full"
              >
                <defs>
                  <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <polygon 
                      points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                      fill="black" 
                    />
                  </mask>
                </defs>
                
                {/* Darken area outside the crop polygon */}
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#crop-mask)" className="pointer-events-none" />
                
                {/* Crop Polygon Outline */}
                <polygon 
                  points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                  fill="rgba(37, 99, 235, 0.1)" 
                  stroke="#3b82f6" 
                  strokeWidth={capturedCanvas.width * 0.005} 
                  className="pointer-events-none"
                />
                
                {/* Draggable Corner Handles - Made larger for mobile touch */}
                {points.map((p, i) => (
                  <g key={i} onPointerDown={(e) => handlePointerDown(i, e)} className="cursor-move">
                    {/* Invisible larger touch target */}
                    <circle cx={p.x} cy={p.y} r={capturedCanvas.width * 0.08} fill="transparent" />
                    {/* Visible handle */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={capturedCanvas.width * 0.025} 
                      fill="white" 
                      stroke="#3b82f6" 
                      strokeWidth={capturedCanvas.width * 0.008} 
                    />
                  </g>
                ))}
              </svg>
            </div>
          )
        )}
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-900 p-6 pb-8 flex justify-center items-center space-x-8 border-t border-gray-800">
        {mode === 'camera' ? (
          <button 
            onClick={handleCapture}
            className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Camera size={32} className="text-black" />
          </button>
        ) : (
          <>
            <button 
              onClick={handleRetake}
              disabled={isProcessing}
              className="flex flex-col items-center text-white hover:text-gray-300 disabled:opacity-50"
            >
              <div className="bg-gray-800 p-4 rounded-full mb-2">
                <RefreshCw size={24} />
              </div>
              <span className="text-sm">Retake</span>
            </button>

            <button 
              onClick={() => setFilterMode(prev => prev === 'bw' ? 'color' : 'bw')}
              disabled={isProcessing}
              className={`flex flex-col items-center disabled:opacity-50 ${filterMode === 'bw' ? 'text-blue-400' : 'text-white'}`}
            >
              <div className={`p-4 rounded-full mb-2 ${filterMode === 'bw' ? 'bg-blue-900/50' : 'bg-gray-800'}`}>
                <Wand2 size={24} />
              </div>
              <span className="text-sm">{filterMode === 'bw' ? 'B&W Scan' : 'Original'}</span>
            </button>
            
            <button 
              onClick={handleCropAndProcess}
              disabled={isProcessing}
              className="flex flex-col items-center text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              <div className="bg-blue-600 p-4 rounded-full mb-2 text-white">
                {isProcessing ? <Loader2 size={24} className="animate-spin" /> : <Check size={24} />}
              </div>
              <span className="text-sm">{isProcessing ? 'Processing...' : 'Keep Scan'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentScanner;
