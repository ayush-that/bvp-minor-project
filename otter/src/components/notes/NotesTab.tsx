import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, StickyNote, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/utils/supabase";
import { MOCK_USER } from "@/utils/mockUser";

export function NotesTab() {
  // Using mock user for development
  const user = MOCK_USER;
  const isAuthenticated = true;

  // get initial state from localStorage
  const getInitialState = useCallback(() => {
    if (!isAuthenticated || !user?.id)
      return { isExpanded: false, isMinimized: false, isClosed: false };

    const saved = localStorage.getItem(`notes-state-${user.id}`);
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // migrate old minimized state to collapsed state
        if (state.isMinimized) {
          return { isExpanded: false, isMinimized: false, isClosed: false };
        }
        return state;
      } catch {
        return { isExpanded: false, isMinimized: false, isClosed: false };
      }
    }
    return { isExpanded: false, isMinimized: false, isClosed: false };
  }, [isAuthenticated, user?.id]);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // no longer used, but keeping for state compatibility
  const [isClosed, setIsClosed] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // auto-save delay in ms
  const AUTOSAVE_DELAY = 1000;

  // initialize state from localStorage
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const initialState = getInitialState();
      setIsExpanded(initialState.isExpanded);
      setIsMinimized(initialState.isMinimized);
      setIsClosed(initialState.isClosed);
      loadUserNote();
    }
  }, [isAuthenticated, user?.id, getInitialState]);

  // save state to localStorage whenever it changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const state = { isExpanded, isMinimized, isClosed };
      localStorage.setItem(`notes-state-${user.id}`, JSON.stringify(state));
    }
  }, [isExpanded, isMinimized, isClosed, isAuthenticated, user?.id]);

  // auto-save when content changes
  useEffect(() => {
    if (!isAuthenticated || !user?.id || noteContent === "") return;

    // clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveNote();
    }, AUTOSAVE_DELAY);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [noteContent, isAuthenticated, user?.id]);

  const loadUserNote = async () => {
    if (!user?.id) return;

    // first, try to load from localStorage as immediate backup
    const localContent = localStorage.getItem(`notes-content-${user.id}`);
    if (localContent) {
      setNoteContent(localContent);
    }

    try {
      const { data, error } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // no note exists, create one with local content if available
          await createEmptyNote(localContent || "");
        } else {
          console.warn("Database unavailable (RLS/Auth issue), using localStorage only:", error);
          // Database is unavailable, just use localStorage
          // Set lastSaved to current time so user knows it's saved locally
          if (localContent) {
            setLastSaved(new Date());
          }
        }
      } else if (data) {
        // use db content if it's more recent or local is empty
        const dbContent = data.content || "";
        setNoteContent(dbContent);
        setLastSaved(new Date(data.updated_at));

        // sync localStorage with db content
        localStorage.setItem(`notes-content-${user.id}`, dbContent);
      }
    } catch (err) {
      console.warn("Database unavailable, using localStorage only:", err);
      // Fallback to localStorage only mode
      if (localContent) {
        setLastSaved(new Date());
      }
    }
  };

  const createEmptyNote = async (initialContent: string = "") => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_notes")
        .insert([{ user_id: user.id, content: initialContent }])
        .select()
        .single();

      if (error) {
        console.warn("Database unavailable (RLS/Auth issue), using localStorage only:", error);
        // Database unavailable, just use localStorage
        localStorage.setItem(`notes-content-${user.id}`, initialContent);
        setLastSaved(new Date());
      } else if (data) {
        setLastSaved(new Date(data.created_at));
        setNoteContent(initialContent);
      }
    } catch (err) {
      console.warn("Database unavailable, using localStorage only:", err);
      // Fallback to localStorage only
      localStorage.setItem(`notes-content-${user.id}`, initialContent);
      setLastSaved(new Date());
    }
  };

  const saveNote = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    
    // Always save to localStorage first
    localStorage.setItem(`notes-content-${user.id}`, noteContent);
    
    try {
      // first try to update existing record
      const { error: updateError } = await supabase
        .from("user_notes")
        .update({ content: noteContent, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .select();

      if (updateError && updateError.code === "PGRST116") {
        // no existing record, create new one
        const { error: insertError } = await supabase
          .from("user_notes")
          .insert([{ user_id: user.id, content: noteContent }]);

        if (insertError) {
          console.warn("Database unavailable (RLS/Auth issue), saved to localStorage only:", insertError);
          // Database unavailable, localStorage already saved above
          setLastSaved(new Date());
          setIsSaving(false);
          return;
        }
      } else if (updateError) {
        console.warn("Database unavailable (RLS/Auth issue), saved to localStorage only:", updateError);
        // Database unavailable, localStorage already saved above
        setLastSaved(new Date());
        setIsSaving(false);
        return;
      }

      setLastSaved(new Date());
    } catch (err) {
      console.warn("Database unavailable, saved to localStorage only:", err);
      // Fallback - localStorage already saved above
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setNoteContent(newContent);

      // also save to localStorage as backup
      if (user?.id) {
        localStorage.setItem(`notes-content-${user.id}`, newContent);
      }
    },
    [user?.id]
  );

  const toggleExpanded = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setIsExpanded((prev) => !prev);
      setIsMinimized(false);
      setIsClosed(false);
      // focus textarea when expanding
      if (!isExpanded) {
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    },
    [isExpanded]
  );

  const handleMinimize = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMinimized(false);
    setIsExpanded(false);
    setIsClosed(false);
  }, []);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsClosed(true);
    setIsExpanded(false);
    setIsMinimized(false);
  }, []);

  const handleReopenFromClosed = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsClosed(false);
    setIsMinimized(false);
    setIsExpanded(false);
  }, []);

  // don't render if not authenticated or closed
  if (!isAuthenticated) return null;

  return (
    <>
      {/* closed state - small floating button to reopen */}
      {isClosed && (
        <div
          className="fixed bottom-4 right-2 sm:right-4 z-50 cursor-pointer"
          onClick={handleReopenFromClosed}>
          <div className="bg-background border border-border rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
            <StickyNote className="h-4 w-4 text-[#1B9BFA]" />
          </div>
        </div>
      )}

      {/* main notes tab - shows collapsed or expanded */}
      {!isClosed && (
        <div
          className={cn(
            "fixed bottom-0 right-2 sm:right-4 z-50 bg-background border border-border shadow-lg transition-all duration-300 flex flex-col",
            isExpanded
              ? "w-80 sm:w-96 h-96 sm:h-[28rem] rounded-t-lg"
              : "w-56 sm:w-64 h-12 rounded-t-lg cursor-pointer"
          )}>
          {/* header */}
          <div
            className="flex items-center justify-between p-3 border-b border-border flex-shrink-0"
            onClick={!isExpanded ? toggleExpanded : undefined}>
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <StickyNote className="h-4 w-4 text-[#1B9BFA] flex-shrink-0" />
              <span className="text-sm font-medium truncate">Quick Notes</span>
              {isSaving && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  saving...
                </span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-xs text-muted-foreground hidden sm:inline flex-shrink-0">
                  saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {isExpanded && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleMinimize}>
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleClose}>
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
              {!isExpanded && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleExpanded}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* content */}
          {isExpanded && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={handleTextareaChange}
                placeholder="jot down your thoughts..."
                className="w-full flex-1 resize-none bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 p-3"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
