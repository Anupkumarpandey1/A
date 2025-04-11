
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookOpen, GitBranch, AlertCircle } from "lucide-react";
import YouTubeInput from "@/components/YouTubeInput";
import ProcessActions from "@/components/ProcessActions";
import { YouTubeSummary } from "@/components/YouTubeSummary";
import MermaidRenderer from "@/components/MermaidRenderer";
import { saveFlowchart } from "@/services/flowchartService";
import { downloadSummaryAsDocument } from "@/services/summaryService";
import { 
  processYoutubeContent, 
  generateFlowchartFromKeyPoints,
  generateStudyMaterials 
} from "@/services/youtubeProcessingService";

const YouTubeFlowchart = () => {
  const [transcript, setTranscript] = useState<{ text: string; videoId: string; videoTitle: string } | null>(null);
  const [activeTab, setActiveTab] = useState("input");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoSummary, setVideoSummary] = useState<any | null>(null);
  const [flowchartData, setFlowchartData] = useState<any | null>(null);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const { toast } = useToast();

  const handleTranscriptExtracted = (extractedTranscript: { text: string; videoId: string; videoTitle: string }) => {
    setTranscript(extractedTranscript);
    // When we get a new transcript, clear previous results
    setVideoSummary(null);
    setFlowchartData(null);
    setFlashcards([]);
    setKeyPoints([]);
  };

  const handleGenerateSummary = async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Initialize progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 90));
    }, 300);
    
    try {
      toast({
        title: "Processing content",
        description: "Generating summary and key points...",
      });
      
      // Process YouTube content more efficiently
      const processedContent = await processYoutubeContent(transcript.text);
      
      setVideoSummary(processedContent.summary);
      setKeyPoints(processedContent.keyPoints);
      setActiveTab("summary");
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      toast({
        title: "Content processed",
        description: "Summary and key points have been generated successfully.",
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error processing content:", error);
      toast({
        title: "Processing failed",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Initialize progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 90));
    }, 300);
    
    try {
      toast({
        title: "Creating flashcards",
        description: "Generating study materials from video content...",
      });
      
      // Generate flashcards more efficiently
      const { flashcards: generatedFlashcards } = await generateStudyMaterials(transcript.text);
      
      setFlashcards(generatedFlashcards);
      setActiveTab("flashcards");
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      toast({
        title: "Flashcards created",
        description: `${generatedFlashcards.length} flashcards have been generated.`,
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating flashcards:", error);
      toast({
        title: "Flashcard generation failed",
        description: "Failed to create flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleGenerateFlowchart = async () => {
    if (!transcript) return;
    
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Initialize progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 90));
    }, 300);
    
    try {
      toast({
        title: "Creating flowchart",
        description: "Analyzing video content and building diagram...",
      });
      
      // First get key points if not already available
      let points = keyPoints;
      if (points.length === 0) {
        const processedContent = await processYoutubeContent(transcript.text);
        points = processedContent.keyPoints;
        setKeyPoints(points);
      }
      
      // Generate flowchart from key points for faster results
      const generatedFlowchart = await generateFlowchartFromKeyPoints(points);
      
      setFlowchartData(generatedFlowchart);
      saveFlowchart(generatedFlowchart);
      setActiveTab("flowchart");
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      toast({
        title: "Flowchart created",
        description: "Flowchart has been generated from video key points.",
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating flowchart:", error);
      toast({
        title: "Flowchart generation failed",
        description: "Failed to create flowchart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleGenerateFlowchartFromKeyPoints = async (points: string[]) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    // Initialize progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 90));
    }, 300);
    
    try {
      toast({
        title: "Creating flowchart",
        description: "Building diagram from key points...",
      });
      
      // Generate flowchart from key points
      const generatedFlowchart = await generateFlowchartFromKeyPoints(points);
      
      setFlowchartData(generatedFlowchart);
      saveFlowchart(generatedFlowchart);
      setActiveTab("flowchart");
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      toast({
        title: "Flowchart created",
        description: "A flowchart based on the key points has been generated.",
      });
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error generating flowchart:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your flowchart.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-fade-in">
      <div className="mb-6 text-center max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
          YouTube Learning Tools
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Extract transcripts from YouTube videos and generate summaries, flashcards, and flowcharts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="summary" disabled={!videoSummary}>Summary</TabsTrigger>
          <TabsTrigger value="flashcards" disabled={flashcards.length === 0}>Flashcards</TabsTrigger>
          <TabsTrigger value="flowchart" disabled={!flowchartData}>Flowchart</TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <YouTubeInput 
            onTranscriptExtracted={handleTranscriptExtracted}
            isProcessing={isProcessing}
          />
          
          {transcript && (
            <>
              <Separator className="my-4" />
              <ProcessActions 
                onGenerateSummary={handleGenerateSummary}
                onGenerateFlashcards={handleGenerateFlashcards}
                onGenerateFlowchart={handleGenerateFlowchart}
                isProcessing={isProcessing}
                processingProgress={processingProgress}
                hasTranscript={!!transcript}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="summary">
          {videoSummary && (
            <YouTubeSummary 
              summary={videoSummary}
              onGenerateFlowchart={handleGenerateFlowchartFromKeyPoints}
              onGenerateFlashcards={() => handleGenerateFlashcards()}
            />
          )}
        </TabsContent>

        <TabsContent value="flashcards">
          {flashcards.length > 0 && (
            <Card className="p-6 border-primary/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                <span>Flashcards</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards.map((card, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-medium mb-2">{card.question}</h3>
                    <Separator className="my-2" />
                    <p className="text-sm text-muted-foreground">{card.answer}</p>
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flowchart">
          {flowchartData && (
            <Card className="p-6 border-primary/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <GitBranch className="mr-2 h-5 w-5 text-primary" />
                <span>{flowchartData.title}</span>
              </h2>
              
              <MermaidRenderer 
                chart={flowchartData.mermaidCode} 
                title={flowchartData.title}
              />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YouTubeFlowchart;
