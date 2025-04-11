
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { FileDown, FileImage, Code } from "lucide-react";
import { saveAs } from 'file-saver';
import { FlowchartData } from '@/types/quizTypes';
import { useToast } from "@/components/ui/use-toast";

interface FlowchartDownloadProps {
  flowchart: FlowchartData | null;
  flowchartRef: React.RefObject<HTMLDivElement>;
  title?: string;
}

const FlowchartDownload: React.FC<FlowchartDownloadProps> = ({ 
  flowchart, 
  flowchartRef, 
  title = "Flowchart" 
}) => {
  const { toast } = useToast();

  const downloadAsSVG = () => {
    if (!flowchartRef.current || !flowchart) {
      toast({
        title: "Download Failed",
        description: "Could not find the flowchart to download.",
        variant: "destructive",
      });
      return;
    }
    
    const svgElement = flowchartRef.current.querySelector("svg");
    if (!svgElement) {
      toast({
        title: "Download Failed",
        description: "Could not find the SVG element.",
        variant: "destructive",
      });
      return;
    }
    
    const svgCopy = svgElement.cloneNode(true) as SVGElement;
    svgCopy.setAttribute("width", "1200");
    svgCopy.setAttribute("height", "800");
    svgCopy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Make svg self-contained by adding styles
    const style = document.createElement('style');
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
    svgCopy.appendChild(style);
    
    const svgString = new XMLSerializer().serializeToString(svgCopy);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    
    saveAs(blob, `${(title || flowchart.title || "flowchart").replace(/[^a-zA-Z0-9]/g, "_")}.svg`);
    
    toast({
      title: "Flowchart Downloaded",
      description: "Your flowchart has been downloaded as SVG.",
    });
  };

  const downloadAsPNG = () => {
    if (!flowchartRef.current || !flowchart) {
      toast({
        title: "Download Failed",
        description: "Could not find the flowchart to download.",
        variant: "destructive",
      });
      return;
    }
    
    const svgElement = flowchartRef.current.querySelector("svg");
    if (!svgElement) {
      toast({
        title: "Download Failed",
        description: "Could not find the SVG element.",
        variant: "destructive",
      });
      return;
    }
    
    const svgCopy = svgElement.cloneNode(true) as SVGElement;
    svgCopy.setAttribute("width", "1200");
    svgCopy.setAttribute("height", "800");
    svgCopy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    
    // Make svg self-contained by adding styles
    const style = document.createElement('style');
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
    svgCopy.appendChild(style);
    
    const svgString = new XMLSerializer().serializeToString(svgCopy);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 800;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        // Fill white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG on the canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, `${(title || flowchart.title || "flowchart").replace(/[^a-zA-Z0-9]/g, "_")}.png`);
            
            toast({
              title: "Flowchart Downloaded",
              description: "Your flowchart has been downloaded as PNG.",
            });
          }
        }, "image/png");
      }
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  };

  const downloadSourceCode = () => {
    if (!flowchart) {
      toast({
        title: "Download Failed",
        description: "No flowchart data available.",
        variant: "destructive",
      });
      return;
    }
    
    const mermaidCode = flowchart.mermaidCode;
    const blob = new Blob([mermaidCode], { type: "text/plain;charset=utf-8" });
    
    saveAs(blob, `${(title || flowchart.title || "flowchart").replace(/[^a-zA-Z0-9]/g, "_")}_source.txt`);
    
    toast({
      title: "Source Code Downloaded",
      description: "The Mermaid.js source code for your flowchart has been downloaded.",
    });
  };

  if (!flowchart) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={downloadAsSVG}
        className="flex items-center gap-2"
      >
        <FileDown className="h-3.5 w-3.5" />
        <span>SVG</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={downloadAsPNG}
        className="flex items-center gap-2"
      >
        <FileImage className="h-3.5 w-3.5" />
        <span>PNG</span>
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={downloadSourceCode}
        className="flex items-center gap-2"
      >
        <Code className="h-3.5 w-3.5" />
        <span>Source</span>
      </Button>
    </div>
  );
};

export default FlowchartDownload;
