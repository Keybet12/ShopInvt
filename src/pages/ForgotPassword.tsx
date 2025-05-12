import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
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

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectUrl =
       import.meta.env.DEV
       ? "http://192.168.100.10:8080/reset-password"
       : `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(
        "If that email is in our system, you’ll receive a reset link shortly."
      );
      setTimeout(() => navigate("/login"), 3000);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email to receive a reset link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleReset} autoComplete="off">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  "Sending..."
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" /> Send Reset Link
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <div className="text-center">
          <Button variant="link" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
