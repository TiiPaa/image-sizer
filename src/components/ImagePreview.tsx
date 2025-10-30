import React, { useState, useRef } from 'react';
import { X, Maximize2, Crop, Download, Edit2, Check } from 'lucide-react';
import { ImageMagnifier } from './ImageMagnifier';
import { ImageCropper } from './ImageCropper';

interface ImagePreviewProps {
  imageInfo: {
    url: string;
    width: number;
    height: number;
    name: string;
    size: number;
    type: string;
    file: File;
  };
  onClear: () => void;
  onImageUpdate: (newUrl: string) => void;
}

export function ImagePreview({ imageInfo, onClear, onImageUpdate }: ImagePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [modifiedName, setModifiedName] = useState("00016-189372747_x0.5_modified.png");

  const handleCroppedImage = (newUrl: string) => {
    onImageUpdate(newUrl);
    setIsCropping(false);
  };

  const getModifiedFilename = () => modifiedName;

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = imageInfo.url;
    a.download = getModifiedFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDragStart = (e: React.DragEvent<HTMLImageElement>) => {
    const modifiedFilename = getModifiedFilename();
    
    // Set the basic text data
    e.dataTransfer.setData('text/plain', modifiedFilename);
    e.dataTransfer.setData('text/uri-list', imageInfo.url);
    
    // Create a canvas to get the image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Create a File object with the correct filename
    canvas.toBlob((blob) => {
      if (!blob) return;
      // Create a new file with the modified filename
      const file = new File([blob], modifiedFilename, { 
        type: imageInfo.type,
        lastModified: Date.now()
      });
      
      // Set the file data for drag and drop
      e.dataTransfer.setData('application/x-moz-file', '');
      e.dataTransfer.items.add(file);
    }, imageInfo.type);

    // Set drag image and cursor
    if (imageRef.current) {
      e.dataTransfer.setDragImage(imageRef.current, rect.width / 2, rect.height / 2);
      e.currentTarget.style.cursor = 'move';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLImageElement>) => {
    if (e.currentTarget) {
      e.currentTarget.style.cursor = 'move';
    }
  };

  const handleNameSubmit = () => {
    if (modifiedName.trim()) {
      setIsEditingName(false);
    }
  };

  return (
    <>
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative aspect-auto h-[calc(100vh-32rem)] min-h-[200px] group">
          <img
            ref={imageRef}
            src={imageInfo.url}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-contain cursor-move"
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            style={{ cursor: 'move' }}
          />

          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-4 right-4 pointer-events-auto">
              <button
                onClick={onClear}
                className="p-1 rounded-full bg-black/50 
                  text-white hover:bg-black/70 transition-colors"
                aria-label="Clear image"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2 pointer-events-auto">
              <button
                onClick={downloadImage}
                className="p-3 rounded-full bg-black/50 
                  text-white hover:bg-black/70 transition-colors transform hover:scale-110"
                aria-label="Download image"
              >
                <Download className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-3 rounded-full bg-black/50 
                  text-white hover:bg-black/70 transition-colors transform hover:scale-110"
                aria-label="View fullscreen"
              >
                <Maximize2 className="w-6 h-6" />
              </button>
              <button
                onClick={() => setIsCropping(true)}
                className="p-3 rounded-full bg-black/50 
                  text-white hover:bg-black/70 transition-colors transform hover:scale-110"
                aria-label="Crop image"
              >
                <Crop className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-3 bg-black/30 flex items-center gap-2">
          {isEditingName ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={modifiedName}
                onChange={(e) => setModifiedName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                className="flex-1 bg-black/30 text-white px-3 py-1.5 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                className="p-1.5 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <span className="flex-1 text-gray-300 text-sm truncate">{modifiedName}</span>
              <button
                onClick={() => setIsEditingName(true)}
                className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {isFullscreen && (
        <ImageMagnifier 
          imageUrl={imageInfo.url}
          onClose={() => setIsFullscreen(false)}
        />
      )}

      {isCropping && (
        <ImageCropper
          imageUrl={imageInfo.url}
          onClose={() => setIsCropping(false)}
          onImageUpdate={handleCroppedImage}
        />
      )}
    </>
  );
}