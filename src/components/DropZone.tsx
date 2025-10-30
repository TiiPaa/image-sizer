import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Upload, Clipboard } from 'lucide-react';

interface DropZoneProps {
  onImageLoad: (file: File) => void;
}

export function DropZone({ onImageLoad }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      onImageLoad(file);
    }
  }, [onImageLoad]);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if we're leaving the dropzone (not just moving between its children)
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (
        clientX <= rect.left ||
        clientX >= rect.right ||
        clientY <= rect.top ||
        clientY >= rect.bottom
      ) {
        setIsDragging(false);
      }
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFile]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFile(file);
          break;
        }
      }
    }
  }, [handleFile]);

  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    // Add event listeners directly to the DOM element
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('paste', handlePaste);

    return () => {
      dropZone.removeEventListener('drop', handleDrop);
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleDrop, handleDragOver, handleDragLeave, handlePaste]);

  return (
    <div
      ref={dropZoneRef}
      onClick={handleClick}
      className={`
        border-2 border-dashed border-gray-700 rounded-lg p-12 text-center
        transition-all duration-200 cursor-pointer h-[calc(100vh-12rem)]
        hover:border-gray-500 hover:bg-gray-900/50
        ${isDragging ? 'border-blue-500 bg-gray-900/50' : 'bg-gray-900'}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex items-center gap-4">
          <Upload className="w-12 h-12 text-gray-400" />
          <Clipboard className="w-12 h-12 text-gray-400" />
        </div>
        <div className="text-gray-300 mt-4">
          <p className="font-medium">Drop image here, click to upload, or paste from clipboard</p>
          <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, WebP</p>
        </div>
      </div>
    </div>
  );
}