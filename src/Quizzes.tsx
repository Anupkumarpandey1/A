
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Award, Loader2, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { generateQuiz, createQuizSession } from "@/services/api";
import { QuizQuestion } from "@/types/quizTypes";

const Quizzes = () => {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState<QuizQuestion>({
    id: '',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGenerateQuiz = async () => {
    if (!text.trim()) {
      toast({
        title: "Missing Text",
        description: "Please enter some text to generate a quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const generatedQuestions = await generateQuiz(text, numQuestions);
      setQuestions(generatedQuestions);
      toast({
        title: "Quiz Generated",
        description: "Your quiz questions have been generated!",
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your quiz.",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "Please generate quiz questions first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const quizSession = await createQuizSession(title, questions);
      navigate(`/host/${quizSession.id}`);
      toast({
        title: "Quiz Created",
        description: "Your quiz session has been created!",
      });
    } catch (error) {
      console.error("Error creating quiz session:", error);
      toast({
        title: "Error",
        description: "Failed to create quiz session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditQuestion = (question: QuizQuestion, index: number) => {
    setEditingQuestion({...question});
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditingIndex(null);
  };

  const handleSaveEdit = () => {
    if (!editingQuestion || editingIndex === null) return;
    
    // Validate the question
    if (!editingQuestion.question.trim()) {
      toast({
        title: "Invalid Question",
        description: "Question text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all options are filled
    if (editingQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Invalid Options",
        description: "All options must be filled.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure correct answer is set and is one of the options
    if (!editingQuestion.correctAnswer.trim() || !editingQuestion.options.includes(editingQuestion.correctAnswer)) {
      toast({
        title: "Invalid Correct Answer",
        description: "Correct answer must be one of the options.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedQuestions = [...questions];
    updatedQuestions[editingIndex] = editingQuestion;
    setQuestions(updatedQuestions);
    setEditingQuestion(null);
    setEditingIndex(null);
    
    toast({
      title: "Question Updated",
      description: "Question has been successfully updated.",
    });
  };

  const handleAddQuestion = () => {
    setShowAddQuestion(true);
    setNewQuestion({
      id: `custom-${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    });
  };

  const handleCancelAdd = () => {
    setShowAddQuestion(false);
  };

  const handleSaveNewQuestion = () => {
    // Validate the question
    if (!newQuestion.question.trim()) {
      toast({
        title: "Invalid Question",
        description: "Question text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate all options are filled
    if (newQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Invalid Options",
        description: "All options must be filled.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure correct answer is set and is one of the options
    if (!newQuestion.correctAnswer.trim() || !newQuestion.options.includes(newQuestion.correctAnswer)) {
      toast({
        title: "Invalid Correct Answer",
        description: "Correct answer must be one of the options.",
        variant: "destructive",
      });
      return;
    }
    
    setQuestions([...questions, newQuestion]);
    setShowAddQuestion(false);
    
    toast({
      title: "Question Added",
      description: "New question has been added to the quiz.",
    });
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions.splice(index, 1);
    setQuestions(updatedQuestions);
    
    toast({
      title: "Question Deleted",
      description: "Question has been removed from the quiz.",
    });
  };

  const handleUpdateOption = (index: number, value: string) => {
    if (!editingQuestion) return;
    
    const updatedOptions = [...editingQuestion.options];
    updatedOptions[index] = value;
    setEditingQuestion({...editingQuestion, options: updatedOptions});
  };

  const handleUpdateNewOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({...newQuestion, options: updatedOptions});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
          Create a Quiz
        </h1>
        <p className="text-muted-foreground">
          Generate a quiz from any text, customize it, and host it for others to join.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div>
          <Card className="p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
            <h2 className="text-xl font-semibold mb-4">
              1. Enter Your Content
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  placeholder="Enter quiz title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="quiz-text">Paste Your Text</Label>
                <Textarea
                  id="quiz-text"
                  placeholder="Enter text to generate quiz questions"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
              <div>
                <Label htmlFor="num-questions">Number of Questions</Label>
                <Input
                  id="num-questions"
                  type="number"
                  placeholder="Number of questions to generate"
                  value={numQuestions.toString()}
                  onChange={(e) =>
                    setNumQuestions(parseInt(e.target.value, 10) || 1)
                  }
                  min="1"
                  max="20"
                />
              </div>
              <Button
                onClick={handleGenerateQuiz}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Quiz"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Output Section */}
        <div>
          <Card className="p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                2. Review & Customize Questions
              </h2>
              {questions.length > 0 && !showAddQuestion && !editingQuestion && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleAddQuestion}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Question
                </Button>
              )}
            </div>
            
            {questions.length > 0 ? (
              <div className="space-y-4">
                {showAddQuestion ? (
                  <Card className="p-4 border-2 border-primary/30">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Add New Question</h3>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleCancelAdd}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="new-question">Question</Label>
                        <Input
                          id="new-question"
                          value={newQuestion.question}
                          onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                          placeholder="Enter your question"
                        />
                      </div>
                      
                      {newQuestion.options.map((option, idx) => (
                        <div key={idx}>
                          <Label htmlFor={`new-option-${idx}`}>Option {idx + 1}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id={`new-option-${idx}`}
                              value={option}
                              onChange={(e) => handleUpdateNewOption(idx, e.target.value)}
                              placeholder={`Option ${idx + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 px-2 ${option === newQuestion.correctAnswer ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : ''}`}
                              onClick={() => setNewQuestion({...newQuestion, correctAnswer: option})}
                            >
                              {option === newQuestion.correctAnswer ? 'Correct' : 'Set Correct'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={handleCancelAdd}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveNewQuestion}>
                          <Save className="h-4 w-4 mr-1" />
                          Save Question
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : null}
                
                {questions.map((question, index) => (
                  <div key={question.id} className={`border rounded-md p-4 ${editingIndex === index ? 'border-2 border-primary/30' : ''}`}>
                    {editingIndex === index && editingQuestion ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="font-semibold">Edit Question</h3>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={handleCancelEdit}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div>
                          <Label htmlFor="edit-question">Question</Label>
                          <Input
                            id="edit-question"
                            value={editingQuestion.question}
                            onChange={(e) => setEditingQuestion({...editingQuestion, question: e.target.value})}
                          />
                        </div>
                        
                        {editingQuestion.options.map((option, idx) => (
                          <div key={idx}>
                            <Label htmlFor={`edit-option-${idx}`}>Option {idx + 1}</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id={`edit-option-${idx}`}
                                value={option}
                                onChange={(e) => handleUpdateOption(idx, e.target.value)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 ${option === editingQuestion.correctAnswer ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : ''}`}
                                onClick={() => setEditingQuestion({...editingQuestion, correctAnswer: option})}
                              >
                                {option === editingQuestion.correctAnswer ? 'Correct' : 'Set Correct'}
                              </Button>
                            </div>
                          </div>
                        ))}
                        
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <h3 className="font-medium">
                            {index + 1}. {question.question}
                          </h3>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0" 
                              onClick={() => handleEditQuestion(question, index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" 
                              onClick={() => handleDeleteQuestion(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <ul className="list-disc pl-5 mt-2">
                          {question.options.map((option, optionIndex) => (
                            <li key={optionIndex} className={option === question.correctAnswer ? 'text-green-600 dark:text-green-400 font-medium' : ''}>
                              {option}
                              {option === question.correctAnswer && ' (Correct)'}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                ))}
                
                {!showAddQuestion && !editingQuestion && (
                  <Button
                    onClick={handleStartQuiz}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 mt-4"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      "Start Quiz"
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Award className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No quiz questions generated yet.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
