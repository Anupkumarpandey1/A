import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import MermaidRenderer from "@/components/MermaidRenderer";
import FlowchartDownload from "@/components/FlowchartDownload";
import { 
  BookOpen, 
  GitBranch, 
  Sparkles, 
  Loader2, 
  RotateCw, 
  ArrowRight, 
  FileDown,
  FileText,
  Image,
  Package,
  GraduationCap,
} from "lucide-react";
import { 
  generateFlashcards, 
  generateNotes,
  generateKeyPoints 
} from "@/services/api";
import { generateFlowchart } from "@/services/flowchartService";
import { FlashcardItem, NotesItem, FlowchartData } from "@/types/quizTypes";
import { downloadSummaryAsDocument } from "@/services/summaryService";
import MediaInput from "@/components/MediaInput";
import { saveAs } from "file-saver";
import mermaid from "mermaid";

const LearningHub = () => {
  const [activeTab, setActiveTab] = useState("flashcards");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [flowchart, setFlowchart] = useState<FlowchartData | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const flowchartRef = useRef<HTMLDivElement>(null);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    if (location.state?.text) {
      setText(location.state.text);
      if (location.state.title) {
        setTitle(location.state.title);
      }
      
      if (location.state.autoGenerate) {
        handleGenerateAll();
      }
    }
  }, [location.state]);

  const handleGenerateAll = async () => {
    if (!text.trim()) {
      toast({
        title: "Missing Content",
        description: "Please enter some text to generate learning materials.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await Promise.all([
        handleGenerateFlashcards(),
        handleGenerateFlowchart(),
        handleGenerateNotes(),
      ]);
      
      toast({
        title: "Generation Complete",
        description: "All learning materials have been generated successfully!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating learning materials:", error);
      toast({
        title: "Generation Failed",
        description: "There was a problem generating some materials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!text.trim()) return;
    
    try {
      const generatedCards = await generateFlashcards(text);
      setFlashcards(generatedCards);
      
      const points = await generateKeyPoints(text);
      setKeyPoints(points);
      
      return { flashcards: generatedCards, keyPoints: points };
    } catch (error) {
      console.error("Error generating flashcards:", error);
      throw error;
    }
  };

  const handleGenerateFlowchart = async () => {
    if (!text.trim()) return;
    
    try {
      console.log("Starting flowchart generation...");
      const generatedFlowchart = await generateFlowchart(text);
      console.log("Flowchart generated:", generatedFlowchart);
      
      // Sanitize and format the Mermaid code
      let cleanMermaidCode = generatedFlowchart.mermaidCode.trim();
      
      // Ensure it starts with graph TD
      if (!cleanMermaidCode.startsWith('graph TD')) {
        cleanMermaidCode = `graph TD\n${cleanMermaidCode}`;
      }
      
      // Replace parentheses with square brackets for nodes
      cleanMermaidCode = cleanMermaidCode
        .replace(/\(([^)]+)\)/g, '[$1]')
        .replace(/\n\s+/g, '\n')
        .trim();
      
      // Simplify if too complex
      const nodeCount = (cleanMermaidCode.match(/-->/g) || []).length;
      if (nodeCount > 15) {
        console.log("Simplifying complex flowchart with", nodeCount, "connections");
        const lines = cleanMermaidCode.split('\n').slice(0, 16);
        cleanMermaidCode = lines.join('\n');
      }
      
      // Create updated flowchart object
      const updatedFlowchart = {
        ...generatedFlowchart,
        mermaidCode: cleanMermaidCode
      };
      
      setFlowchart(updatedFlowchart);
      
      // Force re-render of flowchart
      setTimeout(() => {
        if (flowchartRef.current) {
          const div = flowchartRef.current;
          const currentDisplay = div.style.display;
          div.style.display = 'none';
          void div.offsetHeight;
          div.style.display = currentDisplay;
        }
      }, 100);
      
      return updatedFlowchart;
    } catch (error) {
      console.error("Error generating flowchart:", error);
      toast({
        title: "Flowchart Generation Error",
        description: "There was a problem creating the flowchart. Trying again with simpler content.",
        variant: "destructive",
      });
      
      // Create a simple fallback flowchart
      const fallbackFlowchart = {
        id: `flowchart-${Date.now()}`,
        title: "Simplified Flowchart",
        mermaidCode: `graph TD
          A[Main Topic] --> B[Subtopic 1]
          A --> C[Subtopic 2]
          B --> D[Detail 1]
          C --> E[Detail 2]`,
        content: text,
        createdAt: new Date(),
      };
      
      setFlowchart(fallbackFlowchart);
      return fallbackFlowchart;
    }
  };

  const handleGenerateNotes = async () => {
    if (!text.trim()) return;
    
    try {
      const generatedNotes = await generateNotes(text);
      
      if (generatedNotes) {
        let processedNotes: string[] = [];
        
        if (typeof generatedNotes === 'string') {
          processedNotes = [generatedNotes];
        } else if (Array.isArray(generatedNotes)) {
          if (generatedNotes.length === 0) {
            processedNotes = [];
          } else if (typeof generatedNotes[0] === 'string') {
            processedNotes = generatedNotes as string[];
          } else if (typeof generatedNotes[0] === 'object' && generatedNotes[0] !== null) {
            // Cast to unknown first, then to NotesItem[]
            const notesItems = generatedNotes as unknown as NotesItem[];
            processedNotes = notesItems.map(note => typeof note.content === 'string' ? note.content : '');
          }
        }
        
        setNotes(processedNotes);
        return processedNotes;
      }
    } catch (error) {
      console.error("Error generating notes:", error);
      throw error;
    }
  };

  const handleTranscriptExtracted = (transcriptData: { text: string; videoId: string; videoTitle: string }) => {
    setText(transcriptData.text);
    setTitle(transcriptData.videoTitle || "YouTube Learning");
  };

  const handleTextUpload = (content: string, fileName: string) => {
    setText(content);
    setTitle(fileName);
  };

  const handleImageUpload = (imageUrl: string, imageName: string) => {
    // In a real implementation, this would use image recognition AI
    // For now, we'll set placeholder text
    setText(`Image uploaded: ${imageName}. This is a placeholder for image content that would be extracted using OCR or image recognition.`);
    setTitle(imageName);
  };

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const goToNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const goToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const resetCardDeck = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const downloadFlashcards = () => {
    if (!flashcards.length) return;
    
    const fileTitle = title || "LearnFlow Flashcards";
    
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileTitle} - Flashcards</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
        body { 
          font-family: 'Caveat', cursive;
          margin: 40px;
          font-size: 20px;
          line-height: 1.6;
        }
        h1 { color: #3b82f6; margin-bottom: 30px; font-size: 36px; }
        h2 { color: #60a5fa; margin-top: 30px; font-size: 28px; }
        .flashcard { 
          border: 2px solid #93c5fd; 
          padding: 20px; 
          margin-bottom: 20px; 
          border-radius: 10px;
          page-break-inside: avoid;
          background-color: #f0f9ff;
        }
        .question { font-weight: bold; margin-bottom: 10px; color: #1e40af; }
        .answer { margin-top: 10px; }
      </style>
    </head>
    <body>
      <h1>${fileTitle} - Flashcards</h1>
    `;
    
    flashcards.forEach((card, index) => {
      htmlContent += `
      <div class="flashcard">
        <div class="question">Q${index + 1}: ${card.question}</div>
        <div class="answer">A: ${card.answer}</div>
      </div>
      `;
    });
    
    htmlContent += `
    </body>
    </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileTitle.replace(/[^a-zA-Z0-9]/g, "_")}_flashcards.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Flashcards Downloaded",
      description: "Your flashcards have been downloaded as a document.",
    });
  };

  const downloadKeyPoints = () => {
    if (!keyPoints.length) return;
    
    const fileTitle = title || "LearnFlow Key Points";
    
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileTitle} - Key Points</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
        body { 
          font-family: 'Caveat', cursive;
          margin: 40px;
          font-size: 20px;
          line-height: 1.6;
        }
        h1 { color: #3b82f6; margin-bottom: 30px; font-size: 36px; }
        ul { padding-left: 30px; }
        li { 
          margin-bottom: 15px; 
          color: #1e40af;
          list-style-type: circle;
        }
      </style>
    </head>
    <body>
      <h1>${fileTitle} - Key Points</h1>
      <ul>
    `;
    
    keyPoints.forEach(point => {
      htmlContent += `<li>${point}</li>`;
    });
    
    htmlContent += `
      </ul>
    </body>
    </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileTitle.replace(/[^a-zA-Z0-9]/g, "_")}_key_points.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Key Points Downloaded",
      description: "Your key points have been downloaded as a document.",
    });
  };

  const downloadNotes = () => {
    if (!notes.length) return;
    
    const fileTitle = title || "LearnFlow Notes";
    
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileTitle} - Notes</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
        body { 
          font-family: 'Caveat', cursive;
          margin: 40px;
          font-size: 20px;
          line-height: 1.6;
        }
        h1 { color: #3b82f6; margin-bottom: 30px; font-size: 36px; }
        p { 
          margin-bottom: 15px; 
          color: #1e40af;
        }
      </style>
    </head>
    <body>
      <h1>${fileTitle} - Notes</h1>
    `;
    
    notes.forEach(note => {
      htmlContent += `<p>${note}</p>`;
    });
    
    htmlContent += `
    </body>
    </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileTitle.replace(/[^a-zA-Z0-9]/g, "_")}_notes.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Notes Downloaded",
      description: "Your notes have been downloaded as a document.",
    });
  };

  const downloadFlowchartImage = () => {
    if (!flowchartRef.current || !flowchart) return;
    
    const svgElement = flowchartRef.current.querySelector("svg");
    if (!svgElement) {
      toast({
        title: "Download Failed",
        description: "Could not find the flowchart to download.",
        variant: "destructive",
      });
      return;
    }
    
    const svgCopy = svgElement.cloneNode(true) as SVGElement;
    svgCopy.setAttribute("width", "1200");
    svgCopy.setAttribute("height", "800");
    
    const svgString = new XMLSerializer().serializeToString(svgCopy);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    
    return { blob, svgString };
  };

  const getFlowchartSvgDataUrl = () => {
    if (!flowchart) return null;
    // Use mermaid.render to generate SVG from code
    let svgString = "";
    let diagramId = `download-mermaid-diagram-${Date.now()}`;
    try {
      mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose", flowchart: { useMaxWidth: true, htmlLabels: true } });
      // Synchronous rendering is not available, so use a Promise and block with then (since this is only for download)
      mermaid.render(diagramId, flowchart.mermaidCode.trim().startsWith('graph') ? flowchart.mermaidCode : 'graph TD\n' + flowchart.mermaidCode, (svg) => {
        svgString = svg;
      });
      if (!svgString) return null;
      // Add width/height and styles for Word compatibility
      const svgDoc = new DOMParser().parseFromString(svgString, "image/svg+xml");
      const svgElem = svgDoc.querySelector("svg");
      if (svgElem) {
        svgElem.setAttribute("width", "800");
        svgElem.setAttribute("height", "600");
        svgElem.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        // Add custom styles
        const style = svgDoc.createElementNS("http://www.w3.org/2000/svg", "style");
        style.textContent = `
          .node rect, .node circle, .node ellipse, .node polygon, .cluster rect {
            fill: #f0f9ff;
            stroke: #93c5fd;
            stroke-width: 1px;
          }
          .node.clickable {
            cursor: pointer;
          }
          .arrowheadPath {
            fill: #3b82f6;
          }
          .edgePath .path {
            stroke: #3b82f6;
            stroke-width: 2px;
          }
          .flowchart-label text {
            fill: #1e40af;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
        `;
        svgElem.appendChild(style);
        svgString = new XMLSerializer().serializeToString(svgElem);
      }
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
      return dataUrl;
    } catch (err) {
      return null;
    }
  };

  const downloadAllContent = () => {
    if (!flashcards.length && !keyPoints.length && !notes.length && !flowchart) {
      toast({
        title: "No Content to Download",
        description: "Please generate some content first.",
        variant: "destructive",
      });
      return;
    }
    
    const fileTitle = title || "LearnFlow Complete Study Guide";
    
    let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileTitle}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap');
        body { 
          font-family: 'Caveat', cursive;
          margin: 40px;
          font-size: 20px;
          line-height: 1.6;
        }
        h1 { color: #3b82f6; margin-bottom: 20px; font-size: 36px; text-align: center; }
        h2 { color: #60a5fa; margin-top: 40px; font-size: 28px; border-bottom: 1px solid #bfdbfe; padding-bottom: 10px; }
        .flashcard { 
          border: 2px solid #93c5fd; 
          padding: 20px; 
          margin-bottom: 20px; 
          border-radius: 10px;
          page-break-inside: avoid;
          background-color: #f0f9ff;
        }
        .question { font-weight: bold; margin-bottom: 10px; color: #1e40af; }
        .answer { margin-top: 10px; }
        ul { padding-left: 30px; }
        li { 
          margin-bottom: 15px; 
          color: #1e40af;
          list-style-type: circle;
        }
        p { 
          margin-bottom: 15px; 
          color: #1e40af;
        }
        .flowchart-container {
          margin: 20px 0;
          text-align: center;
          page-break-before: always;
          page-break-after: always;
        }
        .flowchart-image {
          max-width: 100%;
          height: auto;
          border: 2px solid #93c5fd;
          border-radius: 10px;
          margin-bottom: 15px;
        }
        .footer {
          text-align: center;
          margin-top: 50px;
          font-size: 16px;
          color: #9ca3af;
        }
        .page-break {
          page-break-before: always;
        }
      </style>
    </head>
    <body>
      <h1>${fileTitle}</h1>
      <p><em>Generated by LearnFlow on ${new Date().toLocaleDateString()}</em></p>
    `;
    
    if (flowchart) {
      const flowchartDataUrl = getFlowchartSvgDataUrl();
      
      if (flowchartDataUrl) {
        htmlContent += `
        <h2>Visual Concept Map</h2>
        <div class="flowchart-container" style="text-align:center;">
          <img class="flowchart-image" src="${flowchartDataUrl}" alt="${flowchart.title}" style="display:block;margin:0 auto;max-width:90%;height:auto;border:2px solid #93c5fd;border-radius:10px;" />
          <p><em>${flowchart.title}</em></p>
        </div>
        <div class="page-break"></div>
        `;
      } else {
        htmlContent += `
        <h2>Visual Concept Map</h2>
        <div class="flowchart-container">
          <p style="color: #6b7280; font-style: italic; padding: 20px; border: 1px dashed #93c5fd; border-radius: 10px; text-align: center;">
            Flowchart image could not be embedded. Please download the SVG separately.
          </p>
        </div>
        <div class="page-break"></div>
        `;
      }
    }
    
    if (keyPoints.length > 0) {
      htmlContent += `
      <h2>Key Points</h2>
      <ul>
      `;
      
      keyPoints.forEach(point => {
        htmlContent += `<li>${point}</li>`;
      });
      
      htmlContent += `
      </ul>
      <div class="page-break"></div>
      `;
    }
    
    if (notes.length > 0) {
      htmlContent += `
      <h2>Detailed Notes</h2>
      `;
      
      notes.forEach(note => {
        htmlContent += `<p>${note}</p>`;
      });
      
      htmlContent += `<div class="page-break"></div>`;
    }
    
    if (flashcards.length > 0) {
      htmlContent += `
      <h2>Flashcards</h2>
      `;
      
      flashcards.forEach((card, index) => {
        htmlContent += `
        <div class="flashcard">
          <div class="question">Q${index + 1}: ${card.question}</div>
          <div class="answer">A: ${card.answer}</div>
        </div>
        `;
      });
    }
    
    htmlContent += `
      <div class="footer">
        Created with LearnFlow - Your interactive learning assistant
      </div>
    </body>
    </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileTitle.replace(/[^a-zA-Z0-9]/g, "_")}_complete.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // If flowchart exists, also download it separately as SVG
    if (flowchart && flowchartRef.current) {
      const flowchartResult = downloadFlowchartImage();
      if (flowchartResult) {
        const { blob: svgBlob } = flowchartResult;
        saveAs(svgBlob, `${fileTitle.replace(/[^a-zA-Z0-9]/g, "_")}_flowchart.svg`);
      }
    }
    
    toast({
      title: "Complete Study Guide Downloaded",
      description: "All your learning materials have been downloaded as a document.",
    });
  };

  const enhanceMobileFlowchartView = () => {
    if (isMobile && flowchartRef.current) {
      const flowchartContainer = flowchartRef.current;
      
      setTimeout(() => {
        const svgElement = flowchartContainer.querySelector("svg");
        if (svgElement) {
          svgElement.style.maxWidth = "100%";
          svgElement.style.height = "auto";
          
          const nodes = svgElement.querySelectorAll(".node");
          nodes.forEach(node => {
            node.addEventListener("touchstart", function() {
              this.classList.add("node-active");
            });
            node.addEventListener("touchend", function() {
              this.classList.remove("node-active");
            });
          });
        }
      }, 500);
    }
  };

  useEffect(() => {
    if (flowchart) {
      enhanceMobileFlowchartView();
    }
  }, [flowchart, isMobile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
          Learning Hub
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transform any content into interactive flashcards, visualize concepts with flowcharts, and create comprehensive notes in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 hover:shadow-lg transition-all duration-300 border-primary/20 hover-card gradient-border">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <GraduationCap className="w-5 h-5 mr-2 text-primary" />
              Input Content
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for your learning materials"
                  className="mb-2"
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste text, notes, or any content to transform into learning materials"
                  className="h-40 mb-2"
                />
              </div>

              <MediaInput 
                onTranscriptExtracted={handleTranscriptExtracted}
                onTextUpload={handleTextUpload}
                onImageUpload={handleImageUpload}
                isProcessing={isLoading}
              />
              
              <Button
                onClick={handleGenerateAll}
                disabled={isLoading || !text.trim()}
                className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Learning Materials
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs 
            defaultValue="flashcards" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 w-full mb-4">
              <TabsTrigger value="flashcards" className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Flashcards
              </TabsTrigger>
              <TabsTrigger value="flowchart" className="flex items-center">
                <GitBranch className="h-4 w-4 mr-2" />
                Flowchart
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="flashcards" className="space-y-4">
              {flashcards.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadFlashcards}
                      className="text-xs mr-2"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Download Flashcards
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadAllContent}
                      className="text-xs"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Download All
                    </Button>
                  </div>
                  
                  <div className="relative h-64 sm:h-80">
                    <div 
                      className={`flashcard w-full h-full ${isFlipped ? 'flipped' : ''}`}
                      onClick={handleCardFlip}
                    >
                      <div className="flashcard-inner w-full h-full relative">
                        <div className="flashcard-front absolute w-full h-full bg-gradient-to-br from-primary/5 to-blue-400/5 rounded-xl border border-primary/20 shadow-lg p-6 flex items-center justify-center">
                          <div className="text-center">
                            <h3 className="text-lg sm:text-xl font-medium mb-4">{flashcards[currentCardIndex].question}</h3>
                            <div className="text-muted-foreground text-sm mt-4">
                              Tap to reveal answer
                            </div>
                          </div>
                        </div>
                        <div className="flashcard-back absolute w-full h-full bg-gradient-to-br from-primary/10 to-blue-400/10 rounded-xl border border-primary/20 shadow-lg p-6 flex items-center justify-center">
                          <div className="text-center">
                            <Badge className="bg-primary mb-3">Answer</Badge>
                            <p className="text-base sm:text-lg">{flashcards[currentCardIndex].answer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Card {currentCardIndex + 1} of {flashcards.length}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={goToPrevCard} 
                        disabled={currentCardIndex === 0}
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={resetCardDeck}
                        size="sm"
                      >
                        <RotateCw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                      <Button 
                        onClick={goToNextCard} 
                        disabled={currentCardIndex === flashcards.length - 1}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold">Key Points</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={downloadKeyPoints}
                        className="text-xs"
                      >
                        <FileDown className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {keyPoints.map((point, index) => (
                        <Card key={index} className="bg-primary/5 hover:bg-primary/10 transition-colors hover-card">
                          <CardContent className="p-4">
                            <p className="text-sm">{point}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                  
                  {notes.length > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Notes</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={downloadNotes}
                          className="text-xs"
                        >
                          <FileDown className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                      <Card className="hover-card">
                        <CardContent className="p-4 prose prose-sm max-w-none">
                          {notes.map((note, index) => (
                            <p key={index} className="mb-2">{note}</p>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg border-muted-foreground/20">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Flashcards Generated Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Enter your content and click "Generate Learning Materials" to create interactive flashcards.
                  </p>
                  <Button 
                    onClick={() => {
                      if (text.trim()) {
                        handleGenerateFlashcards();
                      }
                    }}
                    disabled={!text.trim()}
                    className="bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Flashcards
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="flowchart" className="space-y-4">
              {flowchart ? (
                <div className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadFlowchartImage}
                      className="text-xs mr-2"
                    >
                      <Image className="h-3 w-3 mr-1" />
                      Download Flowchart
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={downloadAllContent}
                      className="text-xs"
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Download All
                    </Button>
                  </div>
                  
                  <Card className="border-primary/20 overflow-hidden hover-card gradient-border">
                    <CardContent className="p-4">
                      <h3 className="text-lg font-semibold mb-3">{flowchart.title}</h3>
                      <div ref={flowchartRef}>
                        <MermaidRenderer 
                          chart={flowchart.mermaidCode} 
                          title={flowchart.title}
                          className="min-h-[400px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("flashcards")}
                      className="flex items-center"
                    >
                      View Flashcards
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg border-muted-foreground/20">
                  <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Flowchart Generated Yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Enter your content and click "Generate Learning Materials" to create a visual flowchart.
                  </p>
                  <Button 
                    onClick={() => {
                      if (text.trim()) {
                        handleGenerateFlowchart();
                      }
                    }}
                    disabled={!text.trim()}
                    className="bg-gradient-to-r from-primary to-blue-400 hover:from-primary/90 hover:to-blue-400/90"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Flowchart
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default LearningHub;
