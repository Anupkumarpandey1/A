
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Youtube, Upload, ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractYouTubeTranscript } from "@/services/youtubeService";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface MediaInputProps {
  onTranscriptExtracted: (transcript: { text: string; videoId: string; videoTitle: string }) => void;
  onTextUpload: (text: string, fileName: string) => void;
  onImageUpload: (imageUrl: string, imageName: string) => void;
  isProcessing: boolean;
}

const MediaInput: React.FC<MediaInputProps> = ({
  onTranscriptExtracted,
  onTextUpload,
  onImageUpload,
  isProcessing,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("youtube");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExtractTranscript = async () => {
    if (!youtubeUrl) {
      toast({
        title: "YouTube URL required",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setTranscript("");
    
    // Show immediate feedback
    toast({
      title: "Extracting transcript",
      description: "Retrieving content from YouTube video...",
    });
    
    // Use a progress indicator
    const progressInterval = setInterval(() => {
      setExtractionProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 500);

    try {
      const extractedTranscript = await extractYouTubeTranscript(youtubeUrl);
      clearInterval(progressInterval);
      setExtractionProgress(100);
      
      if (extractedTranscript.text) {
        setTranscript(extractedTranscript.text);
        onTranscriptExtracted(extractedTranscript);
        
        toast({
          title: "Transcript extracted",
          description: `Successfully retrieved transcript (${Math.round(extractedTranscript.text.length / 100) / 10}KB)`,
        });
      } else {
        throw new Error("Failed to extract transcript content");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error extracting transcript:", error);
      toast({
        title: "Extraction failed",
        description: error instanceof Error ? error.message : "Failed to extract transcript.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      setExtractionProgress(0);
    }
  };

  // Handle enter key press for faster access
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isExtracting && !isProcessing && youtubeUrl) {
      handleExtractTranscript();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setImagePreview(imageUrl);
        onImageUpload(imageUrl, file.name.replace(/\.[^/.]+$/, ""));
        
        toast({
          title: "Image uploaded",
          description: "Image will be processed into learning materials.",
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          onTextUpload(text, file.name.replace(/\.[^/.]+$/, ""));
          
          toast({
            title: "File uploaded",
            description: "File contents will be processed into learning materials.",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card className="p-4 border-primary/20 hover-card gradient-border">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="youtube" className="flex items-center gap-2">
            <Youtube className="h-4 w-4" />
            YouTube
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="youtube">
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isExtracting || isProcessing}
              />
              <Button
                onClick={handleExtractTranscript}
                disabled={isExtracting || isProcessing || !youtubeUrl}
                className="whitespace-nowrap bg-gradient-to-r from-primary to-primary/80"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {extractionProgress > 0 ? `${extractionProgress}%` : 'Extracting...'}
                  </>
                ) : (
                  <>
                    <Youtube className="mr-2 h-4 w-4" />
                    Get Transcript
                  </>
                )}
              </Button>
            </div>

            {transcript && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Extracted Transcript:</h3>
                <ScrollArea className="h-[200px] border rounded-md p-2 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">{transcript}</p>
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload">
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-lg hover:border-primary/50 transition-colors">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image or text file (.txt, .md) to generate learning materials
              </p>
              <Input
                id="file-upload"
                type="file"
                accept="image/*,.txt,.md,.csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isProcessing}
              />
              <Button 
                onClick={() => document.getElementById('file-upload')?.click()}
                variant="outline"
                disabled={isProcessing}
                className="transition-all"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            </div>

            {imagePreview && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Uploaded Image:</h3>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Uploaded" 
                    className="w-full h-auto max-h-[300px] object-contain" 
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default MediaInput;
