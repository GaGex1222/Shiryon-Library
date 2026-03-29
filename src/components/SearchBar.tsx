import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchBooks, normalizeBookFromDb, type Book } from "@/lib/bookStore";

interface SearchBarProps {
  onNavigate: (bookshelfNumber: number, shelfLevel: number) => void;
  onSelectBook: (book: Book) => void;
}

export function SearchBar({ onNavigate, onSelectBook }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const searchPromises = Array.from({ length: 9 }, (_, i) => searchBooks(i + 1, query));

        const allResults = await Promise.all(searchPromises);

        const flatResults = allResults.flatMap((res, index) =>
          res.map((row) => normalizeBookFromDb(row, index + 1))
        );

        setResults(flatResults);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const showResults = focused && query.trim().length > 0;

  return (
    <div className="relative mx-auto mb-6 w-full max-w-md sm:mb-8">
      <div className="relative">
        {isSearching ? (
          <Loader2 className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : (
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="חיפוש בכל הארונות…"
          className="min-h-11 touch-manipulation bg-card ps-9 pe-11"
          enterKeyHint="search"
          inputMode="search"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute end-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary/80 hover:text-foreground touch-manipulation"
            aria-label="ניקוי חיפוש"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full z-50 mt-2 max-h-[min(18rem,70dvh)] w-full overflow-hidden overflow-y-auto rounded-lg border border-border bg-card shadow-xl"
          >
            {results.length === 0 && !isSearching ? (
              <div className="p-4 text-center text-sm text-muted-foreground">לא נמצאו ספרים</div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {results.map((book) => (
                  <button
                    key={`${book.bookshelf_number}-${book.id}`}
                    type="button"
                    className="flex min-h-[48px] w-full touch-manipulation items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-secondary/60 active:bg-secondary/80"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectBook(book);
                      onNavigate(book.bookshelf_number, book.shelf_level);
                      setQuery("");
                    }}
                  >
                    <div className="h-6 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{book.book_name}</p>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        ארון {book.bookshelf_number}, מדף {book.shelf}
                        <span className="ms-2">• {book.quantity} עותקים</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
