import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Move, Eye, EyeOff, Unlock, Lock, ArrowLeftRight } from 'lucide-react';

interface ImageCropperProps {
  imageUrl: string;
  onClose: () => void;
  onImageUpdate?: (newUrl: string) => void;
}

const ASPECT_RATIOS = [
  { name: '16:9', value: 16/9 },
  { name: '4:3', value: 4/3 },
  { name: '3:2', value: 3/2 },
  { name: '1:1', value: 1 },
  { name: '2:3', value: 2/3 },
  { name: '3:4', value: 3/4 },
  { name: '9:16', value: 9/16 },
  { name: 'Custom', value: 0 }
];

export function ImageCropper({ imageUrl, onClose, onImageUpdate }: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentRatioIndex, setCurrentRatioIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [customWidth, setCustomWidth] = useState(16);
  const [customHeight, setCustomHeight] = useState(9);
  const [customMode, setCustomMode] = useState<'ratio' | 'pixels'>('ratio');
  const [pixelWidth, setPixelWidth] = useState(1920);
  const [pixelHeight, setPixelHeight] = useState(1080);

  const isCustomRatio = currentRatioIndex === ASPECT_RATIOS.length - 1;
  const customRatioValue = customWidth / customHeight;
  const currentRatio = lockAspectRatio
    ? (isCustomRatio ? (customMode === 'ratio' ? customRatioValue : pixelWidth / pixelHeight) : ASPECT_RATIOS[currentRatioIndex].value)
    : null;

  const swapRatioDimensions = () => {
    const temp = customWidth;
    setCustomWidth(customHeight);
    setCustomHeight(temp);
  };

  const swapPixelDimensions = () => {
    const temp = pixelWidth;
    setPixelWidth(pixelHeight);
    setPixelHeight(temp);
  };

  const initializeCropBox = () => {
    const img = imageRef.current;
    if (!img) return;

    const imgRect = img.getBoundingClientRect();
    const imgWidth = imgRect.width;
    const imgHeight = imgRect.height;

    let boxWidth: number;
    let boxHeight: number;

    // If in pixel mode with custom ratio, calculate box size based on target pixel dimensions
    if (isCustomRatio && customMode === 'pixels') {
      // Calculate scale to fit target dimensions within displayed image
      const scaleX = img.naturalWidth / imgRect.width;
      const scaleY = img.naturalHeight / imgRect.height;

      // Target dimensions in display pixels
      boxWidth = pixelWidth / scaleX;
      boxHeight = pixelHeight / scaleY;

      // If the box is too large, scale it down proportionally
      if (boxWidth > imgWidth || boxHeight > imgHeight) {
        const scale = Math.min(imgWidth / boxWidth, imgHeight / boxHeight) * 0.8;
        boxWidth *= scale;
        boxHeight *= scale;
      }
    } else {
      boxWidth = imgWidth * 0.8;
      boxHeight = currentRatio ? boxWidth / currentRatio : imgHeight * 0.8;

      // Adjust if the height exceeds the image bounds
      if (boxHeight > imgHeight * 0.8) {
        boxHeight = imgHeight * 0.8;
        boxWidth = currentRatio ? boxHeight * currentRatio : imgWidth * 0.8;
      }
    }

    const x = (imgWidth - boxWidth) / 2;
    const y = (imgHeight - boxHeight) / 2;

    setCropBox({ x, y, width: boxWidth, height: boxHeight });
  };

  useEffect(() => {
    if (imageLoaded) {
      initializeCropBox();
    }
  }, [imageLoaded, currentRatio, lockAspectRatio, customWidth, customHeight, customMode, pixelWidth, pixelHeight]);

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    
    if (e.shiftKey) {
      const img = imageRef.current;
      if (!img) return;
      
      const imgRect = img.getBoundingClientRect();
      const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
      
      let newWidth = cropBox.width * scaleFactor;
      let newHeight = currentRatio ? newWidth / currentRatio : cropBox.height * scaleFactor;
      
      if (newWidth > imgRect.width) {
        newWidth = imgRect.width;
        newHeight = currentRatio ? newWidth / currentRatio : newHeight;
      }
      if (newHeight > imgRect.height) {
        newHeight = imgRect.height;
        newWidth = currentRatio ? newHeight * currentRatio : newWidth;
      }
      
      const x = cropBox.x + (cropBox.width - newWidth) / 2;
      const y = cropBox.y + (cropBox.height - newHeight) / 2;
      
      const finalX = Math.max(0, Math.min(x, imgRect.width - newWidth));
      const finalY = Math.max(0, Math.min(y, imgRect.height - newHeight));
      
      setCropBox({
        x: finalX,
        y: finalY,
        width: newWidth,
        height: newHeight
      });
    } else if (lockAspectRatio) {
      setCurrentRatioIndex(prev => {
        if (e.deltaY > 0) {
          return prev === ASPECT_RATIOS.length - 1 ? 0 : prev + 1;
        } else {
          return prev === 0 ? ASPECT_RATIOS.length - 1 : prev - 1;
        }
      });
    }
  };

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [cropBox, currentRatio, lockAspectRatio]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    
    if ((e.target as HTMLElement).dataset.handle) {
      setResizeHandle((e.target as HTMLElement).dataset.handle || null);
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left - cropBox.x,
        y: e.clientY - rect.top - cropBox.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !imageRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = imageRef.current.getBoundingClientRect();

    if (isDragging) {
      const newX = e.clientX - containerRect.left - dragStart.x;
      const newY = e.clientY - containerRect.top - dragStart.y;

      const x = Math.max(0, Math.min(newX, imgRect.width - cropBox.width));
      const y = Math.max(0, Math.min(newY, imgRect.height - cropBox.height));

      setCropBox(prev => ({ ...prev, x, y }));
    } else if (resizeHandle) {
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      let newWidth = cropBox.width;
      let newHeight = cropBox.height;
      let newX = cropBox.x;
      let newY = cropBox.y;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(50, Math.min(mouseX - cropBox.x, imgRect.width - cropBox.x));
        if (currentRatio) {
          newHeight = newWidth / currentRatio;
        }
      }
      if (resizeHandle.includes('w')) {
        const maxX = cropBox.x + cropBox.width - 50;
        newX = Math.max(0, Math.min(mouseX, maxX));
        newWidth = cropBox.x + cropBox.width - newX;
        if (currentRatio) {
          newHeight = newWidth / currentRatio;
          newY = cropBox.y + (cropBox.height - newHeight) / 2;
        }
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(50, Math.min(mouseY - cropBox.y, imgRect.height - cropBox.y));
        if (currentRatio) {
          newWidth = newHeight * currentRatio;
        }
      }
      if (resizeHandle.includes('n')) {
        const maxY = cropBox.y + cropBox.height - 50;
        newY = Math.max(0, Math.min(mouseY, maxY));
        newHeight = cropBox.y + cropBox.height - newY;
        if (currentRatio) {
          newWidth = newHeight * currentRatio;
          newX = cropBox.x + (cropBox.width - newWidth) / 2;
        }
      }

      // Ensure the crop box stays within image bounds
      if (newX + newWidth > imgRect.width) {
        newWidth = imgRect.width - newX;
        if (currentRatio) {
          newHeight = newWidth / currentRatio;
        }
      }
      if (newY + newHeight > imgRect.height) {
        newHeight = imgRect.height - newY;
        if (currentRatio) {
          newWidth = newHeight * currentRatio;
        }
      }

      setCropBox({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizeHandle(null);
  };

  const getCroppedImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx || !imageRef.current) return null;

    const img = imageRef.current;
    const imgRect = img.getBoundingClientRect();

    // Calculate the scale between displayed size and natural size
    const scaleX = img.naturalWidth / imgRect.width;
    const scaleY = img.naturalHeight / imgRect.height;

    let canvasWidth: number;
    let canvasHeight: number;

    // If in pixel mode with custom ratio, use exact pixel dimensions
    if (isCustomRatio && customMode === 'pixels') {
      canvasWidth = pixelWidth;
      canvasHeight = pixelHeight;
    } else {
      // Set canvas dimensions to maintain the exact aspect ratio
      canvasWidth = Math.round(cropBox.width * scaleX);
      canvasHeight = Math.round(cropBox.height * scaleY);
    }

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw the cropped portion
    const sourceX = Math.round(cropBox.x * scaleX);
    const sourceY = Math.round(cropBox.y * scaleY);
    const sourceWidth = Math.round(cropBox.width * scaleX);
    const sourceHeight = Math.round(cropBox.height * scaleY);

    ctx.drawImage(
      img,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvasWidth,
      canvasHeight
    );

    return canvas;
  };

  const handleCrop = () => {
    const canvas = getCroppedImage();
    if (!canvas) return;
    onImageUpdate?.(canvas.toDataURL());
    onClose();
  };

  const togglePreview = () => {
    if (showPreview) {
      setShowPreview(false);
      setPreviewUrl(null);
    } else {
      const canvas = getCroppedImage();
      if (canvas) {
        setPreviewUrl(canvas.toDataURL());
        setShowPreview(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <div className="relative">
          <button
            onClick={() => setLockAspectRatio(!lockAspectRatio)}
            className="p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            onMouseEnter={() => setHoveredButton('lock')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {lockAspectRatio ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
          </button>
          {hoveredButton === 'lock' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-black/75 text-white text-sm rounded-lg whitespace-nowrap">
              {lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={togglePreview}
            className="p-2 rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors"
            onMouseEnter={() => setHoveredButton('preview')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {showPreview ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </button>
          {hoveredButton === 'preview' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-black/75 text-white text-sm rounded-lg whitespace-nowrap">
              {showPreview ? "Hide preview" : "Show preview"}
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={handleCrop}
            className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
            onMouseEnter={() => setHoveredButton('apply')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Check className="w-6 h-6" />
          </button>
          {hoveredButton === 'apply' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-black/75 text-white text-sm rounded-lg whitespace-nowrap">
              Apply crop
            </div>
          )}
        </div>
        <div className="relative">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onMouseEnter={() => setHoveredButton('close')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <X className="w-6 h-6" />
          </button>
          {hoveredButton === 'close' && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-black/75 text-white text-sm rounded-lg whitespace-nowrap">
              Cancel
            </div>
          )}
        </div>
      </div>

      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex gap-2">
          {lockAspectRatio && ASPECT_RATIOS.map((ratio, index) => (
            <button
              key={ratio.name}
              onClick={() => setCurrentRatioIndex(index)}
              className={`px-3 py-1 rounded-full transition-colors ${
                index === currentRatioIndex
                  ? 'bg-white text-black'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              {ratio.name}
            </button>
          ))}
        </div>

        {lockAspectRatio && isCustomRatio && (
          <div className="flex flex-col gap-2 items-center justify-center mt-2">
            <div className="flex gap-1 bg-black/70 rounded-full p-1">
              <button
                onClick={() => setCustomMode('ratio')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  customMode === 'ratio'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Ratio
              </button>
              <button
                onClick={() => setCustomMode('pixels')}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  customMode === 'pixels'
                    ? 'bg-white text-black'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Pixels
              </button>
            </div>

            {customMode === 'ratio' ? (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 rounded bg-black/70 text-white text-center border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="W"
                />
                <button
                  onClick={swapRatioDimensions}
                  className="p-1 rounded bg-black/70 text-white hover:bg-white/20 transition-colors border border-white/30"
                  title="Swap width and height"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 px-2 py-1 rounded bg-black/70 text-white text-center border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="H"
                />
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={pixelWidth}
                  onChange={(e) => setPixelWidth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1 rounded bg-black/70 text-white text-center border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="Width"
                />
                <button
                  onClick={swapPixelDimensions}
                  className="p-1 rounded bg-black/70 text-white hover:bg-white/20 transition-colors border border-white/30"
                  title="Swap width and height"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={pixelHeight}
                  onChange={(e) => setPixelHeight(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1 rounded bg-black/70 text-white text-center border border-white/30 focus:border-white/60 focus:outline-none"
                  placeholder="Height"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div 
        ref={containerRef}
        className="relative select-none mt-16"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {showPreview && previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Crop preview"
              className="max-w-full max-h-[80vh] pointer-events-none border border-white"
              draggable={false}
            />
            <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              Preview
            </div>
          </div>
        ) : (
          <>
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Crop preview"
              className="max-w-full max-h-[80vh] pointer-events-none"
              draggable={false}
              onLoad={() => setImageLoaded(true)}
            />
            
            {imageLoaded && (
              <>
                <div
                  className="absolute inset-0 bg-black/50"
                  style={{
                    clipPath: `polygon(
                      0 0,
                      100% 0,
                      100% 100%,
                      0 100%,
                      0 0,
                      ${cropBox.x}px ${cropBox.y}px,
                      ${cropBox.x}px ${cropBox.y + cropBox.height}px,
                      ${cropBox.x + cropBox.width}px ${cropBox.y + cropBox.height}px,
                      ${cropBox.x + cropBox.width}px ${cropBox.y}px,
                      ${cropBox.x}px ${cropBox.y}px
                    )`
                  }}
                />

                <div
                  className="absolute border-2 border-white cursor-move"
                  style={{
                    top: cropBox.y,
                    left: cropBox.x,
                    width: cropBox.width,
                    height: cropBox.height
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <Move className="w-6 h-6" />
                  </div>
                  
                  {/* Resize handles */}
                  <div
                    className="absolute top-0 left-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize"
                    data-handle="nw"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute top-0 right-0 w-4 h-4 translate-x-1/2 -translate-y-1/2 cursor-ne-resize"
                    data-handle="ne"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-4 h-4 -translate-x-1/2 translate-y-1/2 cursor-sw-resize"
                    data-handle="sw"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 translate-x-1/2 translate-y-1/2 cursor-se-resize"
                    data-handle="se"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute top-0 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-n-resize"
                    data-handle="n"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute bottom-0 left-1/2 w-4 h-4 -translate-x-1/2 translate-y-1/2 cursor-s-resize"
                    data-handle="s"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute left-0 top-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-w-resize"
                    data-handle="w"
                    onMouseDown={handleMouseDown}
                  />
                  <div
                    className="absolute right-0 top-1/2 w-4 h-4 translate-x-1/2 -translate-y-1/2 cursor-e-resize"
                    data-handle="e"
                    onMouseDown={handleMouseDown}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
        {showPreview ? 
          "Press the eye icon to return to editing" : 
          lockAspectRatio ?
            "Mouse wheel to switch ratio • Shift + wheel to resize • Drag to move" :
            "Drag corners to resize freely • Click lock icon to maintain aspect ratio"
        }
      </div>
    </div>
  );
}