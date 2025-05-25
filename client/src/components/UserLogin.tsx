import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { LogIn } from "lucide-react";

interface UserLoginProps {
  trigger?: React.ReactNode;
}

export default function UserLogin({ trigger }: UserLoginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      
      if (result.success) {
        setIsOpen(false);
        setUsername("");
        setPassword("");
        
        // Redirect admin users to admin page, regular users stay on current page
        if (result.user?.role === 'admin') {
          setLocation("/admin");
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      setError("An unexpected error occurred");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when dialog closes
      setUsername("");
      setPassword("");
      setError("");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || (
          <DropdownMenuItem className="cursor-pointer hover:bg-gray-800" onSelect={(e) => e.preventDefault()}>
            <LogIn className="mr-2 h-4 w-4" />
            <span>Login</span>
          </DropdownMenuItem>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center">Login</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              className="bg-gray-800 border-gray-600 text-white"
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              className="bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              className="bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
