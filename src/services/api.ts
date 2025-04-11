
// API keys (in production these should be secured in environment variables or server-side)
export const GEMINI_API_KEY = "AIzaSyB7RRqKHgGHD2AGPp2mht81ZTbeO--Nb2M";
export const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
export const RAPID_API_KEY = "88e9d73b57msh9982c178daafdb7p1d1688jsn6d4186f6ca5a";

import { supabase } from '@/integrations/supabase/client';
import { 
  FlashcardItem, 
  NotesItem, 
  QuizQuestion, 
  QuizSession, 
  Participant 
} from '@/types/quizTypes';

// Function to generate quiz questions from text
export const generateQuiz = async (text: string, numQuestions: number = 5): Promise<QuizQuestion[]> => {
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
                text: `Generate ${numQuestions} multiple-choice quiz questions based on the following content. 
                Format your response as a JSON array of objects, where each object has these properties:
                - "id": a unique string identifier
                - "question": the question text
                - "options": an array of 4 possible answer choices
                - "correctAnswer": the correct answer (must be one of the options)
                
                Keep questions clear and focused. Content: ${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate quiz questions");
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response text
    const jsonStart = generatedText.indexOf('[');
    const jsonEnd = generatedText.lastIndexOf(']') + 1;
    const jsonStr = generatedText.substring(jsonStart, jsonEnd);
    
    let questions = JSON.parse(jsonStr);
    
    // Ensure all questions have IDs
    questions = questions.map((question: any, index: number) => ({
      ...question,
      id: question.id || `question-${Date.now()}-${index}`,
    }));
    
    return questions;
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw error;
  }
};

// Function to generate flashcards from text
export const generateFlashcards = async (text: string): Promise<FlashcardItem[]> => {
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
                text: `Generate 5-10 flashcards based on the following content. Extract the most important concepts and key points. Format your response as a JSON array of objects with "question" and "answer" keys. Keep questions focused and concise. Keep answers brief but comprehensive. Text: ${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate flashcards");
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response text
    const jsonStart = generatedText.indexOf('[');
    const jsonEnd = generatedText.lastIndexOf(']') + 1;
    const jsonStr = generatedText.substring(jsonStart, jsonEnd);
    
    const flashcards = JSON.parse(jsonStr);
    
    // Add unique IDs to each flashcard
    return flashcards.map((card: any, index: number) => ({
      id: `card-${Date.now()}-${index}`,
      question: card.question,
      answer: card.answer,
    }));
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw error;
  }
};

// Function to generate study notes from text
export const generateNotes = async (text: string): Promise<NotesItem[]> => {
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
                text: `Create concise summary notes based on the following content. Format your response as a JSON array of objects with "title" and "content" keys. Break down the content into 3-5 main topics or concepts. Each note should be brief but informative. Extract key points and main ideas that would be useful for studying. Text: ${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate notes");
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response text
    const jsonStart = generatedText.indexOf('[');
    const jsonEnd = generatedText.lastIndexOf(']') + 1;
    const jsonStr = generatedText.substring(jsonStart, jsonEnd);
    
    const notes = JSON.parse(jsonStr);
    
    // Add unique IDs to each note
    return notes.map((note: any, index: number) => ({
      id: `note-${Date.now()}-${index}`,
      title: note.title,
      content: note.content,
    }));
  } catch (error) {
    console.error("Error generating notes:", error);
    throw error;
  }
};

// Function to generate keywords/key points from text for use in flashcards and flowcharts
export const generateKeyPoints = async (text: string): Promise<string[]> => {
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
                text: `Extract 5-8 key points from the following content. These key points should be the most important concepts that would be good for creating flashcards and flowcharts. Format your response as a JSON array of strings. Each point should be concise but informative. Text: ${text}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate key points");
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON from the response text
    const jsonStart = generatedText.indexOf('[');
    const jsonEnd = generatedText.lastIndexOf(']') + 1;
    const jsonStr = generatedText.substring(jsonStart, jsonEnd);
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating key points:", error);
    return [];
  }
};

// Create a new quiz session
export const createQuizSession = async (title: string, questions: QuizQuestion[]): Promise<QuizSession> => {
  const sessionId = `quiz-${Date.now()}`;
  
  const session: QuizSession = {
    id: sessionId,
    title,
    questions,
    participants: [],
    createdAt: new Date(),
  };
  
  // Store in Supabase
  try {
    const { error } = await supabase
      .from('quizzes')
      .insert({
        id: sessionId,
        title: session.title,
        questions: JSON.stringify(session.questions),
        created_at: session.createdAt.toISOString()
      });
      
    if (error) {
      console.error('Error saving quiz to Supabase:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to store quiz in Supabase:', error);
    throw error;
  }
  
  return session;
};

// Get a quiz session by ID
export const getQuizSession = async (id: string): Promise<QuizSession | undefined> => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching quiz from Supabase:', error);
      return undefined;
    }
    
    if (data) {
      return {
        id: data.id,
        title: data.title,
        questions: JSON.parse(data.questions as string),
        participants: await getParticipants(data.id),
        createdAt: new Date(data.created_at as string)
      };
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to fetch quiz from Supabase:', error);
    return undefined;
  }
};

// Get participants for a quiz
const getParticipants = async (quizId: string): Promise<Participant[]> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_id', quizId);
      
    if (error) {
      console.error('Error fetching participants from Supabase:', error);
      return [];
    }
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
      answers: p.answers ? p.answers as Record<string, string> : {}
    }));
  } catch (error) {
    console.error('Failed to fetch participants from Supabase:', error);
    return [];
  }
};

// Add a participant to a quiz session
export const addParticipant = async (quizId: string, name: string): Promise<Participant | null> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .insert({
        quiz_id: quizId,
        name: name,
        score: 0,
        answers: {}
      })
      .select()
      .single();
      
    if (error) {
      console.error('Error adding participant to Supabase:', error);
      return null;
    }
    
    if (data) {
      return {
        id: data.id,
        name: data.name,
        score: data.score || 0,
        answers: data.answers ? data.answers as Record<string, string> : {}
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error adding participant:', error);
    return null;
  }
};

// Submit an answer for a participant
export const submitAnswer = async (
  quizId: string, 
  participantId: string, 
  questionId: string, 
  answer: string
): Promise<boolean> => {
  try {
    // Get the current participant
    const { data: participant, error: fetchError } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();
      
    if (fetchError || !participant) {
      console.error('Error fetching participant:', fetchError);
      return false;
    }
    
    // Get the quiz to check the correct answer
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('questions')
      .eq('id', quizId)
      .single();
      
    if (quizError || !quiz) {
      console.error('Error fetching quiz:', quizError);
      return false;
    }
    
    // Find the question and check if the answer is correct
    const questions = JSON.parse(quiz.questions as string) as QuizQuestion[];
    const question = questions.find((q) => q.id === questionId);
    if (!question) {
      console.error('Question not found');
      return false;
    }
    
    // Update participant's answers
    const answers = participant.answers ? { ...(participant.answers as Record<string, string>) } : {};
    answers[questionId] = answer;
    
    // Calculate new score
    let score = participant.score || 0;
    if (answer === question.correctAnswer) {
      score += 1;
    }
    
    // Update the participant
    const { error: updateError } = await supabase
      .from('participants')
      .update({
        answers: answers,
        score: score
      })
      .eq('id', participantId);
      
    if (updateError) {
      console.error('Error updating participant:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting answer:', error);
    return false;
  }
};

// Get leaderboard for a session
export const getLeaderboard = async (quizId: string): Promise<Participant[]> => {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('score', { ascending: false });
      
    if (error) {
      console.error('Error fetching leaderboard from Supabase:', error);
      return [];
    }
    
    return data.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score || 0,
      answers: p.answers ? p.answers as Record<string, string> : {}
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};
