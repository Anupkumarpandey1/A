
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  BookOpen, 
  UserRound, 
  Award,
  ChevronDown,
  Home,
  GitBranch,
  GraduationCap
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: "Home", path: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "Learning Hub", path: "/learning-hub", icon: <GraduationCap className="h-4 w-4 mr-2" /> },
    { name: "Flashcards", path: "/flashcards", icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { name: "Flowcharts", path: "/flowcharts", icon: <GitBranch className="h-4 w-4 mr-2" /> },
    { name: "Quizzes", path: "/quizzes", icon: <Award className="h-4 w-4 mr-2" /> },
    { name: "Join Quiz", path: "/join", icon: <UserRound className="h-4 w-4 mr-2" /> },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={`bg-gradient-to-r from-purple-700 to-indigo-900 text-white sticky top-0 z-50 ${scrolled ? "shadow-md" : ""}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <GraduationCap className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white hidden sm:block">LearnFlow</span>
              </Link>
            </div>
            
            {/* Desktop Navigation - Items */}
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    location.pathname === item.path
                      ? "bg-white/20 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
            </div>
            
            {/* Tablet Navigation - Dropdown for some items */}
            <div className="hidden sm:flex md:hidden ml-6">
              <Link
                to="/"
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === "/"
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-3 py-2 h-auto text-white hover:bg-white/10">
                    <span className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Tools
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/learning-hub" className="flex items-center cursor-pointer">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Learning Hub
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/flashcards" className="flex items-center cursor-pointer">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Flashcards
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/flowcharts" className="flex items-center cursor-pointer">
                      <GitBranch className="h-4 w-4 mr-2" />
                      Flowcharts
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-3 py-2 h-auto text-white hover:bg-white/10">
                    <span className="flex items-center">
                      <Award className="h-4 w-4 mr-2" />
                      Quizzes
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/quizzes" className="flex items-center cursor-pointer">
                      <Award className="h-4 w-4 mr-2" />
                      All Quizzes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/join" className="flex items-center cursor-pointer">
                      <UserRound className="h-4 w-4 mr-2" />
                      Join Quiz
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Right side - Sign in button on desktop */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button size="sm" className="bg-white text-indigo-700 hover:bg-white/90">Sign In</Button>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-expanded="false"
              className="flex text-white hover:bg-white/10"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden animate-in slide-in-from-top duration-300 backdrop-blur-sm bg-indigo-900/90">
          <div className="pt-2 pb-3 space-y-1 max-h-[70vh] overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-base font-medium ${
                  location.pathname === item.path
                    ? "bg-white/20 text-white border-l-4 border-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="mr-3 rounded-full bg-white/10 p-2">
                  {item.icon}
                </div>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-white/20">
            <div className="px-4 py-2">
              <Button className="w-full bg-white text-indigo-700 hover:bg-white/90">Sign In</Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
