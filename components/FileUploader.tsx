import React, { useState } from 'react';
import { Upload, FileCode, X, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const MAX_FILES = 50;
  const ALLOWED_EXTENSIONS = ['.html', '.htm', '.mhtml'];

  const validateFiles = (files: File[]): File[] => {
    setError(null);
    const validFiles: File[] = [];
    
    if (selectedFiles.length + files.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed.`);
      return [];
    }

    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      const isAllowed = ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));
      if (isAllowed) {
        validFiles.push(file);
      }
    }

    if (validFiles.length < files.length) {
        // Some files were rejected, but we keep valid ones? 
        // Or strictly warn. Let's warn but keep valid.
        setError(`Some files were skipped. Only .html, .htm, .mhtml allowed.`);
    }

    return validFiles;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const validFiles = validateFiles(droppedFiles);
      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const inputFiles = Array.from(e.target.files);
      const validFiles = validateFiles(inputFiles);
      if (validFiles.length > 0) {
        addFiles(validFiles);
      }
    }
  };

  const addFiles = (newFiles: File[]) => {
    const updated = [...selectedFiles, ...newFiles];
    setSelectedFiles(updated);
    onFilesSelected(updated);
  };

  const removeFile = (index: number) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
    onFilesSelected(updated);
    setError(null);
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          multiple
          accept=".html,.htm,.mhtml"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="p-3 bg-blue-100 rounded-full">
            <Upload className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supports .html, .htm, .mhtml (Max {MAX_FILES} files)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
           <AlertCircle className="w-4 h-4 mr-2" />
           {error}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Selected Files ({selectedFiles.length})
            </h4>
            <button onClick={() => { setSelectedFiles([]); onFilesSelected([]); setError(null); }} className="text-xs text-red-500 hover:underline">
                Clear All
            </button>
          </div>
          <ul className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, idx) => (
              <li key={`${file.name}-${idx}`} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center space-x-3">
                  <FileCode className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                  <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                {!disabled && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploader;