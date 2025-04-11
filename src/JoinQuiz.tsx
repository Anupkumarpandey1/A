
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Award, AlertCircle, Loader2 } from "lucide-react";
import { getQuizSession } from "@/services/api";

const JoinQuiz = () => {
  const { sessionId: urlSessionId } = useParams<{ sessionId: string }>();
  const [sessionId, setSessionId] = useState(urlSessionId || "");
  const [playerName, setPlayerName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [error, setError] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Load player name from local storage if available
  useEffect(() => {
    const savedName = localStorage.getItem("quizPlayerName");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Check if sessionId from URL exists
  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId);
      validateQuizSession(urlSessionId);
    }
  }, [urlSessionId]);

  const validateQuizSession = async (id: string) => {
    setIsValidating(true);
    setError("");
    
    try {
      const quizSession = await getQuizSession(id);
      if (quizSession) {
        setQuizTitle(quizSession.title);
      } else {
        setError("Quiz not found. Please check the session ID and try again.");
      }
    } catch (error) {
      console.error("Error validating quiz:", error);
      setError("Failed to validate quiz. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoinQuiz = async () => {
    if (!sessionId.trim() || !playerName.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both quiz code and your name.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Store player name in local storage
      localStorage.setItem("quizPlayerName", playerName);
      
      // Navigate to the play page
      navigate(`/play/${sessionId}`, { state: { playerName } });
    } catch (error) {
      console.error("Error joining quiz:", error);
      toast({
        title: "Join failed",
        description: "There was an error joining the quiz. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="max-w-md mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-pink-500 dark:from-amber-400 dark:to-pink-400">Join a Quiz</h1>
        <p className="text-muted-foreground">
          Enter a quiz code to join an existing quiz.
        </p>
      </div>
      
      <Card className="max-w-md mx-auto p-6 border-primary/20 shadow-lg hover:shadow-primary/5 transition-all">
        <div className="text-center mb-6">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          
          {quizTitle && (
            <div className="mb-4">
              <h2 className="text-xl font-bold">{quizTitle}</h2>
              <p className="text-sm text-muted-foreground">Ready to join this quiz?</p>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="session-id">Quiz Code</Label>
            <Input
              id="session-id"
              placeholder="Enter quiz code"
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setQuizTitle("");
                setError("");
              }}
              onBlur={() => sessionId.trim() && validateQuizSession(sessionId)}
              disabled={isValidating || Boolean(urlSessionId)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter the quiz code shared by the quiz creator
            </p>
          </div>
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-3 flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div>
            <Label htmlFor="player-name">Your Name</Label>
            <Input
              id="player-name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={!quizTitle && sessionId.trim().length > 0 && isValidating}
            />
            <p className="text-xs text-muted-foreground mt-1">
              This is how you'll appear on the leaderboard
            </p>
          </div>
          
          <Button 
            onClick={handleJoinQuiz} 
            disabled={isLoading || isValidating || !playerName.trim() || !sessionId.trim() || (!quizTitle && sessionId.trim().length > 0)}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Quiz"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default JoinQuiz;
