
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import LearningHub from "./pages/LearningHub";
import Quizzes from "./pages/Quizzes";
import Flowcharts from "./pages/Flowcharts";
import YouTubeFlowchart from "./pages/YouTubeFlowchart";
import JoinQuiz from "./pages/JoinQuiz";
import HostQuiz from "./pages/HostQuiz";
import PlayQuiz from "./pages/PlayQuiz";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="theme-preference">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/flashcards" element={<LearningHub />} />
                <Route path="/quizzes" element={<Quizzes />} />
                <Route path="/flowcharts" element={<Flowcharts />} />
                <Route path="/youtube-tools" element={<YouTubeFlowchart />} />
                <Route path="/join" element={<JoinQuiz />} />
                <Route path="/join/:sessionId" element={<JoinQuiz />} />
                <Route path="/host/:sessionId" element={<HostQuiz />} />
                <Route path="/play/:sessionId" element={<PlayQuiz />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
