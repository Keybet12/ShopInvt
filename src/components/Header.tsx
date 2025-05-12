import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { Box, LogOut, UserRound, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { toast } from "sonner";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
    } else {
      toast.success("Logged out successfully");
      // Replace history entry to prevent back navigation
      navigate("/login", { replace: true });
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your account? This cannot be undone."
      )
    ) {
      return;
    }
    setDeleting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("Unable to verify user session.");
      setDeleting(false);
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      toast.error("No access token found.");
      setDeleting(false);
      return;
    }

    try {
      const { error: fnError } = await supabase.functions.invoke(
        "rapid-service",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );

      if (fnError) {
        throw fnError;
      }

      toast.success("Account deleted successfully.");
      await supabase.auth.signOut();
      // redirect to signup and replace history as well
      navigate("/signup", { replace: true });
    } catch (err: any) {
      toast.error(`Account deletion failed: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b bg-background shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Box className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Alex Shop</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full p-0 h-8 w-8"
                aria-label="User menu"
              >
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <UserRound className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate("/profile")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteAccount}
                className="flex items-center text-destructive"
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {deleting ? "Deleting..." : "Delete Account"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
