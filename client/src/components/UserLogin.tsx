// client/src/components/UserLogin.tsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserLoginProps {
  trigger?: React.ReactNode;
}

export default function UserLogin({ trigger }: UserLoginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // This will be the PIN
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Local loading state for form submission
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and PIN.");
      return;
    }
    if (password.trim().length !== 4 || !/^\d{4}$/.test(password.trim())) {
      setError("PIN must be 4 digits.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password); // Calls the Supabase login

      if (result.success && result.user) {
        toast({ title: "Login Successful", description: `Welcome, ${result.user.username}!` });
        setIsOpen(false);
        setUsername("");
        setPassword("");
        
        if (result.user.role === 'admin') {
          setLocation("/admin");
        } else {
          // setLocation("/"); // Or to a player dashboard if you have one
        }
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
        toast({ title: "Login Failed", description: result.error || "Invalid username or PIN.", variant: "destructive" });
      }
    } catch (err: any) {
      setError("An unexpected error occurred during login.");
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
      console.error("Login component error:", err);
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
      setUsername("");
      setPassword("");
      setError("");
      setIsLoading(false);
    }
  };

  const defaultTrigger = (
    <DropdownMenuItem 
      className="cursor-pointer hover:bg-gray-800 text-white data-[highlighted]:bg-gray-700 data-[highlighted]:text-white" // Adjusted for better visibility in dark dropdown
      onSelect={(e) => e.preventDefault()} // Prevent DDM from closing
    >
      <LogIn className="mr-2 h-4 w-4" />
      <span>Login</span>
    </DropdownMenuItem>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-white">User Login</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="login-username" className="text-gray-300">Username</Label>
            <Input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="login-pin" className="text-gray-300">4-Digit PIN</Label>
            <Input
              id="login-pin"
              type="password" // Use password type to mask PIN
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your 4-digit PIN"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              maxLength={4}
              disabled={isLoading}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleLogin}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}