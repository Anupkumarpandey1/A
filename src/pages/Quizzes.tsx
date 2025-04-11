import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Award, Loader2 } from "lucide-react";

const Quizzes = () => {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
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
      // TODO: Implement quiz generation logic
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

    setIsLoading(true);
    try {
      // TODO: Implement quiz session creation logic
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="max-w-3xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-pink-500 dark:from-amber-400 dark:to-pink-400">
          Create a Quiz
        </h1>
        <p className="text-muted-foreground">
          Generate a quiz from any text and host it for others to join.
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
                    setNumQuestions(parseInt(e.target.value, 10))
                  }
                />
              </div>
              <Button
                onClick={handleGenerateQuiz}
                disabled={isLoading}
                className="w-full"
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
            <h2 className="text-xl font-semibold mb-4">2. Review Questions</h2>
            <div className="text-center py-8">
              <Award className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No quiz questions generated yet.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
