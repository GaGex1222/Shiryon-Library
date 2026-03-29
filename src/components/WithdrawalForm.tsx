import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ClipboardList, CheckCircle2, Loader2, ChevronDown, ChevronUp, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createWithdrawal,
  fetchWithdrawals,
  checkWithdrawalStock,
  searchBooks,
  normalizeBookFromDb,
  type WithdrawalItem,
  type Withdrawal,
  type Book,
} from "@/lib/bookStore";

function parseBooks(raw: unknown): WithdrawalItem[] {
  if (Array.isArray(raw)) return raw as WithdrawalItem[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ── Book search input with live DB dropdown ──────────────────────────────────

interface BookSearchInputProps {
  value: string;
  onChange: (bookName: string) => void;
  placeholder?: string;
}

function BookSearchInput({ value, onChange, placeholder = "חיפוש ספר…" }: BookSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync if parent resets value
  useEffect(() => {
    if (value === "") setQuery("");
  }, [value]);

  useEffect(() => {
    const tid = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const all = await Promise.all(
          Array.from({ length: 9 }, (_, i) => searchBooks(i + 1, query))
        );
        setResults(all.flatMap((res, i) => res.map((row) => normalizeBookFromDb(row, i + 1))));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => clearTimeout(tid);
  }, [query]);

  const showDropdown = focused && query.trim().length > 0;

  const handleSelect = (book: Book) => {
    setQuery(book.book_name);
    onChange(book.book_name);
    setResults([]);
    setFocused(false);
  };

  return (
    <div className="relative flex-1" ref={containerRef}>
      <div className="relative">
        {searching ? (
          <Loader2 className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 180)}
          placeholder={placeholder}
          className="bg-background ps-8"
          autoComplete="off"
        />
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
          >
            {results.length === 0 && !searching ? (
              <div className="px-4 py-3 text-center text-xs text-muted-foreground">לא נמצאו ספרים</div>
            ) : (
              results.map((book) => (
                <button
                  key={`${book.bookshelf_number}-${book.id}`}
                  type="button"
                  className="flex min-h-[44px] w-full items-center gap-3 px-3 py-2 text-start transition-colors hover:bg-secondary/60"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(book);
                  }}
                >
                  <div className="h-5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: book.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{book.book_name}</p>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-2.5 w-2.5 shrink-0" />
                      ארון {book.bookshelf_number}, מדף {book.shelf}
                      <span className="ms-1">• {book.quantity} עותקים</span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

export function WithdrawalForm({ onWithdrawalSaved }: { onWithdrawalSaved?: () => void }) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [unit, setUnit] = useState("");
  const [items, setItems] = useState<WithdrawalItem[]>([{ book_name: "", quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const addItem = () => setItems((prev) => [...prev, { book_name: "", quantity: 1 }]);

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItemName = (idx: number, name: string) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, book_name: name } : item)));

  const updateItemQty = (idx: number, qty: number) =>
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, quantity: qty } : item)));

  const reset = () => {
    setFullName("");
    setUnit("");
    setItems([{ book_name: "", quantity: 1 }]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("נא להזין שם מלא.");
    if (!unit.trim()) return setError("נא להזין יחידה.");
    const validItems = items.filter((it) => it.book_name.trim() && it.quantity > 0);
    if (validItems.length === 0) return setError("נא להזין לפחות ספר אחד עם כמות.");

    setSubmitting(true);

    // Validate stock availability before saving
    const stockErrors = await checkWithdrawalStock(validItems);
    if (stockErrors.length > 0) {
      setError(stockErrors.join("\n"));
      setSubmitting(false);
      return;
    }

    const result = await createWithdrawal(fullName.trim(), unit.trim(), validItems);
    setSubmitting(false);

    if (!result) {
      setError("שגיאה בשמירת הטופס. אנא נסה שוב.");
      return;
    }

    setSuccess(true);
    reset();
    onWithdrawalSaved?.();
    setTimeout(() => setSuccess(false), 3500);
  };

  const loadHistory = async () => {
    if (historyOpen) {
      setHistoryOpen(false);
      return;
    }
    setHistoryLoading(true);
    setHistoryOpen(true);
    const data = await fetchWithdrawals();
    setHistory(data);
    setHistoryLoading(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header toggle */}
      <button
        type="button"
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <ClipboardList className="h-5 w-5 shrink-0 text-primary" />
        <span className="flex-1 font-semibold text-foreground">טופס משיכת ספרים ידנית</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 pb-6 pt-5">
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-600"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    הטופס נשמר בהצלחה!
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
                {/* Personal info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">שם מלא</label>
                    <Input
                      placeholder="ישראל ישראלי"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">יחידה</label>
                    <Input
                      placeholder="שם היחידה"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="bg-background"
                    />
                  </div>
                </div>

                {/* Books list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">ספרים שנלקחו</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={addItem}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      הוסף ספר
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2"
                      >
                        <BookSearchInput
                          value={item.book_name}
                          onChange={(name) => updateItemName(idx, name)}
                          placeholder="חיפוש ספר במאגר…"
                        />
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="כמות"
                          value={item.quantity === 0 ? "" : item.quantity}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            updateItemQty(idx, raw === "" ? 0 : parseInt(raw));
                          }}
                          className="w-20 shrink-0 bg-background text-center"
                        />
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="whitespace-pre-line text-sm text-destructive">{error}</p>
                )}

                <Button type="submit" disabled={submitting} className="w-full gap-2">
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  {submitting ? "שומר…" : "שמור טופס משיכה"}
                </Button>
              </form>

              {/* History */}
              <div className="mt-6 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={loadHistory}
                >
                  {historyOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  היסטוריית משיכות
                </Button>

                <AnimatePresence>
                  {historyOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      {historyLoading ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : history.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">אין רשומות.</p>
                      ) : (
                        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 400 }}>
                          {history.map((w) => (
                            <div
                              key={w.id}
                              className="rounded-lg border border-border bg-secondary/50 p-3 text-sm"
                              dir="rtl"
                            >
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="font-semibold text-foreground">{w.full_name}</span>
                                <span className="text-xs text-muted-foreground">{w.unit}</span>
                              </div>
                              <p className="mb-2 text-xs text-muted-foreground">
                                {new Date(w.created_at).toLocaleString("he-IL")}
                              </p>
                              <ul className="space-y-0.5">
                                {parseBooks(w.books).map((b, i) => (
                                  <li key={i} className="flex justify-between text-muted-foreground">
                                    <span>{b.book_name}</span>
                                    <span className="font-medium text-foreground">×{b.quantity}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
