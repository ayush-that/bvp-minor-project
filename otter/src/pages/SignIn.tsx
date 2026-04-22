import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Chrome, Loader2 } from "lucide-react";

export function SignIn() {
  const location = useLocation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const autoStartedRef = useRef(false);
  const { signInWithGoogle } = useAuth();

  useEffect(() => {
    const detect = () => {
      const ua =
        navigator.userAgent ||
        (navigator as any).vendor ||
        (window as any).opera ||
        "";
      const inApp =
        /FBAN|FBAV|Instagram|Twitter|LinkedIn|Snapchat|WebView|wv;|FB_IAB|OkHttp/i.test(
          ua
        );
      setIsInApp(inApp);

      // detect query param for auto login
      const params = new URLSearchParams(window.location.search);
      const shouldAuto =
        params.get("auto") === "1" || params.get("autologin") === "1";
      // one-time autologin guard per tab/session to avoid loops
      let allowAuto = !!shouldAuto;
      try {
        const alreadyTried = sessionStorage.getItem("autoLoginOnce") === "1";
        if (alreadyTried) allowAuto = false;
      } catch {}
      setAutoLogin(allowAuto);
    };
    detect();
  }, []);

  useEffect(() => {
    if (autoLogin && !isInApp && !autoStartedRef.current) {
      autoStartedRef.current = true;
      // mark autologin as consumed for this tab
      try {
        sessionStorage.setItem("autoLoginOnce", "1");
      } catch {}
      handleGoogleSignIn();
    }
  }, [autoLogin, isInApp]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // Persist the intended path across the OAuth round-trip (location.state.from set by ProtectedRoute)
      const fromState: any = (location as any)?.state;
      const fromLoc = fromState?.from;
      const params = new URLSearchParams(window.location.search);
      const redirectToQP = params.get("redirectTo");
      const localhostBase = "http://localhost:5173";
      let returnTo: string;

      if (redirectToQP) {
        returnTo = redirectToQP.startsWith("http")
          ? redirectToQP
          : `${localhostBase}${redirectToQP}`;
      } else if (fromLoc?.pathname) {
        returnTo = `${localhostBase}${fromLoc.pathname}${fromLoc.search || ""}${
          fromLoc.hash || ""
        }`;
      } else {
        returnTo = `${localhostBase}/app`;
      }

      try {
        sessionStorage.setItem("postAuthRedirect", returnTo);
      } catch {}
      await signInWithGoogle();
      // google oauth redirects automatically, no need to navigate here
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (isInApp) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center bg-white">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${window.location.origin}/sign-in`} />
        </Helmet>
        <h1 className="text-2xl font-bold mb-6">Open in External Browser</h1>
        <p className="text-sm text-gray-600 max-w-sm mb-6">
          It looks like you're using an in‑app browser (Instagram, LinkedIn,
          Twitter, etc.). Google sign‑in often fails or shows blank screens
          here. Please open this page in your default browser (Chrome / Safari /
          Edge / Firefox) to continue.
        </p>
        <div className="space-y-3 w-full max-w-xs">
          <Button onClick={handleCopyLink} className="w-full" variant="outline">
            {copied ? "Link Copied!" : "Copy Link"}
          </Button>
          <Button
            onClick={() => window.open(window.location.href, "_blank")}
            className="w-full"
            variant="secondary"
          >
            Try Open in Browser
          </Button>
        </div>
        <div className="mt-8 text-xs text-gray-500 space-y-1 max-w-sm">
          <p className="font-medium">Tips:</p>
          <p>• Tap the three dots or share icon and choose "Open in Browser"</p>
          <p>• If copy fails, manually type the URL in your browser</p>
        </div>
      </div>
    );
  }

  // Auto login flow: show a minimal redirecting UI instead of the manual button
  if (autoLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 text-center bg-white">
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
          <link rel="canonical" href={`${window.location.origin}/sign-in`} />
        </Helmet>
        <h1 className="text-xl font-semibold mb-6">Redirecting to Google…</h1>
        <p className="text-sm text-gray-600 mb-6">
          Please wait while we start the sign‑in flow.
        </p>
        <Button disabled className="w-full max-w-xs" variant="outline">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting Google
          Sign‑in
        </Button>
        <div className="mt-6">
          <Button
            onClick={handleGoogleSignIn}
            variant="ghost"
            className="text-sm"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8 bg-white">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${window.location.origin}/sign-in`} />
      </Helmet>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Continue with your Google account to get started
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 backdrop-blur-sm px-4 py-8 shadow-lg sm:rounded-none sm:px-10 border border-white/20">
          {/* google signin btn */}
          <div className="mb-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 !rounded-[4px] font-medium"
            >
              <Chrome className="mr-2 h-4 w-4" />
              {isGoogleLoading ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
