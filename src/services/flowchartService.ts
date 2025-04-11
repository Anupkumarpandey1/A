
import { GEMINI_API_KEY, GEMINI_API_URL } from "./api";

export interface FlowchartData {
  id: string;
  title: string;
  mermaidCode: string;
  content: string;
  createdAt: Date;
}

export const generateFlowchart = async (text: string): Promise<FlowchartData> => {
  try {
    console.log("Generating flowchart with text:", text.substring(0, 50) + "...");
    console.log("Using API URL:", GEMINI_API_URL);
    
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
                text: `Generate a Mermaid.js flowchart diagram based on the following content. Focus on creating a hierarchical structure with main topics and subtopics. Format your response with a JSON object containing two fields: "title" - a short descriptive title for the flowchart (max 5 words), and "mermaidCode" - the complete Mermaid.js code for the flowchart.

Important guidelines for valid Mermaid.js syntax:
1. Use "graph TD" (top-down) syntax
2. Each node must have a unique ID (like A, B, C or node1, node2)
3. Node text must be wrapped in square brackets: A[Node text]
4. Connections must use -- or --> syntax: A --> B
5. Keep the syntax simple and avoid advanced features
6. DO NOT use parentheses for node labels, use square brackets
7. Each relationship must be on its own line
8. NO line breaks within node text

Example of CORRECT syntax:
graph TD
    A[Main Topic] --> B[Subtopic 1]
    A --> C[Subtopic 2]
    B --> D[Detail 1]
    B --> E[Detail 2]

Content: ${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate flowchart: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Received response from Gemini API:", data);
    
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response text
    const jsonStart = generatedText.indexOf('{');
    const jsonEnd = generatedText.lastIndexOf('}') + 1;
    const jsonStr = generatedText.substring(jsonStart, jsonEnd);
    
    const flowchartData = JSON.parse(jsonStr);
    console.log("Parsed flowchart data:", flowchartData);
    
    // Clean and sanitize the Mermaid code
    let sanitizedMermaidCode = flowchartData.mermaidCode || "";
    
    // Replace any parentheses with square brackets
    sanitizedMermaidCode = sanitizedMermaidCode
      .replace(/\(([^)]+)\)/g, '[$1]')       // Replace (text) with [text]
      .replace(/\n\s+/g, '\n')               // Remove extra whitespace at line beginnings
      .replace(/\\n/g, ' ')                  // Replace escaped newlines with spaces
      .trim();
    
    // Ensure the diagram starts with graph TD
    if (!sanitizedMermaidCode.startsWith('graph TD')) {
      sanitizedMermaidCode = 'graph TD\n' + sanitizedMermaidCode;
    }
    
    // Fix node definitions with parentheses
    const fixedCode = sanitizedMermaidCode
      .split('\n')
      .map(line => {
        // Skip empty lines
        if (!line.trim()) return '';
        
        // Already using correct syntax
        if (line.includes('[') && line.includes(']')) return line;
        
        // Fix connection lines
        if (line.includes('-->')) {
          const parts = line.split('-->').map(p => p.trim());
          if (parts.length === 2) {
            // Add brackets if missing
            const source = parts[0].includes('[') ? parts[0] : `${parts[0]}[${parts[0]}]`;
            const target = parts[1].includes('[') ? parts[1] : `${parts[1]}[${parts[1]}]`;
            return `${source} --> ${target}`;
          }
        }
        
        return line;
      })
      .filter(line => line.trim())
      .join('\n');
    
    return {
      id: `flowchart-${Date.now()}`,
      title: flowchartData.title || "Generated Flowchart",
      mermaidCode: fixedCode,
      content: text,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error generating flowchart:", error);
    // Return a fallback simple flowchart
    return {
      id: `flowchart-${Date.now()}`,
      title: "Simple Fallback Flowchart",
      mermaidCode: "graph TD\n    A[Main Topic] --> B[Subtopic]\n    B --> C[Details]",
      content: text,
      createdAt: new Date(),
    };
  }
};

// Mock database of flowcharts
let flowcharts: FlowchartData[] = [];

// Save a flowchart
export const saveFlowchart = (flowchart: FlowchartData): FlowchartData => {
  flowcharts.push(flowchart);
  return flowchart;
};

// Get all flowcharts
export const getAllFlowcharts = (): FlowchartData[] => {
  return [...flowcharts];
};

// Get a flowchart by ID
export const getFlowchartById = (id: string): FlowchartData | undefined => {
  return flowcharts.find(flowchart => flowchart.id === id);
};
