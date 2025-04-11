
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileIcon, UploadIcon, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileContent: (content: string, fileName: string) => void;
  accept?: string;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileContent, 
  accept = ".pdf,.doc,.docx,.txt",
  label = "Upload Document" 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    
    try {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          onFileContent(content, file.name);
          
          toast({
            title: "File uploaded",
            description: `${file.name} has been processed successfully.`,
          });
        }
        setLoading(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "There was an error reading the file.",
          variant: "destructive",
        });
        setLoading(false);
      };
      
      if (file.type.includes('pdf') || file.type.includes('document')) {
        // In a real app, we'd use a PDF parsing library
        // For now, we'll just read it as text
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Processing failed",
        description: "Failed to process the document.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="focus:ring-primary/30 border-primary/20"
          disabled={loading}
        />
        {file && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFile}
            disabled={loading}
            className="h-10 w-10"
          >
            <X size={18} />
          </Button>
        )}
      </div>
      
      {file && (
        <div className="flex items-center justify-between bg-muted/40 rounded-md p-2">
          <div className="flex items-center space-x-2">
            <FileIcon className="h-4 w-4 text-primary" />
            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
          </div>
          <Button 
            onClick={handleUpload} 
            disabled={loading} 
            size="sm"
            className="flex items-center"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <UploadIcon className="h-4 w-4 mr-1" />
                Process
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
