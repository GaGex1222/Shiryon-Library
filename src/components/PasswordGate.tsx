import { lazy, Suspense, useEffect, useState } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SITE_NAME } from "@/lib/site";

const App = lazy(() => import("@/App"));

const SESSION_KEY = "librarium_auth_v1";

function accessPasswordConfigured(): boolean {
  const p = import.meta.env.VITE_APP_ACCESS_PASSWORD;
  return typeof p === "string" && p.length > 0;
}

export function PasswordGate() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      if (accessPasswordConfigured() && sessionStorage.getItem(SESSION_KEY) === "1") {
        setUnlocked(true);
      }
    } finally {
      setSessionChecked(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!accessPasswordConfigured()) {
      setError("לא הוגדרה סיסמת גישה.");
      return;
    }
    if (password === import.meta.env.VITE_APP_ACCESS_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setPassword("");
      setError("סיסמה שגויה.");
    }
  };

  if (!sessionChecked) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">טוען…</p>
      </div>
    );
  }

  if (!accessPasswordConfigured()) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4 py-8 text-center sm:px-6">
        <BookOpen className="h-10 w-10 text-muted-foreground" />
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          יש להגדיר את{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-foreground">
            VITE_APP_ACCESS_PASSWORD
          </code>{" "}
          בקובץ <code className="font-mono text-foreground">.env</code> או בסביבת ההרצה של השרת, ולאחר מכן לבנות מחדש. האפליקציה לא תיטען לפני כן.
        </p>
      </div>
    );
  }

  if (unlocked) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-background px-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">נכנסים לספרייה…</p>
          </div>
        }
      >
        <App />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-background px-4 py-10 pb-safe sm:gap-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <span className="text-xl font-semibold tracking-wide text-foreground">{SITE_NAME}</span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-lg sm:p-6"
      >
        <div>
          <label htmlFor="access-password" className="mb-2 block text-sm text-muted-foreground">
            סיסמה
          </label>
          <Input
            id="access-password"
            type="password"
            autoComplete="current-password"
            placeholder="הזינו סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-secondary border-border"
          />
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" className="h-11 w-full touch-manipulation">
          כניסה
        </Button>
      </form>
    </div>
  );
}
