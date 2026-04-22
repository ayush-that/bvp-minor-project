import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Button } from "../ui/button";
import { LogOut, User } from "lucide-react";
import { MOCK_USER } from "@/utils/mockUser";

export function AppShell() {
  // Using mock user for development
  const user = MOCK_USER;
  const logout = () => {
    console.log("Mock logout - no action taken");
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="h-16 border-b px-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome back, {user?.name || "Guest"}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground">
              <User className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
