import React from "react";
import { Navbar } from "./Navbar";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <Navbar />
      <main className="container mx-auto px-4 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
