
import { useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  GitBranch, 
  Download, 
  Copy, 
  FileText, 
  Activity, 
  Youtube, 
  Upload,
  PanelTop,
  PanelBottom 
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import MermaidRenderer from "@/components/MermaidRenderer";
import { FlowchartData, generateFlowchart, saveFlowchart } from "@/services/flowchartService";
import { extractYouTubeTranscript } from "@/services/youtubeService";
import { 
  extractPDFContent, 
  extractPDFContentFromUrl, 
  extractDocContent,
  extractKeywordsAndCorrelations,
  generateMermaidFromKeywords
} from "@/services/pdfService";
import { generateVideoSummary, VideoSummary } from "@/services/summaryService";
import { YouTubeSummary } from "@/components/YouTubeSummary";

const Flowcharts = () => {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [flowchartTitle, setFlowchartTitle] = useState("");
  const [flowchartData, setFlowchartData] = useState<FlowchartData | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isAnalyzingDocument, setIsAnalyzingDocument] = useState(false);
  const [videoSummary, setVideoSummary] = useState<VideoSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [mobileView, setMobileView] = useState<"input" | "preview">("input");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  
  const { toast } = useToast();

  const handleGenerateFlowchart = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to generate a flowchart.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const generatedFlowchart = await generateFlowchart(inputText);
      setFlowchartData(generatedFlowchart);
      setFlowchartTitle(generatedFlowchart.title);
      
      // Save the flowchart
      saveFlowchart(generatedFlowchart);
      
      toast({
        title: "Flowchart generation complete",
        description: "Your flowchart has been generated successfully.",
      });
      
      // Switch to preview on mobile
      if (isMobile) {
        setMobileView("preview");
      }
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Flowchart generation failed",
        description: "There was an error generating your flowchart. Please try again.",
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
      // Step 1: Extract transcript
      const transcript = await extractYouTubeTranscript(youtubeUrl);
      setInputText(transcript.text);
      
      // Step 2: Generate summary with Gemini
      const summary = await generateVideoSummary(transcript.text);
      setVideoSummary(summary);
      
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

  const processPDFDocument = async () => {
    if (!pdfUrl) {
      toast({
        title: "PDF URL required",
        description: "Please enter a valid PDF URL.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingMedia(true);
    setIsAnalyzingDocument(true);
    
    try {
      // Step 1: Extract text content from PDF
      const pdfContent = await extractPDFContentFromUrl(pdfUrl);
      setInputText(pdfContent.text);
      setFlowchartTitle(pdfContent.title || "PDF Flowchart");
      
      // Step 2: Extract keywords and correlations
      const keywordData = await extractKeywordsAndCorrelations(pdfContent.text);
      
      // Step 3: Generate Mermaid flowchart from keywords
      const mermaidCode = await generateMermaidFromKeywords(keywordData);
      
      // Step 4: Set the flowchart data
      const generatedFlowchart: FlowchartData = {
        id: `flowchart-${Date.now()}`,
        title: pdfContent.title || "PDF Flowchart",
        mermaidCode: mermaidCode,
        content: pdfContent.text,
        createdAt: new Date()
      };
      
      setFlowchartData(generatedFlowchart);
      saveFlowchart(generatedFlowchart);
      
      // Switch to preview on mobile
      if (isMobile) {
        setMobileView("preview");
      }
      
      toast({
        title: "PDF analysis complete",
        description: "Keywords and correlations have been extracted and a flowchart has been generated.",
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "PDF processing failed",
        description: "There was an error extracting the text. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMedia(false);
      setIsAnalyzingDocument(false);
      setActiveTab("text");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsProcessingMedia(true);
    setIsAnalyzingDocument(true);
    
    try {
      let content;
      if (file.type === "application/pdf") {
        content = await extractPDFContent(file);
      } else if (file.type.includes("document") || file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
        content = await extractDocContent(file);
      } else {
        throw new Error("Unsupported file type. Please upload a PDF or Word document.");
      }
      
      setInputText(content.text);
      setFlowchartTitle(content.title);
      
      // Extract keywords and correlations
      const keywordData = await extractKeywordsAndCorrelations(content.text);
      
      // Generate Mermaid flowchart from keywords
      const mermaidCode = await generateMermaidFromKeywords(keywordData);
      
      // Set the flowchart data
      const generatedFlowchart: FlowchartData = {
        id: `flowchart-${Date.now()}`,
        title: content.title || "Document Flowchart",
        mermaidCode: mermaidCode,
        content: content.text,
        createdAt: new Date()
      };
      
      setFlowchartData(generatedFlowchart);
      saveFlowchart(generatedFlowchart);
      
      // Switch to preview on mobile
      if (isMobile) {
        setMobileView("preview");
      }
      
      toast({
        title: "Document analysis complete",
        description: `${file.name} has been processed and a flowchart has been generated.`,
      });
    } catch (error) {
      console.error("Error processing document:", error);
      toast({
        title: "Document processing failed",
        description: error instanceof Error ? error.message : "Failed to process the document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingMedia(false);
      setIsAnalyzingDocument(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCopyMermaidCode = () => {
    if (flowchartData) {
      navigator.clipboard.writeText(flowchartData.mermaidCode);
      toast({
        title: "Code copied",
        description: "Mermaid code has been copied to clipboard.",
      });
    }
  };

  const handleDownloadMermaid = () => {
    if (flowchartData) {
      const fileContent = flowchartData.mermaidCode;
      const blob = new Blob([fileContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flowchartTitle || "flowchart"}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Mermaid code downloaded",
        description: "Your flowchart code has been downloaded.",
      });
    }
  };

  const generateFlowchartFromKeyPoints = async (keyPoints: string[]) => {
    setIsLoading(true);
    
    try {
      // Join key points into a single text for processing
      const keyPointsText = keyPoints.join("\n\n");
      const generatedFlowchart = await generateFlowchart(keyPointsText);
      
      setFlowchartData(generatedFlowchart);
      setFlowchartTitle(generatedFlowchart.title);
      
      // Save the flowchart
      saveFlowchart(generatedFlowchart);
      
      // Switch to preview on mobile
      if (isMobile) {
        setMobileView("preview");
      }
      
      toast({
        title: "Flowchart generated",
        description: "A flowchart based on the key points has been created.",
      });
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your flowchart.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mobile view toggle controls
  const renderMobileViewToggle = () => {
    if (!isMobile) return null;
    
    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        <Button
          variant={mobileView === "input" ? "default" : "outline"}
          onClick={() => setMobileView("input")}
          className="flex-1"
          size="sm"
        >
          <PanelTop className="h-4 w-4 mr-2" />
          Input
        </Button>
        <Button
          variant={mobileView === "preview" ? "default" : "outline"}
          onClick={() => setMobileView("preview")}
          className="flex-1"
          size="sm"
          disabled={!flowchartData}
        >
          <PanelBottom className="h-4 w-4 mr-2" />
          Preview
        </Button>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 animate-fade-in">
      <div className="mb-6 text-center max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
          Interactive Flowcharts
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Generate visual flowcharts from any content to visualize relationships and hierarchies.
        </p>
      </div>
      
      {renderMobileViewToggle()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Input Section */}
        {(!isMobile || mobileView === "input") && (
          <div>
            <Card className="p-4 md:p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
              <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center">
                <GitBranch className="mr-2 h-5 w-5 text-primary" />
                <span>Flowchart Content</span>
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
                        placeholder="Paste your text here to generate a flowchart..."
                        className="h-32 md:h-40 resize-none focus:ring-primary/30 border-primary/20"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="document">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pdf-url">PDF URL</Label>
                      <Input
                        id="pdf-url"
                        placeholder="https://example.com/document.pdf"
                        className="focus:ring-primary/30 border-primary/20 mb-2"
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        disabled={isProcessingMedia}
                      />
                      <Button 
                        onClick={processPDFDocument} 
                        disabled={isProcessingMedia || !pdfUrl}
                        variant="outline"
                        className="w-full mb-4"
                      >
                        {isProcessingMedia ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isAnalyzingDocument ? "Analyzing Document..." : "Processing PDF..."}
                          </>
                        ) : (
                          "Extract & Analyze PDF"
                        )}
                      </Button>
                      
                      <div className="text-center p-4 border-2 border-dashed border-primary/20 rounded-lg">
                        <Upload className="h-8 w-8 mx-auto text-primary/50 mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Upload a PDF or document file</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isProcessingMedia}
                        />
                        <Button 
                          onClick={() => fileInputRef.current?.click()} 
                          disabled={isProcessingMedia}
                          variant="outline"
                          size="sm"
                        >
                          {isProcessingMedia ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {isAnalyzingDocument ? "Analyzing..." : "Processing..."}
                            </>
                          ) : (
                            "Select File"
                          )}
                        </Button>
                      </div>
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
                    <ScrollArea className="max-h-[300px]">
                      <YouTubeSummary 
                        summary={videoSummary} 
                        onGenerateFlowchart={generateFlowchartFromKeyPoints}
                      />
                    </ScrollArea>
                  </TabsContent>
                )}
              </Tabs>
              
              <Separator className="my-4" />
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="flowchart-title">Flowchart Title</Label>
                  <Input
                    id="flowchart-title"
                    placeholder="Enter a title for your flowchart"
                    value={flowchartTitle}
                    className="focus:ring-primary/30 border-primary/20"
                    onChange={(e) => setFlowchartTitle(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="mt-4 md:mt-6">
                <Button
                  onClick={handleGenerateFlowchart}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full group hover:shadow-md hover:shadow-primary/10 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Flowchart...
                    </>
                  ) : (
                    <>
                      <GitBranch className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      Generate Flowchart
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Flowchart Preview Section */}
        {(!isMobile || mobileView === "preview") && (
          <div>
            <Card className="p-4 md:p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg md:text-xl font-semibold flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-primary" />
                  <span>Flowchart Preview</span>
                </h2>
                {flowchartData && !isMobile && (
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopyMermaidCode} className="border-primary/20 hover:bg-primary/5">
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadMermaid} className="border-primary/20 hover:bg-primary/5">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Code
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator className="mb-4" />
              
              <div className="bg-card border rounded-lg p-2 md:p-4 min-h-[300px] md:min-h-[400px] flex items-center justify-center shadow-inner">
                {!flowchartData ? (
                  <div className="text-center p-8">
                    <GitBranch className="h-12 w-12 md:h-16 md:w-16 text-primary/20 mx-auto mb-4 animate-pulse" />
                    <p className="text-muted-foreground">
                      Your flowchart will appear here after generation.
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      Click the fullscreen button to view in expanded mode.
                    </p>
                  </div>
                ) : (
                  <div className="w-full">
                    <h3 className="text-base md:text-lg font-medium mb-2 md:mb-4 text-center text-primary">{flowchartData.title}</h3>
                    <MermaidRenderer 
                      chart={flowchartData.mermaidCode} 
                      className="w-full max-h-[300px] md:max-h-[500px] overflow-auto"
                      title={flowchartTitle || flowchartData.title}
                    />
                  </div>
                )}
              </div>
              
              {flowchartData && !isMobile && (
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Mermaid Code</h3>
                    <Button variant="ghost" size="sm" onClick={handleCopyMermaidCode}>
                      <Copy className="h-3 w-3 mr-2" /> Copy
                    </Button>
                  </div>
                  <pre className="bg-muted/50 p-2 md:p-4 rounded-md text-xs overflow-auto mt-2 max-h-[100px] md:max-h-[150px] border border-muted">
                    <code>{flowchartData.mermaidCode}</code>
                  </pre>
                </div>
              )}
              
              {flowchartData && isMobile && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={handleCopyMermaidCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadMermaid}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flowcharts;
