
// Application-specific type definitions for the quiz functionality

export interface FlashcardItem {
  id: string;
  question: string;
  answer: string;
}

export interface NotesItem {
  id: string;
  title: string;
  content: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizSession {
  id: string;
  title: string;
  questions: QuizQuestion[];
  participants: Participant[];
  createdAt: Date;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  answers: Record<string, string>;
}

export interface FlowchartData {
  id: string;
  title: string;
  mermaidCode: string;
  content: string;
  createdAt: Date;
}

export interface LearningItem {
  id: string;
  title: string;
  content: string;
  flashcards?: FlashcardItem[];
  flowchart?: FlowchartData;
  keyPoints?: string[];
  notes?: string[];
  createdAt: Date;
}
