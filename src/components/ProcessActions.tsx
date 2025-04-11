
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, BookOpen, GitBranch, BookOpen as Cards } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessActionsProps {
  onGenerateSummary: () => void;
  onGenerateFlashcards: () => void;
  onGenerateFlowchart: () => void;  // This property was missing in the interface
  isProcessing: boolean;
  processingProgress?: number;
  hasTranscript: boolean;
}

const ProcessActions: React.FC<ProcessActionsProps> = ({
  onGenerateSummary,
  onGenerateFlashcards,
  onGenerateFlowchart,
  isProcessing,
  processingProgress = 0,
  hasTranscript
}) => {
  return (
    <Card className="p-4 border-primary/20">
      {isProcessing && processingProgress > 0 && (
        <div className="mb-4">
          <Progress value={processingProgress} className="h-2" />
          <p className="text-xs text-center mt-1 text-muted-foreground">
            Processing: {processingProgress}%
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={onGenerateSummary}
          disabled={isProcessing || !hasTranscript}
          variant="outline"
          className="flex items-center justify-center h-20"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <BookOpen className="h-5 w-5 mr-2" />
              <div className="flex flex-col items-center">
                <span>Generate</span>
                <span>Summary</span>
              </div>
            </>
          )}
        </Button>

        <Button
          onClick={onGenerateFlashcards}
          disabled={isProcessing || !hasTranscript}
          variant="outline"
          className="flex items-center justify-center h-20"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Cards className="h-5 w-5 mr-2" />
              <div className="flex flex-col items-center">
                <span>Generate</span>
                <span>Flashcards</span>
              </div>
            </>
          )}
        </Button>

        <Button
          onClick={onGenerateFlowchart}
          disabled={isProcessing || !hasTranscript}
          variant="outline"
          className="flex items-center justify-center h-20"
        >
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <GitBranch className="h-5 w-5 mr-2" />
              <div className="flex flex-col items-center">
                <span>Generate</span>
                <span>Flowchart</span>
              </div>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ProcessActions;
