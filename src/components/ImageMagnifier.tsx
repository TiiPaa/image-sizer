import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageMagnifierProps {
  imageUrl: string;
  onClose: () => void;
}

export function ImageMagnifier({ imageUrl, onClose }: ImageMagnifierProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const [imagePos, setImagePos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showMagnifier, setShowMagnifier] = useState(false);
  const magnifierSize = 200; // Increased from 150 to 200
  const [zoom, setZoom] = useState(2);
  const MIN_ZOOM = 1.5;
  const MAX_ZOOM = 6;
  const ZOOM_STEP = 0.5;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const updateImagePosition = () => {
      const image = imageRef.current;
      if (!image) return;

      const rect = image.getBoundingClientRect();
      setImagePos({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
    };

    updateImagePosition();
    window.addEventListener('resize', updateImagePosition);
    return () => window.removeEventListener('resize', updateImagePosition);
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(currentZoom => {
      const newZoom = currentZoom + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
      return Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
    });
  };

  const updateMagnifier = (e: React.MouseEvent<HTMLDivElement>) => {
    const image = imageRef.current;
    if (!image) return;

    // Get cursor position relative to the image
    const x = e.clientX - imagePos.x;
    const y = e.clientY - imagePos.y;

    // Only show magnifier when mouse is over the image
    if (x < 0 || x > imagePos.width || y < 0 || y > imagePos.height) {
      setShowMagnifier(false);
      return;
    }

    setShowMagnifier(true);
    setMagnifierPos({ x, y });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 
          text-white hover:bg-black/70 transition-colors z-10"
        aria-label="Close fullscreen"
      >
        <X className="w-6 h-6" />
      </button>

      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        onMouseMove={updateMagnifier}
        onMouseLeave={() => setShowMagnifier(false)}
        onWheel={handleWheel}
      >
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Fullscreen view"
          className="max-w-full max-h-full object-contain"
        />

        {showMagnifier && (
          <div
            className="absolute pointer-events-none border-2 border-white rounded-full overflow-hidden shadow-lg"
            style={{
              width: magnifierSize,
              height: magnifierSize,
              transform: `translate(${magnifierPos.x - magnifierSize/2}px, ${magnifierPos.y - magnifierSize/2}px)`,
              left: imagePos.x,
              top: imagePos.y
            }}
          >
            <div
              style={{
                width: imagePos.width * zoom,
                height: imagePos.height * zoom,
                transform: `translate(${-magnifierPos.x * zoom + magnifierSize/2}px, ${-magnifierPos.y * zoom + magnifierSize/2}px)`,
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${imagePos.width * zoom}px ${imagePos.height * zoom}px`,
                backgroundPosition: 'top left',
                backgroundRepeat: 'no-repeat'
              }}
            />
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
        Zoom: {zoom.toFixed(1)}x (Use mouse wheel to adjust)
      </div>
    </div>
  );
}