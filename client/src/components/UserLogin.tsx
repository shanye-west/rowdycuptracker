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
  const [pin, setPin] = useState(""); // Changed from password to pin for clarity
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Local loading state for form submission
  const { login, loading: authLoading } = useAuth(); // Use authLoading for global auth state
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!username.trim() || !pin.trim()) {
      setError("Please enter both username and PIN.");
      return;
    }
    // Updated to 6-digit PIN validation
    if (pin.trim().length !== 6 || !/^\d{6}$/.test(pin.trim())) {
      setError("PIN must be 6 digits.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await login(username, pin);

      if (result.success && result.user) {
        toast({ title: "Login Successful", description: `Welcome, ${result.user.username}!` });
        setIsOpen(false);
        setUsername("");
        setPin("");
        
        if (result.user.role === 'admin') {
          setLocation("/admin");
        } else {
          // Optional: Redirect non-admin users to a default page or refresh current
          // setLocation("/"); 
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
      setIsSubmitting(false);
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
      setPin("");
      setError("");
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <DropdownMenuItem
      className="cursor-pointer hover:bg-gray-800 text-white data-[highlighted]:bg-gray-700 data-[highlighted]:text-white"
      onSelect={(e) => e.preventDefault()}
      disabled={authLoading} // Disable if auth is already processing
    >
      <LogIn className="mr-2 h-4 w-4" />
      <span>{authLoading ? "Loading..." : "Login"}</span>
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
              disabled={isSubmitting || authLoading}
            />
          </div>
          <div>
            <Label htmlFor="login-pin" className="text-gray-300">6-Digit PIN</Label>
            <Input
              id="login-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your 6-digit PIN"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-500"
              maxLength={6}
              disabled={isSubmitting || authLoading}
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isSubmitting || authLoading}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleLogin}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isSubmitting || authLoading}
            >
              {isSubmitting || authLoading ? "Logging in..." : "Login"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}