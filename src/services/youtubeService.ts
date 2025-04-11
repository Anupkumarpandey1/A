
import { RAPID_API_KEY } from "./api";

export interface YouTubeTranscript {
  text: string;
  videoId: string;
  videoTitle: string;
}

export const extractYouTubeTranscript = async (videoUrl: string): Promise<YouTubeTranscript> => {
  try {
    // Extract video ID from URL
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }
    
    // Use Promise with timeout for faster response handling
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timed out after 15 seconds'));
      }, 15000);
      
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;
      
      xhr.addEventListener('readystatechange', function () {
        if (this.readyState === this.DONE) {
          clearTimeout(timeout);
          
          if (this.status >= 200 && this.status < 300) {
            try {
              // Parse the response text to JSON
              const response = JSON.parse(this.responseText);
              
              // Extract transcript text from the response quickly
              let transcriptText = "";
              if (response.transcript) {
                transcriptText = response.transcript;
              } else if (response.segments) {
                // Faster concatenation for segments
                transcriptText = response.segments.map((segment: any) => segment.text).join(' ');
              } else {
                console.warn("Unexpected API response format:", response);
                transcriptText = this.responseText;
              }
              
              resolve({
                text: transcriptText,
                videoId,
                videoTitle: response.title || "YouTube Video",
              });
            } catch (error) {
              console.error("Error parsing response:", error, "Response:", this.responseText);
              // If JSON parsing fails, use the raw response text
              resolve({
                text: this.responseText,
                videoId,
                videoTitle: "YouTube Video",
              });
            }
          } else {
            reject(new Error(`YouTube API request failed with status: ${this.status}`));
          }
        }
      });
      
      // Set timeout for the request itself
      xhr.timeout = 15000;
      xhr.ontimeout = () => {
        reject(new Error('Request timed out'));
      };
      
      xhr.open('GET', `https://youtube-video-summarizer-gpt-ai.p.rapidapi.com/api/v1/get-transcript-v2?video_id=${videoId}&platform=youtube`);
      xhr.setRequestHeader('x-rapidapi-key', RAPID_API_KEY);
      xhr.setRequestHeader('x-rapidapi-host', 'youtube-video-summarizer-gpt-ai.p.rapidapi.com');
      
      xhr.send(null);
    });
  } catch (error) {
    console.error("Error extracting YouTube transcript:", error);
    throw error;
  }
};

// Extract video ID from various YouTube URL formats
export function extractVideoId(url: string): string {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]+)/) ||
                url.match(/(?:https?:\/\/)?(?:www\.)?youtu\.be\/([\w-]+)/);
  return match ? match[1] : "";
}
