
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VideoSummary } from "@/services/summaryService";
import { FormattedMessage } from "./FormattedMessage";
import { Copy, Download, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface YouTubeSummaryProps {
  summary: VideoSummary;
  onGenerateFlashcards?: (keyPoints: string[]) => void;
  onGenerateFlowchart?: (keyPoints: string[]) => void;
}

export const YouTubeSummary: React.FC<YouTubeSummaryProps> = ({
  summary,
  onGenerateFlashcards,
  onGenerateFlowchart,
}) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(summary.content);
    toast({
      title: "Summary copied",
      description: "The video summary has been copied to your clipboard.",
    });
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement("a");
    const file = new Blob([summary.content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `${summary.title.replace(/[^a-zA-Z0-9]/g, "_")}_summary.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Summary downloaded",
      description: "The video summary has been downloaded as a Markdown file.",
    });
  };

  const handleDownloadDocx = () => {
    // Create a simple HTML representation of the content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${summary.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #333; }
          h2 { color: #444; margin-top: 20px; }
          p { line-height: 1.5; }
          ul { margin-top: 10px; }
        </style>
      </head>
      <body>
        <h1>${summary.title}</h1>
        ${summary.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
      </body>
      </html>
    `;

    // Convert HTML to a Blob
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and click it
    const link = document.createElement('a');
    link.href = url;
    link.download = `${summary.title.replace(/[^a-zA-Z0-9]/g, "_")}_summary.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Document downloaded",
      description: "The video summary has been downloaded as a Word document.",
    });
  };

  return (
    <Card className="p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{summary.title}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
            <Download className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadDocx}>
            <FileText className="h-4 w-4 mr-2" />
            Document
          </Button>
        </div>
      </div>

      <div className={`overflow-hidden ${expanded ? "" : "max-h-96"}`}>
        <FormattedMessage content={summary.content} />
      </div>

      {!expanded && (
        <div className="flex justify-center mt-4">
          <Button variant="ghost" onClick={() => setExpanded(true)}>
            Show More
          </Button>
        </div>
      )}

      {summary.keyPoints.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-medium mb-2">Key Points</h3>
          <ul className="list-disc pl-5 space-y-1">
            {summary.keyPoints.map((point, index) => (
              <li key={index} className="text-muted-foreground">{point}</li>
            ))}
          </ul>

          <div className="flex space-x-3 mt-4">
            {onGenerateFlashcards && (
              <Button 
                variant="outline" 
                onClick={() => onGenerateFlashcards(summary.keyPoints)}
              >
                Generate Flashcards from Key Points
              </Button>
            )}
            {onGenerateFlowchart && (
              <Button 
                variant="outline" 
                onClick={() => onGenerateFlowchart(summary.keyPoints)}
              >
                Generate Study Notes from Key Points
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
