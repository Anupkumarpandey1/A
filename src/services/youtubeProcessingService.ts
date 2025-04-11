
import { generateFlowchart, FlowchartData } from "./flowchartService";
import { generateFlashcards, generateNotes, generateKeyPoints } from "./api";
import { generateVideoSummary, VideoSummary } from "./summaryService";
import { FlashcardItem, NotesItem } from "@/types/quizTypes";

// Processing multiple items in parallel for speed
export const processYoutubeContent = async (
  transcriptText: string
): Promise<{
  summary: VideoSummary;
  keyPoints: string[];
  isComplete: boolean;
}> => {
  try {
    // Process summary and key points in parallel for faster results
    const [summary, keyPoints] = await Promise.all([
      generateVideoSummary(transcriptText),
      generateKeyPoints(transcriptText)
    ]);
    
    return {
      summary,
      keyPoints,
      isComplete: true
    };
  } catch (error) {
    console.error("Error processing YouTube content:", error);
    throw error;
  }
};

// Generate flowchart from key points quickly for LearnFlow
export const generateFlowchartFromKeyPoints = async (
  keyPoints: string[]
): Promise<FlowchartData> => {
  // Join key points into a single text for faster processing
  const keyPointsText = keyPoints.join("\n\n");
  
  try {
    const flowchart = await generateFlowchart(keyPointsText);
    return flowchart;
  } catch (error) {
    console.error("Error generating flowchart from key points:", error);
    throw error;
  }
};

// Generate study materials more efficiently for LearnFlow
export const generateStudyMaterials = async (
  transcriptText: string
): Promise<{
  flashcards: FlashcardItem[];
  notes: string[];
}> => {
  try {
    // Process flashcards and notes in parallel for faster results
    const [flashcardsResult, notesResult] = await Promise.all([
      generateFlashcards(transcriptText),
      generateNotes(transcriptText)
    ]);
    
    // Process notes to ensure we return strings
    let processedNotes: string[] = [];
    
    if (Array.isArray(notesResult)) {
      if (notesResult.length > 0) {
        if (typeof notesResult[0] === 'string') {
          processedNotes = notesResult as unknown as string[];
        } else if (typeof notesResult[0] === 'object' && notesResult[0] !== null) {
          const notesItems = notesResult as unknown as NotesItem[];
          processedNotes = notesItems.map(note => note.content);
        }
      }
    } else if (typeof notesResult === 'string') {
      const notesString = notesResult as unknown as string;
      processedNotes = notesString.split('\n\n').filter(note => note.trim());
    } else {
      // Default empty array if none of the above conditions are met
      processedNotes = [];
    }
    
    return { 
      flashcards: flashcardsResult, 
      notes: processedNotes 
    };
  } catch (error) {
    console.error("Error generating study materials:", error);
    throw error;
  }
};
