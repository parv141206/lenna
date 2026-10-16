'use client';

import React, { useRef, useState } from 'react';
import { SAMPLE_IMAGES, type SampleImage } from '../lib/transformer/samples';
import { loadImageFromFile, imageToImageData } from '../lib/transformer/engine';

interface ImageUploaderProps {
  onImageLoaded: (imageData: ImageData, name: string) => void;
  currentImageName?: string;
  imageDimensions?: { width: number; height: number };
  onResetOriginal?: () => void;
  canResetOriginal?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageLoaded,
  currentImageName,
  imageDimensions,
  onResetOriginal,
  canResetOriginal = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      const data = imageToImageData(img);
      onImageLoaded(data, file.name);
    } catch {
      alert('Failed to load image file.');
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    try {
      const img = await loadImageFromFile(file);
      const data = imageToImageData(img);
      onImageLoaded(data, file.name);
    } catch {
      alert('Failed to load dropped image.');
    }
  };

  const loadSample = (sample: SampleImage) => {
    const data = sample.generate(640, 640);
    onImageLoaded(data, sample.name);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 border-b border-[#262626] bg-black font-mono text-xs">
      {/* Upload Zone Cell */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`md:col-span-5 flex cursor-pointer items-center justify-between border-b md:border-b-0 md:border-r border-[#262626] px-4 py-2.5 transition-colors ${
          isDragging ? 'bg-white text-black' : 'text-neutral-300 hover:bg-[#111] hover:text-white'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/webp,image/avif"
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">[+]</span>
          <span className="font-bold tracking-tight uppercase">Upload Source Image</span>
        </div>
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Drag &amp; Drop / Browse</span>
      </div>

      {/* Target Presets Cell */}
      <div className="md:col-span-4 flex items-center border-b md:border-b-0 md:border-r border-[#262626] px-3 py-2">
        <span className="mr-2 text-[10px] text-neutral-500 uppercase">Presets:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SAMPLE_IMAGES.map((sample, i) => (
            <button
              key={sample.id}
              onClick={() => loadSample(sample)}
              className="border border-[#333] bg-[#0d0d0d] px-2 py-1 text-[11px] text-neutral-300 uppercase transition hover:border-white hover:bg-white hover:text-black"
            >
              0{i + 1}_{sample.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Status & Base Reset Cell */}
      <div className="md:col-span-3 flex items-center justify-between px-4 py-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate text-white font-medium">{currentImageName ?? 'NONE'}</span>
          {imageDimensions && (
            <span className="text-neutral-500 font-mono">[{imageDimensions.width}×{imageDimensions.height}]</span>
          )}
        </div>

        {canResetOriginal && onResetOriginal && (
          <button
            onClick={onResetOriginal}
            className="border border-[#444] px-1.5 py-0.5 text-[10px] uppercase text-neutral-300 hover:border-red-400 hover:bg-red-950/40 hover:text-red-300"
          >
            Reset Base
          </button>
        )}
      </div>
    </div>
  );
};
