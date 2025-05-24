import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useAdminAuth } from "@/lib/admin-auth";
import { LogIn } from "lucide-react";

interface AdminLoginProps {
  trigger?: React.ReactNode;
}

export default function AdminLogin({ trigger }: AdminLoginProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAdminAuth();

  const handleLogin = () => {
    setError("");
    if (login(password)) {
      setIsOpen(false);
      setPassword("");
      // Redirect to admin tournament home
      window.location.href = "/admin";
    } else {
      setError("Invalid password");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <DropdownMenuItem className="cursor-pointer hover:bg-gray-800" onSelect={(e) => e.preventDefault()}>
            <LogIn className="mr-2 h-4 w-4" />
            <span>Admin Login</span>
          </DropdownMenuItem>
        )}
      </DialogTrigger>
      <DialogContent className="bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-center">Admin Login</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter admin password"
              className="bg-gray-800 border-gray-600 text-white"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogin}
              className="bg-green-600 hover:bg-green-700"
            >
              Login
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
