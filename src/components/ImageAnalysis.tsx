import React from 'react';
import { Loader2 } from 'lucide-react';

interface ImageAnalysisProps {
  analysis: string;
  isLoading: boolean;
}

export function ImageAnalysis({ analysis, isLoading }: ImageAnalysisProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Image Analysis
      </h2>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Analyzing image...</span>
        </div>
      ) : (
        <div className="prose prose-blue max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">{analysis}</p>
        </div>
      )}
    </div>
  );
}