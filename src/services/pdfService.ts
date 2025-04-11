
// This service handles PDF extraction and processing

import { GEMINI_API_KEY, GEMINI_API_URL } from "./api";

export interface PDFContent {
  text: string;
  title: string;
}

export interface KeywordCorrelation {
  keywords: string[];
  correlations: {
    source: string;
    target: string;
    relationship: string;
  }[];
}

export const extractPDFContent = async (file: File): Promise<PDFContent> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        
        // In a real app, you would use a PDF parsing library
        // For now, we'll return the file name and a placeholder
        resolve({
          text: `Content extracted from ${file.name}. In a real implementation, this would contain the actual text content of the PDF document.`,
          title: file.name.split('.')[0] || 'Uploaded Document'
        });
      } catch (error) {
        reject(new Error(`Failed to extract PDF content: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the PDF file'));
    };
    
    reader.readAsText(file);
  });
};

// Function to handle document files like .docx
export const extractDocContent = async (file: File): Promise<PDFContent> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        
        // In a real app, you would use a document parsing library
        // For now, we'll return the file name and a placeholder
        resolve({
          text: `Content extracted from ${file.name}. In a real implementation, this would contain the actual text content of the document.`,
          title: file.name.split('.')[0] || 'Uploaded Document'
        });
      } catch (error) {
        reject(new Error(`Failed to extract document content: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the document file'));
    };
    
    reader.readAsText(file);
  });
};

// Function to handle pdfUrl when it's a string URL
export const extractPDFContentFromUrl = async (pdfUrl: string): Promise<PDFContent> => {
  try {
    // In a real implementation, you would fetch the PDF and extract its content
    return {
      text: `Content extracted from URL: ${pdfUrl}. In a real implementation, this would contain the actual text content of the PDF document.`,
      title: pdfUrl.split('/').pop()?.split('.')[0] || 'Downloaded Document'
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF content from URL: ${error}`);
  }
};

// Extract keywords and correlations from document text
export const extractKeywordsAndCorrelations = async (text: string): Promise<KeywordCorrelation> => {
  try {
    console.log("Sending document text to Gemini API for keyword extraction");
    
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
                text: `Analyze the following document text and extract:
                1. A list of key terms or concepts (maximum 15)
                2. A list of relationships between these terms (how they connect or relate to each other)

                Format your response as a JSON object with two properties:
                - "keywords": an array of strings containing the key terms
                - "correlations": an array of objects with properties "source" (a keyword), "target" (another keyword), and "relationship" (a brief description of how they relate)

                Document text:
                ${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze document: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Extract the JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from API response");
    }
    
    const jsonStr = jsonMatch[0];
    console.log("Extracted keyword correlation JSON:", jsonStr);
    
    const keywordData = JSON.parse(jsonStr) as KeywordCorrelation;
    
    return {
      keywords: keywordData.keywords || [],
      correlations: keywordData.correlations || []
    };
  } catch (error) {
    console.error("Error extracting keywords and correlations:", error);
    return {
      keywords: [],
      correlations: []
    };
  }
};

// Generate a Mermaid flowchart from keywords and correlations
export const generateMermaidFromKeywords = async (
  keywordData: KeywordCorrelation
): Promise<string> => {
  try {
    if (!keywordData.keywords || keywordData.keywords.length === 0) {
      return "graph TD\n  A[No keywords found] --> B[Please try with more content]";
    }
    
    // Start building the Mermaid flowchart
    let mermaidCode = "graph TD\n";
    
    // Create a mapping for nodes (convert spaces to underscores for node IDs)
    const nodeMap = new Map();
    keywordData.keywords.forEach((keyword, index) => {
      const nodeId = `node${index}`;
      nodeMap.set(keyword, nodeId);
      mermaidCode += `  ${nodeId}[${keyword}]\n`;
    });
    
    // Add the relationships
    if (keywordData.correlations && keywordData.correlations.length > 0) {
      keywordData.correlations.forEach((correlation) => {
        const sourceId = nodeMap.get(correlation.source);
        const targetId = nodeMap.get(correlation.target);
        
        if (sourceId && targetId) {
          mermaidCode += `  ${sourceId} --> |${correlation.relationship}| ${targetId}\n`;
        }
      });
    } else {
      // If no correlations provided, create some basic connections between adjacent keywords
      for (let i = 0; i < keywordData.keywords.length - 1; i++) {
        const sourceId = nodeMap.get(keywordData.keywords[i]);
        const targetId = nodeMap.get(keywordData.keywords[i + 1]);
        
        if (sourceId && targetId) {
          mermaidCode += `  ${sourceId} --> ${targetId}\n`;
        }
      }
    }
    
    return mermaidCode;
  } catch (error) {
    console.error("Error generating Mermaid flowchart:", error);
    return "graph TD\n  A[Error] --> B[Failed to generate flowchart]";
  }
};
