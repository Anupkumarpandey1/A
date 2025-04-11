
import { FlashcardItem, FlowchartData, LearningItem } from "@/types/quizTypes";

// Storage keys
const LEARNING_ITEMS_KEY = 'learnflow_learning_items';

// Save a learning item to local storage
export const saveLearningItem = (item: LearningItem): void => {
  try {
    // Get existing items
    const existingItems = getLearningItems();
    
    // Add the new item
    const updatedItems = [item, ...existingItems];
    
    // Save to localStorage
    localStorage.setItem(LEARNING_ITEMS_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error saving learning item:', error);
  }
};

// Get all learning items from local storage
export const getLearningItems = (): LearningItem[] => {
  try {
    const items = localStorage.getItem(LEARNING_ITEMS_KEY);
    return items ? JSON.parse(items) : [];
  } catch (error) {
    console.error('Error fetching learning items:', error);
    return [];
  }
};

// Get a specific learning item by ID
export const getLearningItemById = (id: string): LearningItem | null => {
  try {
    const items = getLearningItems();
    const item = items.find(item => item.id === id);
    return item || null;
  } catch (error) {
    console.error('Error fetching learning item:', error);
    return null;
  }
};

// Delete a learning item
export const deleteLearningItem = (id: string): void => {
  try {
    const items = getLearningItems();
    const updatedItems = items.filter(item => item.id !== id);
    localStorage.setItem(LEARNING_ITEMS_KEY, JSON.stringify(updatedItems));
  } catch (error) {
    console.error('Error deleting learning item:', error);
  }
};

// Create a new learning item with both flashcards and flowchart
export const createUnifiedLearningItem = (
  title: string,
  content: string,
  flashcards: FlashcardItem[],
  flowchart: FlowchartData,
  keyPoints: string[],
  notes: string[]
): LearningItem => {
  return {
    id: `learning-${Date.now()}`,
    title,
    content,
    flashcards,
    flowchart,
    keyPoints,
    notes,
    createdAt: new Date()
  };
};

// Format and transform share links from lovable.com to learnflow.com
export const formatShareLink = (path: string): string => {
  const baseUrl = 'https://learnflow.com';
  
  // Remove any existing domain if present
  let cleanPath = path.replace(/^(https?:\/\/)?([^\/]+)/, '');
  
  // Ensure path starts with a slash
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  return `${baseUrl}${cleanPath}`;
};

// Create a shareable link for a quiz
export const createQuizShareLink = (quizId: string): string => {
  return formatShareLink(`/quiz/${quizId}`);
};

// Create a shareable link for a learning item
export const createLearningItemShareLink = (itemId: string): string => {
  return formatShareLink(`/learn/${itemId}`);
};
