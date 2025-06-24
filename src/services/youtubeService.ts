import { RAPID_API_KEY } from "./api";

const SUPADATA_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImtpZCI6IjEifQ.eyJpc3MiOiJuYWRsZXMiLCJpYXQiOiIxNzQzNTc3NzMzIiwicHVycG9zZSI6ImFwaV9hdXRoZW50aWNhdGlvbiIsInN1YiI6ImUwZDBmMTM3YTYyYTRiYzA4NGRlMTdhMWViZmRjNWUwIn0.5wSvZVmp3s7VOTT8khMKyM3jk74wj0n2ud91o1MEwT4";

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

    // Use the fast plain text endpoint
    const response = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
      method: 'GET',
      headers: {
        'x-api-key': SUPADATA_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Supadata API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    let transcriptText = "";
    // Prefer the 'content' field (plain text)
    if (typeof data.content === 'string') {
      transcriptText = data.content;
    } else if (data.transcript) {
      transcriptText = data.transcript;
    } else if (Array.isArray(data.segments)) {
      transcriptText = data.segments.map((segment: any) => segment.text).join(' ');
    } else {
      transcriptText = JSON.stringify(data);
    }

    // Clean up transcript: remove excessive whitespace, trim, etc.
    transcriptText = transcriptText.replace(/\s+/g, ' ').trim();

    return {
      text: transcriptText,
      videoId,
      videoTitle: data.title || "YouTube Video",
    };
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
