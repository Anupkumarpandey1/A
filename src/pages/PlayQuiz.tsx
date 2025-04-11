import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Medal, Award, Clock, User, ArrowLeft, AlertCircle } from "lucide-react";
import { getQuizSession, addParticipant, submitAnswer } from "@/services/api";
import { QuizQuestion } from "@/types/quizTypes";
import { getLeaderboard } from '@/services/api';

const PlayQuiz = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const [playerName, setPlayerName] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [participantId, setParticipantId] = useState("");
  const [quizData, setQuizData] = useState<{
    id: string;
    title: string;
    questions: QuizQuestion[];
  } | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{ id: string; name: string; score: number; }[]>([]);
  const [playerRank, setPlayerRank] = useState(0);
  const [quizError, setQuizError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const savedName = localStorage.getItem("quizPlayerName") || "";
    const locationName = location.state?.playerName || "";
    setPlayerName(locationName || savedName);
  }, [location]);

  useEffect(() => {
    if (!sessionId) {
      setQuizError("Quiz ID is missing. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const quizSession = await getQuizSession(sessionId);
        if (quizSession) {
          setQuizData({
            id: quizSession.id,
            title: quizSession.title,
            questions: quizSession.questions,
          });
          setIsLoading(false);
        } else {
          setQuizError("Quiz not found. The quiz session could not be found.");
          setIsLoading(false);
          toast({
            title: "Quiz not found",
            description: "The quiz session could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        setQuizError("Error loading quiz. There was a problem loading the quiz.");
        setIsLoading(false);
        toast({
          title: "Error loading quiz",
          description: "There was a problem loading the quiz.",
          variant: "destructive",
        });
      }
    };

    fetchQuiz();
  }, [sessionId, toast]);

  const handleJoinQuiz = async () => {
    if (!playerName.trim() || !quizData) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the quiz.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const participant = await addParticipant(quizData.id, playerName);
      if (participant) {
        setIsJoined(true);
        setParticipantId(participant.id);
        
        localStorage.setItem("quizPlayerName", playerName);
        
        toast({
          title: "Joined quiz",
          description: `Welcome to ${quizData.title}, ${playerName}!`,
        });
      } else {
        throw new Error("Failed to join quiz");
      }
    } catch (error) {
      console.error("Error joining quiz:", error);
      toast({
        title: "Failed to join",
        description: "There was an error joining the quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !quizData || !participantId) return;
    
    const currentQuestion = quizData.questions[currentQuestionIndex];
    setIsSubmitting(true);
    
    try {
      await submitAnswer(quizData.id, participantId, currentQuestion.id, selectedOption);
      
      const newAnsweredQuestions = {...answeredQuestions};
      newAnsweredQuestions[currentQuestion.id] = selectedOption;
      setAnsweredQuestions(newAnsweredQuestions);
      
      if (selectedOption === currentQuestion.correctAnswer) {
        setScore(prev => prev + 1);
        toast({
          title: "Correct!",
          description: "You got the right answer!",
        });
      } else {
        toast({
          title: "Incorrect",
          description: `The correct answer was: ${currentQuestion.correctAnswer}`,
        });
      }
      
      if (currentQuestionIndex < quizData.questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setSelectedOption("");
      } else {
        await fetchLeaderboard();
        setIsQuizCompleted(true);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!quizData) return;
    
    try {
      const leaderboardData = await getLeaderboard(quizData.id);
      setLeaderboard(leaderboardData);
      
      const playerIndex = leaderboardData.findIndex(p => p.id === participantId);
      setPlayerRank(playerIndex !== -1 ? playerIndex + 1 : 0);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  useEffect(() => {
    if (isQuizCompleted && quizData) {
      const interval = setInterval(fetchLeaderboard, 3000);
      return () => clearInterval(interval);
    }
  }, [isQuizCompleted, quizData]);

  const currentQuestion = quizData?.questions[currentQuestionIndex];
  const progress = quizData?.questions.length 
    ? ((currentQuestionIndex + 1) / quizData.questions.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="text-center py-16">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Loading Quiz...</h2>
          <p className="text-muted-foreground mb-8">
            Please wait while we load the quiz session.
          </p>
        </div>
      </div>
    );
  }

  if (quizError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Card className="max-w-md mx-auto p-6 border-destructive/20">
          <div className="text-center mb-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Error</h2>
            <p className="text-muted-foreground">
              {quizError}
            </p>
          </div>
          
          <Button onClick={() => navigate("/join")} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Join Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {!isJoined ? (
        <Card className="max-w-md mx-auto p-6">
          <div className="text-center mb-6">
            <User className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Join Quiz</h2>
            <p className="text-muted-foreground">Enter your name to join the quiz.</p>
            {quizData && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">{quizData.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {quizData.questions.length} questions
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="player-name">Your Name</Label>
              <Input
                id="player-name"
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mb-4"
              />
              <p className="text-xs text-muted-foreground">
                This is how you'll appear on the leaderboard
              </p>
            </div>
            
            <Button 
              onClick={handleJoinQuiz} 
              disabled={!playerName.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Joining..." : "Join Quiz"}
            </Button>
          </div>
        </Card>
      ) : isQuizCompleted ? (
        <Card className="max-w-md mx-auto p-6">
          <div className="text-center">
            {playerRank <= 3 ? (
              <Medal className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            ) : (
              <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            )}
            
            <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-4">
              Your Score: {score} / {quizData?.questions.length}
            </p>
            
            {leaderboard.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
                <div className="space-y-2 max-w-xs mx-auto mb-4">
                  {leaderboard.slice(0, 10).map((player, index) => (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-2 rounded-md ${player.id === participantId ? 'bg-primary/10 font-semibold' : ''}`}
                    >
                      <div className="flex items-center">
                        <span className={`h-6 w-6 flex items-center justify-center rounded-full mr-2 text-xs
                          ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 
                            index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' : 
                            index === 2 ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : 'bg-muted text-muted-foreground'}`}
                        >
                          {index + 1}
                        </span>
                        <span>{player.name}</span>
                      </div>
                      <span>{player.score}</span>
                    </div>
                  ))}
                </div>
                
                {playerRank > 0 && (
                  <p className="text-muted-foreground">
                    Your Rank: {playerRank} / {leaderboard.length}
                  </p>
                )}
              </>
            )}
            
            <div className="mt-6 space-y-2">
              <Button onClick={() => navigate("/quizzes")} className="w-full">
                Create a New Quiz
              </Button>
              <Button variant="outline" onClick={() => navigate("/join")} className="w-full">
                Join Another Quiz
              </Button>
            </div>
          </div>
        </Card>
      ) : quizData && currentQuestion ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{quizData.title}</h1>
                <span className="text-muted-foreground">
                  Question {currentQuestionIndex + 1} / {quizData.questions.length}
                </span>
              </div>
              
              <Progress value={progress} className="mb-8" />
              
              <div className="space-y-6">
                <div className="bg-card border rounded-lg p-6 shadow-sm">
                  <div className="flex items-start mb-4">
                    <span className="bg-primary/10 text-primary font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3 flex-shrink-0">
                      {currentQuestionIndex + 1}
                    </span>
                    <h3 className="text-xl font-medium">{currentQuestion.question}</h3>
                  </div>
                  
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="pl-9 space-y-3 mt-6">
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 rounded-md border border-transparent hover:bg-muted/50 hover:border-primary/10 transition-all">
                        <RadioGroupItem value={option} id={`option-${index}`} className="shrink-0" />
                        <Label htmlFor={`option-${index}`} className="flex-grow cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                
                <Button 
                  onClick={handleSubmitAnswer} 
                  disabled={!selectedOption || isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Answer"
                  )}
                </Button>
              </div>
            </Card>
          </div>
          
          <div>
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quiz Progress</h2>
              
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Player:</span>
                    <span className="text-sm font-semibold">{playerName}</span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Current Score:</span>
                    <span className="text-sm font-semibold">{score} / {currentQuestionIndex}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Questions:</span>
                    <span className="text-sm">{currentQuestionIndex + 1} of {quizData.questions.length}</span>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
                  <h3 className="text-sm font-medium mb-2">Your Progress</h3>
                  <Progress value={(currentQuestionIndex / quizData.questions.length) * 100} className="mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {quizData.questions.length - currentQuestionIndex - 1} questions remaining
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Quiz Error</h2>
          <p className="text-muted-foreground mb-8">
            There was a problem loading the quiz questions.
          </p>
          <Button onClick={() => navigate("/join")}>
            Back to Join Page
          </Button>
        </div>
      )}
    </div>
  );
};

export default PlayQuiz;
