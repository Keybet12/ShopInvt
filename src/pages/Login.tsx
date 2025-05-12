// src/pages/Login.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message || "Login failed");
    } else {
      toast.success("Logged in successfully");
      navigate("/dashboard");
    }

    setIsLoading(false);
  };

  const goToSignup = () => {
    // Clear inputs
    setEmail("");
    setPassword("");
    setShowPassword(false);
    navigate("/signup");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            <Box className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">Alex Shop</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} autoComplete="off">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="login-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button
                     variant="link"
                     className="px-0 h-auto font-normal"
                     type="button"
                     onClick={() => {
                       // clear inputs
                       setEmail("");
                       setPassword("");
                       setShowPassword(false);
                       navigate("/forgot-password");
                     }}
                  >
                     Forgot password?
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Log In
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-4 text-center">
          <Button variant="link" onClick={goToSignup}>
            Don't have an account? Sign up
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
