import React, { useState, useCallback } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImageSizeInfoProps {
  imageInfo: {
    url: string;
    width: number;
    height: number;
    name: string;
    size: number;
    file: File;
  } | null;
  onImageUpdate: (newUrl: string) => void;
}

export function ImageSizeInfo({ imageInfo, onImageUpdate }: ImageSizeInfoProps) {
  const [exportFormat, setExportFormat] = useState<'image/jpeg' | 'image/png'>('image/png');

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const calculateRatio = (width: number, height: number) => {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(width, height);
    return `${width/divisor}:${height/divisor}`;
  };

  const getImageFormat = (type: string) => {
    return type.split('/')[1].toUpperCase();
  };

  const getProportionalSizes = useCallback(() => {
    if (!imageInfo) return [];
    
    const scales = [
      { scale: 'x1', multiplier: 1 },
      { scale: 'x2', multiplier: 2 },
      { scale: 'x1.5', multiplier: 1.5 },
      { scale: 'x0.75', multiplier: 0.75 },
      { scale: 'x0.5', multiplier: 0.5 }
    ];

    return scales.map(({ scale, multiplier }) => ({
      scale,
      width: Math.round(imageInfo.width * multiplier),
      height: Math.round(imageInfo.height * multiplier)
    }));
  }, [imageInfo]);

  const getCommonSizes = useCallback(() => {
    if (!imageInfo) return [];

    const aspectRatio = imageInfo.height / imageInfo.width;

    return [
      { name: 'small', width: 320, height: Math.round(320 * aspectRatio) },
      { name: 'medium', width: 768, height: Math.round(768 * aspectRatio) },
      { name: 'large', width: 1024, height: Math.round(1024 * aspectRatio) },
      { name: 'xl', width: 1280, height: Math.round(1280 * aspectRatio) },
      { name: 'xxl', width: 1920, height: Math.round(1920 * aspectRatio) }
    ];
  }, [imageInfo]);

  const resizeImage = useCallback(async (width: number, height: number) => {
    if (!imageInfo) return;

    // Create a new image element
    const img = new Image();
    img.src = imageInfo.url;

    // Wait for the image to load
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Fill with white background for JPEG
    if (exportFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Get the new filename with correct extension
    const extension = exportFormat === 'image/jpeg' ? '.jpg' : '.png';
    const baseFilename = imageInfo.name.substring(0, imageInfo.name.lastIndexOf('.')) || imageInfo.name;
    const newFilename = `${baseFilename}_modified${extension}`;

    // Convert to blob and create URL
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(
        blob => resolve(blob),
        exportFormat,
        exportFormat === 'image/jpeg' ? 0.92 : undefined
      );
    });

    if (!blob) return;

    const url = URL.createObjectURL(blob);
    onImageUpdate(url);
  }, [imageInfo, exportFormat, onImageUpdate]);

  if (!imageInfo) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 space-y-8">
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg">Upload an image to see size information</p>
          <p className="text-sm opacity-75">Supports JPG, PNG, WebP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Size</div>
          <div className="text-white font-semibold">
            {formatFileSize(imageInfo.size)}
          </div>
        </div>
        <div className="bg-black/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Dimensions</div>
          <div className="text-white font-semibold">
            {imageInfo.width} × {imageInfo.height}
          </div>
        </div>
        <div className="bg-black/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Ratio</div>
          <div className="text-white font-semibold">
            {calculateRatio(imageInfo.width, imageInfo.height)}
          </div>
        </div>
        <div className="bg-black/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Format</div>
          <div className="text-white font-semibold">
            {getImageFormat(imageInfo.file.type)}
          </div>
        </div>
      </div>

      <div className="bg-black/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Export Format</span>
          <div className="flex gap-3">
            <button
              onClick={() => setExportFormat('image/png')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                exportFormat === 'image/png'
                  ? 'bg-white text-black'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setExportFormat('image/jpeg')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                exportFormat === 'image/jpeg'
                  ? 'bg-white text-black'
                  : 'bg-black/50 text-white hover:bg-black/70'
              }`}
            >
              JPG
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-4">
          Proportional Sizes
        </h3>
        <div className="space-y-2">
          {getProportionalSizes().map(({ scale, width, height }) => (
            <button
              key={scale}
              onClick={() => resizeImage(width, height)}
              className="w-full flex items-center justify-between py-2 px-4 bg-black/30 rounded hover:bg-black/50 transition-colors"
            >
              <div className="text-gray-300">{scale}</div>
              <div className="text-gray-300">{width} × {height}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-gray-400 text-sm font-medium mb-4">
          Common Sizes
        </h3>
        <div className="space-y-2">
          {getCommonSizes().map(({ name, width, height }) => (
            <button
              key={name}
              onClick={() => resizeImage(width, height)}
              className="w-full flex items-center justify-between py-2 px-4 bg-black/30 rounded hover:bg-black/50 transition-colors"
            >
              <div className="text-gray-300">{name}</div>
              <div className="text-gray-300">{width} × {height}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}