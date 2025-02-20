
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type !== 'text/xml') {
        toast.error('Please upload an XML file');
        return;
      }
      onFileSelect(file);
      toast.success('File uploaded successfully');
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/xml': ['.xml'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all hover:border-gray-400 animate-fade-in"
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg text-gray-600 mb-2">
        {isDragActive ? (
          "Drop the XML file here"
        ) : (
          "Drag and drop an XML file here, or click to select"
        )}
      </p>
      <p className="text-sm text-gray-500">Supports NFe XML format</p>
    </div>
  );
};

export default FileUpload;
