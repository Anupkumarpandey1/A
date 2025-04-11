
import { GEMINI_API_KEY, GEMINI_API_URL } from "./api";

export interface VideoSummary {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  createdAt: Date;
}

export const generateVideoSummary = async (transcript: string): Promise<VideoSummary> => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Create a detailed, well-structured summary of the following video transcript. Format your response with clear headings and subheadings. 
                Include a section called "Key Points" at the end that extracts 5-8 important points from the transcript that would be good for creating flashcards and flowcharts.
                Transcript: ${transcript}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate summary");
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract key points from the summary
    const keyPointsMatch = generatedText.match(/Key Points:([\s\S]*?)(?:\n\n|$)/);
    const keyPointsText = keyPointsMatch ? keyPointsMatch[1].trim() : "";
    const keyPoints = keyPointsText
      .split('\n')
      .map(point => point.replace(/^[*-]\s+/, '').trim())
      .filter(point => point.length > 0);
    
    // Generate a title from the summary
    const firstLineMatch = generatedText.match(/^.*$/m);
    const title = firstLineMatch ? firstLineMatch[0].replace(/^#+\s+/, '') : "Video Summary";
    
    return {
      id: `summary-${Date.now()}`,
      title,
      content: generatedText,
      keyPoints,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
};

// Function to download summary as document
export const downloadSummaryAsDocument = (summary: VideoSummary): void => {
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
  URL.revokeObjectURL(url);
};
