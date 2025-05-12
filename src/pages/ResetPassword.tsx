import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Invalid or expired reset link.");
        navigate("/login");
      } else {
        setSessionChecked(true);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! Please log in.");
      navigate("/login");
    }

    setIsLoading(false);
  };

  if (!sessionChecked) {
    return <div className="p-4">Validating link…</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} autoComplete="off">
            <CardContent className="space-y-4">
              <div className="space-y-2 relative">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <div
                  className="absolute top-9 right-3 cursor-pointer text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
