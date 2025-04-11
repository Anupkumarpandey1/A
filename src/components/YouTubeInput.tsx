
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Youtube } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { extractYouTubeTranscript } from "@/services/youtubeService";
import { useToast } from "@/components/ui/use-toast";

interface YouTubeInputProps {
  onTranscriptExtracted: (transcript: { text: string; videoId: string; videoTitle: string }) => void;
  isProcessing: boolean;
}

const YouTubeInput: React.FC<YouTubeInputProps> = ({
  onTranscriptExtracted,
  isProcessing,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
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

  return (
    <Card className="p-4 border-primary/20">
      <div className="space-y-4">
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
            className="whitespace-nowrap"
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
    </Card>
  );
};

export default YouTubeInput;
