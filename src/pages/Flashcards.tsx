
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, RefreshCw, BookOpen, StickyNote, RotateCw, Download, FileText, Youtube, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { generateFlashcards, generateNotes, generateKeyPoints } from "@/services/api";
import { FlashcardItem, NotesItem } from "@/types/quizTypes";
import { extractYouTubeTranscript } from "@/services/youtubeService";
import { extractPDFContent } from "@/services/pdfService";
import { generateVideoSummary, VideoSummary } from "@/services/summaryService";
import { YouTubeSummary } from "@/components/YouTubeSummary";
import FileUpload from "@/components/FileUpload";

const flashcardStyles = `
  .flashcard {
    perspective: 1000px;
    height: 200px;
    margin-bottom: 16px;
  }
  
  .flashcard-inner {
    position: relative;
    width: 100%;
    height: 100%;
    transition: transform 0.6s;
    transform-style: preserve-3d;
  }
  
  .flashcard.flipped .flashcard-inner {
    transform: rotateY(180deg);
  }
  
  .flashcard-front,
  .flashcard-back {
    position: absolute;
    width: 100%;
    height: 100%;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;
    padding: 1.5rem;
  }
  
  .flashcard-front {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
    border: 1px solid rgba(129, 140, 248, 0.2);
  }
  
  .flashcard-back {
    background: linear-gradient(135deg, #ede9f6 0%, #e8f2ff 100%);
    transform: rotateY(180deg);
    border: 1px solid rgba(139, 92, 246, 0.3);
  }
`;

const Flashcards = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [notes, setNotes] = useState<NotesItem[]>([]);
  const [activeTab, setActiveTab] = useState("text");
  const [outputTab, setOutputTab] = useState("flashcards");
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [videoSummary, setVideoSummary] = useState<VideoSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to generate flashcards or notes.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // First, generate key points
      const extractedKeyPoints = await generateKeyPoints(inputText);
      setKeyPoints(extractedKeyPoints);
      
      // Then generate flashcards and notes
      const [flashcardsData, notesData] = await Promise.all([
        generateFlashcards(inputText),
        generateNotes(inputText),
      ]);

      setFlashcards(flashcardsData);
      setNotes(notesData);
      setOutputTab("flashcards");
      
      toast({
        title: "Generation complete",
        description: "Your flashcards and notes have been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processYouTubeVideo = async () => {
    if (!youtubeUrl) {
      toast({
        title: "YouTube URL required",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingMedia(true);
    setIsGeneratingSummary(true);
    
    try {
      // Extract transcript
      const transcript = await extractYouTubeTranscript(youtubeUrl);
      setInputText(transcript.text);
      
      // Generate summary
      const summary = await generateVideoSummary(transcript.text);
      setVideoSummary(summary);
      
      // Generate key points
      const extractedKeyPoints = await generateKeyPoints(transcript.text);
      setKeyPoints(extractedKeyPoints);
      
      toast({
        title: "YouTube summary created",
        description: "The video transcript has been processed and summarized.",
      });
    } catch (error) {
      console.error("Error processing YouTube video:", error);
      toast({
        title: "YouTube processing failed",
        description: "There was an error extracting the transcript. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMedia(false);
      setIsGeneratingSummary(false);
      setActiveTab("text");
    }
  };

  const handleDocumentUpload = async (content: string, fileName: string) => {
    setInputText(content);
    setActiveTab("text");
    
    try {
      // Generate key points
      const extractedKeyPoints = await generateKeyPoints(content);
      setKeyPoints(extractedKeyPoints);
      
      toast({
        title: "Document processed",
        description: `${fileName} has been processed successfully.`,
      });
    } catch (error) {
      console.error("Error processing document:", error);
      toast({
        title: "Processing failed",
        description: "There was an error processing the document.",
        variant: "destructive",
      });
    }
  };

  const generateFlashcardsFromKeyPoints = async (keyPoints: string[]) => {
    setIsLoading(true);
    
    try {
      const keyPointsText = keyPoints.join("\n\n");
      const flashcardsData = await generateFlashcards(keyPointsText);
      
      setFlashcards(flashcardsData);
      setOutputTab("flashcards");
      
      toast({
        title: "Flashcards generated",
        description: "Flashcards based on the key points have been created.",
      });
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your flashcards.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotesFromKeyPoints = async (keyPoints: string[]) => {
    setIsLoading(true);
    
    try {
      const keyPointsText = keyPoints.join("\n\n");
      const notesData = await generateNotes(keyPointsText);
      
      setNotes(notesData);
      setOutputTab("notes");
      
      toast({
        title: "Notes generated",
        description: "Study notes based on the key points have been created.",
      });
    } catch (error) {
      console.error("Error generating notes:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your notes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCardFlip = (cardId: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const downloadFlashcards = () => {
    if (flashcards.length === 0) return;

    let content = "# Flashcards\n\n";
    flashcards.forEach((card, index) => {
      content += `## Card ${index + 1}\n\n`;
      content += `**Question:** ${card.question}\n\n`;
      content += `**Answer:** ${card.answer}\n\n`;
      content += "---\n\n";
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Flashcards downloaded",
      description: "Your flashcards have been downloaded as a Markdown file.",
    });
  };

  const downloadNotes = () => {
    if (notes.length === 0) return;

    let content = "# Study Notes\n\n";
    notes.forEach((note) => {
      content += `## ${note.title}\n\n`;
      content += `${note.content}\n\n`;
      content += "---\n\n";
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "study_notes.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Notes downloaded",
      description: "Your study notes have been downloaded as a Markdown file.",
    });
  };

  const downloadNotesAsDoc = () => {
    if (notes.length === 0) return;
    
    // Create HTML content for Word document
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Study Notes</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; text-align: center; margin-bottom: 30px; }
          h2 { color: #444; margin-top: 20px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          p { line-height: 1.5; }
        </style>
      </head>
      <body>
        <h1>Study Notes</h1>
    `;
    
    notes.forEach((note) => {
      htmlContent += `<h2>${note.title}</h2>`;
      htmlContent += `<p>${note.content.replace(/\n/g, '<br>')}</p>`;
      htmlContent += `<hr style="margin: 20px 0;">`;
    });
    
    htmlContent += `
      </body>
      </html>
    `;
    
    // Create a Blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "study_notes.doc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Notes downloaded",
      description: "Your study notes have been downloaded as a Word document.",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <style>{flashcardStyles}</style>
      
      <div className="mb-8 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-500">Flashcards & Study Notes</h1>
        <p className="text-muted-foreground">
          Generate interactive flashcards and concise study notes from any text or content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Card className="p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              <span>Input Content</span>
            </h2>
            <Tabs defaultValue="text" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-muted/50">
                <TabsTrigger value="text" className="data-[state=active]:bg-primary/10">Text</TabsTrigger>
                <TabsTrigger value="document" className="data-[state=active]:bg-primary/10">Document</TabsTrigger>
                <TabsTrigger value="youtube" className="data-[state=active]:bg-primary/10">YouTube</TabsTrigger>
                {videoSummary && <TabsTrigger value="summary" className="data-[state=active]:bg-primary/10">Summary</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="text">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="input-text" className="text-sm font-medium">Enter your text</Label>
                    <Textarea
                      id="input-text"
                      placeholder="Paste your text here to generate flashcards and notes..."
                      className="h-56 resize-none focus:ring-primary/30 border-primary/20"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="document">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="document-upload">Upload PDF, DOC, or Text File</Label>
                    <FileUpload 
                      onFileContent={handleDocumentUpload}
                      accept=".pdf,.doc,.docx,.txt"
                      label="Upload Document"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="youtube">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="youtube-url">YouTube Video URL</Label>
                    <Input
                      id="youtube-url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="focus:ring-primary/30 border-primary/20 mb-2"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      disabled={isProcessingMedia}
                    />
                    <Button 
                      onClick={processYouTubeVideo} 
                      disabled={isProcessingMedia || !youtubeUrl}
                      variant="outline"
                      className="w-full"
                    >
                      {isProcessingMedia ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {isGeneratingSummary ? "Generating Summary..." : "Extracting Transcript..."}
                        </>
                      ) : (
                        <>
                          <Youtube className="mr-2 h-4 w-4" />
                          Extract & Summarize Video
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              {videoSummary && (
                <TabsContent value="summary">
                  <YouTubeSummary 
                    summary={videoSummary} 
                    onGenerateFlashcards={generateFlashcardsFromKeyPoints}
                    onGenerateFlowchart={generateNotesFromKeyPoints}
                  />
                </TabsContent>
              )}
            </Tabs>
            
            <div className="mt-6">
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !inputText.trim()}
                className="w-full group hover:shadow-md hover:shadow-primary/10 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    Generate Flashcards & Notes
                  </>
                )}
              </Button>
            </div>
            
            {keyPoints.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <StickyNote className="mr-2 h-4 w-4 text-primary" />
                  Key Points
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
                
                <div className="flex space-x-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateFlashcardsFromKeyPoints(keyPoints)}
                    className="text-xs"
                  >
                    Generate Flashcards
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateNotesFromKeyPoints(keyPoints)}
                    className="text-xs"
                  >
                    Generate Notes
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <BookOpen className="mr-2 h-5 w-5 text-primary" />
                <span>Learning Materials</span>
              </h2>
              
              <div className="flex items-center space-x-1 bg-muted/50 rounded-md">
                <Button
                  variant={outputTab === "flashcards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOutputTab("flashcards")}
                  className={outputTab === "flashcards" ? "" : "hover:bg-primary/5"}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Flashcards
                </Button>
                <Button
                  variant={outputTab === "notes" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOutputTab("notes")}
                  className={outputTab === "notes" ? "" : "hover:bg-primary/5"}
                >
                  <StickyNote className="h-4 w-4 mr-2" />
                  Notes
                </Button>
              </div>
            </div>
            
            <Separator className="mb-4" />
            
            {outputTab === "flashcards" ? (
              <div className="space-y-4 overflow-auto max-h-[500px] pr-2">
                {flashcards.length === 0 ? (
                  <div className="text-center py-16">
                    <BookOpen className="h-16 w-16 text-primary/20 mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">
                      Your flashcards will appear here after generation.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Click on a card to flip it and reveal the answer.
                    </p>
                  </div>
                ) : (
                  flashcards.map((card) => (
                    <div
                      key={card.id}
                      className={`flashcard ${flippedCards[card.id] ? "flipped" : ""}`}
                      onClick={() => toggleCardFlip(card.id)}
                    >
                      <div className="flashcard-inner h-full relative shadow-lg hover:shadow-xl transition-all">
                        <div className="flashcard-front flex items-center justify-center min-h-[150px]">
                          <div className="w-full">
                            <div className="absolute top-2 left-2 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
                              Question
                            </div>
                            <p className="font-medium text-center px-8 py-4">{card.question}</p>
                            <div className="absolute bottom-2 right-2 text-muted-foreground flex items-center text-xs">
                              <span className="mr-1">Flip</span>
                              <RotateCw className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                        <div className="flashcard-back flex items-center justify-center min-h-[150px]">
                          <div className="w-full">
                            <div className="absolute top-2 left-2 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full">
                              Answer
                            </div>
                            <p className="text-center px-8 py-4">{card.answer}</p>
                            <div className="absolute bottom-2 right-2 text-muted-foreground flex items-center text-xs">
                              <span className="mr-1">Flip</span>
                              <RotateCw className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4 overflow-auto max-h-[500px] pr-2">
                {notes.length === 0 ? (
                  <div className="text-center py-16">
                    <StickyNote className="h-16 w-16 text-primary/20 mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">
                      Your study notes will appear here after generation.
                    </p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-indigo-950/30 border border-primary/10 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                      <h3 className="font-semibold text-lg mb-2 text-primary">{note.title}</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{note.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {(flashcards.length > 0 || notes.length > 0) && (
              <div className="mt-4 pt-4 border-t flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setFlippedCards({})} className="border-primary/20 hover:bg-primary/5">
                  Reset Cards
                </Button>
                <div className="flex space-x-2">
                  {outputTab === "flashcards" ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadFlashcards}
                      className="border-primary/20 hover:bg-primary/5"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Markdown
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadNotes}
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Markdown
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={downloadNotesAsDoc}
                        className="border-primary/20 hover:bg-primary/5"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Word Doc
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Flashcards;
