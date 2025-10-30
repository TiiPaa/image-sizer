import React, { useState, useCallback, useRef } from 'react';
import { DropZone } from './components/DropZone';
import { ImagePreview } from './components/ImagePreview';
import { ImageSizeInfo } from './components/ImageSizeInfo';
import { RotateCcw, Upload } from 'lucide-react';

interface ImageInfo {
  url: string;
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
  file: File;
  originalUrl: string;
}

function App() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageLoad = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImageInfo({
          url: e.target?.result as string,
          originalUrl: e.target?.result as string,
          width: img.width,
          height: img.height,
          name: file.name,
          size: file.size,
          type: file.type,
          file: file
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleImageUpdate = useCallback((newUrl: string) => {
    if (!imageInfo) return;

    const img = new Image();
    img.onload = () => {
      fetch(newUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], imageInfo.name, { type: imageInfo.type });
          setImageInfo({
            url: newUrl,
            originalUrl: imageInfo.originalUrl,
            width: img.width,
            height: img.height,
            name: imageInfo.name,
            size: blob.size,
            type: imageInfo.type,
            file: file
          });
        });
    };
    img.src = newUrl;
  }, [imageInfo]);

  const handleReset = useCallback(() => {
    if (!imageInfo) return;
    handleImageUpdate(imageInfo.originalUrl);
  }, [imageInfo, handleImageUpdate]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageLoad(file);
    }
  }, [handleImageLoad]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageLoad(file);
    }
  }, [handleImageLoad]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Image Sizer
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {!imageInfo ? (
              <DropZone onImageLoad={handleImageLoad} />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="text-sm text-gray-400 font-medium">Original</div>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                  <div
                    onClick={handleClick}
                    className={`bg-gray-900 rounded-lg overflow-hidden relative group cursor-pointer
                      ${isDragging ? 'ring-2 ring-blue-500' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <div className="relative aspect-auto min-h-[200px] max-h-[400px]">
                      <img
                        src={imageInfo.originalUrl}
                        alt="Original"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex flex-col items-center gap-4">
                          <Upload className="w-12 h-12 text-white" />
                          <div className="text-center">
                            <p className="font-medium text-white text-lg">Click or drop to replace image</p>
                            <p className="text-sm text-gray-300 mt-1">Supports JPG, PNG, WebP</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-400 font-medium px-1">Modified</div>
                  <ImagePreview 
                    imageInfo={imageInfo} 
                    onClear={() => setImageInfo(null)}
                    onImageUpdate={handleImageUpdate}
                  />
                </div>
              </div>
            )}
          </div>
          
          <ImageSizeInfo 
            imageInfo={imageInfo} 
            onImageUpdate={handleImageUpdate}
          />
        </div>
      </div>
    </div>
  );
}

export default App;