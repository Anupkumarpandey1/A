import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import mermaid from "mermaid";
import { Fullscreen, Minimize, Download, ArrowLeft, Move, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface MermaidRendererProps {
  chart: string;
  className?: string;
  title?: string;
}

const MermaidRenderer = ({ chart, className = "", title }: MermaidRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<"view" | "move">("view");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [startTouchDistance, setStartTouchDistance] = useState<number | null>(null);
  const [startZoomLevel, setStartZoomLevel] = useState<number>(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStartPosition, setPanStartPosition] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [renderAttempts, setRenderAttempts] = useState(0);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const toggleFullscreen = () => {
    if (isDialogOpen) {
      setIsDialogOpen(false);
    } else {
      setIsFullscreen(!isFullscreen);
    }
  };

  const openFullscreenDialog = () => {
    setIsDialogOpen(true);
  };

  const closeFullscreenDialog = () => {
    setIsDialogOpen(false);
  };

  const toggleInteractionMode = () => {
    setInteractionMode(interactionMode === "view" ? "move" : "view");
    toast({
      title: interactionMode === "view" ? "Move mode activated" : "View mode activated",
      description: interactionMode === "view" 
        ? "You can now drag and move nodes around." 
        : "Node movement is disabled.",
    });
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleZoomChange = (value: number[]) => {
    setZoomLevel(value[0]);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const downloadSvg = () => {
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;
    
    const svgCopy = svgElement.cloneNode(true) as SVGElement;
    svgCopy.setAttribute("width", "1200");
    svgCopy.setAttribute("height", "800");
    
    const svgString = new XMLSerializer().serializeToString(svgCopy);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "flowchart"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Flowchart downloaded",
      description: "Your flowchart has been downloaded as SVG.",
    });
  };

  const enableNodeDragging = () => {
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;
    
    const nodes = svgElement.querySelectorAll(".node");
    
    nodes.forEach(node => {
      node.removeEventListener("mousedown", handleMouseDown as EventListener);
      node.removeEventListener("touchstart", handleTouchStart as EventListener);
    });
    
    if (interactionMode === "move") {
      nodes.forEach(node => {
        node.setAttribute("cursor", "move");
        node.addEventListener("mousedown", handleMouseDown as EventListener);
        node.addEventListener("touchstart", handleTouchStart as EventListener);
      });
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (interactionMode !== "move") return;
    
    const targetNode = (e.target as Element).closest(".node");
    if (!targetNode) return;
    
    setIsDragging(true);
    setDraggedNodeId(targetNode.id);
    
    e.preventDefault();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      if (startTouchDistance === null) {
        setStartTouchDistance(distance);
        setStartZoomLevel(zoomLevel);
      } else {
        const scale = distance / startTouchDistance;
        const newZoom = Math.max(0.5, Math.min(2, startZoomLevel * scale));
        setZoomLevel(newZoom);
      }
    } else if (e.touches.length === 1 && !isDragging) {
      e.preventDefault();
      
      if (!isPanning) {
        setIsPanning(true);
        setPanStartPosition({
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        });
        return;
      }
      
      const deltaX = e.touches[0].clientX - panStartPosition.x;
      const deltaY = e.touches[0].clientY - panStartPosition.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX / zoomLevel,
        y: prev.y + deltaY / zoomLevel
      }));
      
      setPanStartPosition({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (isDragging && draggedNodeId) {
      e.preventDefault();
      
      const svgElement = containerRef.current?.querySelector("svg");
      if (!svgElement) return;
      
      const draggedNode = svgElement.querySelector(`#${draggedNodeId}`);
      if (!draggedNode) return;
      
      const touch = e.touches[0];
      const svgRect = svgElement.getBoundingClientRect();
      const x = (touch.clientX - svgRect.left) / zoomLevel;
      const y = (touch.clientY - svgRect.top) / zoomLevel;
      
      const transform = draggedNode.getAttribute("transform") || "";
      const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
      
      draggedNode.setAttribute("transform", `translate(${x},${y})`);
      
      updateConnectedEdges(draggedNodeId, svgElement);
    }
  };

  const handleTouchEnd = () => {
    setStartTouchDistance(null);
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const handleMouseDown = (e: MouseEvent) => {
    if (interactionMode !== "move") return;
    
    const targetNode = (e.target as Element).closest(".node");
    if (!targetNode) return;
    
    setIsDragging(true);
    setDraggedNodeId(targetNode.id);
    
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || interactionMode !== "move" || !draggedNodeId) return;
    
    const svgElement = containerRef.current?.querySelector("svg");
    if (!svgElement) return;
    
    const draggedNode = svgElement.querySelector(`#${draggedNodeId}`);
    if (!draggedNode) return;
    
    const svgRect = svgElement.getBoundingClientRect();
    const x = (e.clientX - svgRect.left) / zoomLevel - panOffset.x;
    const y = (e.clientY - svgRect.top) / zoomLevel - panOffset.y;
    
    draggedNode.setAttribute("transform", `translate(${x},${y})`);
    
    updateConnectedEdges(draggedNodeId, svgElement);
  };

  const updateConnectedEdges = (nodeId: string, svgElement: SVGElement) => {
    const edgeGroups = svgElement.querySelectorAll(`.edgePath`);
    
    edgeGroups.forEach(edgeGroup => {
      const edgePath = edgeGroup.querySelector("path");
      if (!edgePath) return;
      
      if (edgeGroup.id && (edgeGroup.id.includes(nodeId + "-") || edgeGroup.id.includes("-" + nodeId))) {
        edgeGroup.classList.add("needs-update");
      }
    });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    setDraggedNodeId(null);
    
    const svgElement = containerRef.current?.querySelector("svg");
    if (svgElement) {
      const edgesNeedingUpdate = svgElement.querySelectorAll(".edgePath.needs-update");
      edgesNeedingUpdate.forEach(edge => edge.classList.remove("needs-update"));
    }
  };

  useEffect(() => {
    const renderMermaidChart = () => {
      if (!containerRef.current) return;

      mermaid.initialize({
        startOnLoad: true,
        theme: "default",
        securityLevel: "loose",
        flowchart: { 
          useMaxWidth: true,
          htmlLabels: true,
          curve: "basis",
          rankSpacing: 100,
          nodeSpacing: 50,
        },
        themeVariables: {
          primaryColor: "#a855f7",
          primaryTextColor: "#ffffff",
          primaryBorderColor: "#c084fc",
          lineColor: "#a855f7",
          secondaryColor: "#f0abfc",
          tertiaryColor: "#f5f5f5"
        }
      });
      
      try {
        containerRef.current.innerHTML = "";
        
        const diagramId = `mermaid-diagram-${Date.now()}`;
        
        console.log("Rendering Mermaid chart:", chart.substring(0, 50) + "...");
        
        let processedChart = chart.trim();
        if (!processedChart.startsWith('graph TD') && !processedChart.startsWith('graph TB')) {
          processedChart = 'graph TD\n' + processedChart;
        }
        
        processedChart = processedChart
          .replace(/\n\s+\(/g, '[')
          .replace(/\)\n/g, ']\n')
          .replace(/\n\s+/g, '\n')
          .replace(/\([^)]*\)/g, match => match.replace(/\(/g, '[').replace(/\)/g, ']'));
        
        mermaid.render(diagramId, processedChart).then(({ svg }) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svg;
            
            const svgElement = containerRef.current.querySelector("svg");
            if (svgElement) {
              svgElement.setAttribute("width", "100%");
              svgElement.setAttribute("height", "auto");
              svgElement.style.maxWidth = "100%";
              
              const graphContainer = svgElement.querySelector("g.graph");
              if (graphContainer && graphContainer instanceof SVGElement) {
                graphContainer.style.transform = `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`;
                graphContainer.style.transformOrigin = "center";
                graphContainer.style.transition = "transform 0.2s ease";
              }
              
              svgElement.style.borderRadius = "8px";
              svgElement.style.padding = "16px";
              
              const style = document.createElement('style');
              style.textContent = `
                .node { cursor: ${interactionMode === "move" ? "move" : "pointer"}; }
                .node:hover { filter: brightness(1.1); }
                .node.dragging { opacity: 0.8; }
                .node-active { filter: brightness(0.8); }
                .edgePath { pointer-events: none; }
                .graph { transform-origin: center; transition: transform 0.2s; }
                
                @media (max-width: 768px) {
                  .node:active { filter: brightness(0.8); }
                  .react-flow__controls { transform: scale(1.5); }
                }
              `;
              svgElement.appendChild(style);
              
              enableNodeDragging();
              
              if (isMobile && renderAttempts === 0) {
                setTimeout(() => {
                  setZoomLevel(0.8);
                }, 300);
              }
            }
          }
        }).catch(error => {
          console.error("Mermaid rendering error inside promise:", error);
          
          if (renderAttempts < 3) {
            setRenderAttempts(prev => prev + 1);
            
            const simplifiedChart = `graph TD
              A[Main Topic] --> B[Subtopic 1]
              A --> C[Subtopic 2]
              B --> D[Detail 1]
              C --> E[Detail 2]`;
            
            setTimeout(() => {
              mermaid.render(diagramId, simplifiedChart).then(({ svg }) => {
                if (containerRef.current) {
                  containerRef.current.innerHTML = svg;
                  
                  const svgElement = containerRef.current.querySelector("svg");
                  if (svgElement) {
                    svgElement.setAttribute("width", "100%");
                    svgElement.setAttribute("height", "auto");
                    svgElement.style.maxWidth = "100%";
                  }
                }
              }).catch(fallbackError => {
                if (containerRef.current) {
                  containerRef.current.innerHTML = `<div class="p-4 text-red-500 border border-red-300 rounded">Failed to render flowchart: Please try with simpler content</div>`;
                }
              });
            }, 100);
          } else if (containerRef.current) {
            containerRef.current.innerHTML = `<div class="p-4 text-red-500 border border-red-300 rounded">Failed to render flowchart: ${error.message}</div>`;
          }
        });
      } catch (error) {
        console.error("Mermaid rendering error in try/catch:", error);
        if (containerRef.current) {
          containerRef.current.innerHTML = `<div class="p-4 text-red-500 border border-red-300 rounded">Failed to render flowchart: Invalid syntax</div>`;
        }
      }
    };
    
    renderMermaidChart();
  }, [chart, interactionMode, zoomLevel, panOffset, isMobile, renderAttempts]);

  const fullscreenContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className={isMobile ? "sr-only" : ""}>Back</span>
        </Button>
        <h2 className="text-lg font-medium truncate max-w-[50%]">{title || "Flowchart"}</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleInteractionMode}
            className={interactionMode === "move" ? "bg-primary/10" : ""}
          >
            <Move className="h-4 w-4 mr-2" />
            <span className={isMobile ? "sr-only" : interactionMode === "move" ? "Moving" : "Move"}></span>
          </Button>
          <Button variant="outline" size="sm" onClick={downloadSvg}>
            <Download className="h-4 w-4 mr-2" />
            <span className={isMobile ? "sr-only" : "Download"}></span>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="w-40">
            <Slider
              value={[zoomLevel]}
              min={0.5}
              max={2}
              step={0.1}
              onValueChange={handleZoomChange}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
          <Button variant="outline" size="sm" onClick={resetView} className="ml-2">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div 
          ref={containerRef} 
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl border border-primary/10 rounded-lg min-h-[50vh] md:min-h-[500px] h-full w-full overflow-hidden"
        >
          {/* Mermaid diagram will be rendered here */}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute top-2 right-2 flex space-x-2 z-10">
          <Button variant="outline" size="icon" onClick={() => setIsDialogOpen(true)} className="rounded-full bg-background/80 backdrop-blur-sm">
            <Fullscreen className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={downloadSvg} className="rounded-full bg-background/80 backdrop-blur-sm">
            <Download className="h-4 w-4" />
          </Button>
        </div>
        <div 
          ref={isDialogOpen ? null : containerRef} 
          className="overflow-auto rounded-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl border border-primary/10 p-4 min-h-[200px]"
          style={isDialogOpen ? {} : { transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
        >
          {/* Mermaid diagram will be rendered here in non-dialog mode */}
        </div>
        {!isDialogOpen && (
          <div className="absolute bottom-2 right-2 flex space-x-1 z-10 bg-background/80 backdrop-blur-sm p-1 rounded-full">
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleZoomOut}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={handleZoomIn}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        )}
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">{title || "Flowchart"}</DialogTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <Button variant="ghost" size="sm" onClick={() => setIsDialogOpen(false)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className={isMobile ? "sr-only" : ""}>Back</span>
              </Button>
              <h2 className="text-lg font-medium truncate max-w-[50%]">{title || "Flowchart"}</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleInteractionMode}
                  className={interactionMode === "move" ? "bg-primary/10" : ""}
                >
                  <Move className="h-4 w-4 mr-2" />
                  <span className={isMobile ? "sr-only" : interactionMode === "move" ? "Moving" : "Move"}></span>
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSvg}>
                  <Download className="h-4 w-4 mr-2" />
                  <span className={isMobile ? "sr-only" : "Download"}></span>
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="w-40">
                  <Slider
                    value={[zoomLevel]}
                    min={0.5}
                    max={2}
                    step={0.1}
                    onValueChange={handleZoomChange}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground w-16 text-center">{Math.round(zoomLevel * 100)}%</span>
                <Button variant="outline" size="sm" onClick={resetView} className="ml-2">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div 
                ref={containerRef} 
                className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-xl border border-primary/10 rounded-lg min-h-[50vh] md:min-h-[500px] h-full w-full overflow-hidden"
              >
                {/* Mermaid diagram will be rendered here */}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MermaidRenderer;