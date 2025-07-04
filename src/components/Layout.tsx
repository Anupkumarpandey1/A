
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Menu, X, BookOpen, Award, GitBranch, UserCheck, GraduationCap, Sparkles } from "lucide-react";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

const navLinks = [
  {
    name: "Learning Hub",
    href: "/flashcards",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    name: "Quizzes",
    href: "/quizzes",
    icon: <Award className="w-5 h-5" />,
  },
  {
    name: "Flowcharts",
    href: "/flowcharts",
    icon: <GitBranch className="w-5 h-5" />,
  },
  {
    name: "Join Quiz",
    href: "/join",
    icon: <UserCheck className="w-5 h-5" />,
  },
];

const NavLink = ({
  href,
  icon,
  children,
  isActive,
  onClick,
}: NavLinkProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105",
        isActive
          ? "bg-gradient-to-r from-primary/80 to-accent/80 text-white shadow-md"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/20"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex md:hidden">
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent className="top-0 h-full mt-0 rounded-none">
                <div className="mx-auto w-full max-w-sm p-4">
                  <div className="flex items-center justify-between border-b mb-4 pb-4">
                    <Link to="/" className="flex items-center space-x-2">
                      <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">LearnFlow</span>
                    </Link>
                    <DrawerClose asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                        <X className="h-5 w-5" />
                        <span className="sr-only">Close navigation menu</span>
                      </Button>
                    </DrawerClose>
                  </div>
                  <Command className="border-none shadow-none">
                    <CommandList className="max-h-none">
                      <CommandGroup>
                        {navLinks.map((link) => (
                          <DrawerClose key={link.href} asChild>
                            <CommandItem
                              className="cursor-pointer rounded-lg mb-2 hover:bg-primary/10"
                              onSelect={() => {}}
                            >
                              <Link to={link.href} className="flex items-center w-full">
                                {link.icon}
                                <span className="ml-2">{link.name}</span>
                              </Link>
                            </CommandItem>
                          </DrawerClose>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <Link
            to="/"
            className="flex items-center justify-center font-semibold text-lg"
          >
            <GraduationCap className="mr-2 h-6 w-6 text-primary animate-pulse" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-bold">Barrack</span>
          </Link>
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                icon={link.icon}
                isActive={location.pathname === link.href}
              >
                {link.name}
              </NavLink>
            ))}
          </div>
          <div className="flex-1 md:hidden" />
          <div className="flex items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-background">
        {!mounted ? (
          <div className="min-h-[calc(100vh-56px)]"></div>
        ) : (
          <div className="animate-fade-in">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;
