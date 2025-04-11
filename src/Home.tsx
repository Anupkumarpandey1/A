
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Award, Users, BrainCircuit } from "lucide-react";

const FeatureCard = ({ icon, title, description, linkTo }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  linkTo: string
}) => (
  <div className="bg-card rounded-lg border shadow-sm p-6 transition-all hover:shadow-md">
    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    <Link to={linkTo}>
      <Button variant="outline" className="w-full">Try Now</Button>
    </Link>
  </div>
);

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              AI-Powered Learning & 
              <span className="text-primary"> Interactive Quizzes</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Generate flashcards, study notes, and multiplayer quizzes instantly from any content.
              Learn faster, collaborate in real-time, and make studying fun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/flashcards">
                <Button size="lg" className="w-full sm:w-auto">Create Flashcards</Button>
              </Link>
              <Link to="/quizzes">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Generate Quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Key Features</h2>
            <p className="text-muted-foreground mt-2">
              Everything you need to enhance your learning experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<BookOpen className="h-6 w-6 text-primary" />}
              title="AI Flashcards & Notes"
              description="Generate concise flashcards and study notes from text, documents, or videos."
              linkTo="/flashcards"
            />
            <FeatureCard
              icon={<Award className="h-6 w-6 text-primary" />}
              title="Interactive Quizzes"
              description="Create engaging quizzes instantly from your learning materials."
              linkTo="/quizzes"
            />
            <FeatureCard
              icon={<Users className="h-6 w-6 text-primary" />}
              title="Multiplayer Learning"
              description="Share quizzes with friends and compete on the leaderboard."
              linkTo="/join"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">
              Simple steps to enhance your learning experience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Input Your Content</h3>
              <p className="text-muted-foreground">
                Enter text, upload documents, or paste a YouTube URL
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Generate Learning Materials</h3>
              <p className="text-muted-foreground">
                Create flashcards, study notes, or interactive quizzes
              </p>
            </div>
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Learn & Collaborate</h3>
              <p className="text-muted-foreground">
                Study alone or invite friends to join your quiz sessions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BrainCircuit className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">Ready to supercharge your learning?</h2>
          <p className="text-muted-foreground mb-8">
            Start generating flashcards, notes, and interactive quizzes today.
          </p>
          <Link to="/flashcards">
            <Button size="lg">Get Started Now</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
