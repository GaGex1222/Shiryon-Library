import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { BookshelfUnit3D } from "./BookshelfUnit3D";
import { Book, CATEGORIES } from "@/lib/bookStore";

interface RoomViewProps {
  books: Book[];
  onSelectBookshelf: (n: number) => void;
}

function bookCountLabel(n: number, books: Book[]) {
  const count = books.filter((b) => b.bookshelf_number === n).length;
  if (count === 0) return "אין ספרים";
  if (count === 1) return "ספר אחד";
  return `${count} ספרים`;
}

export function RoomView({ books, onSelectBookshelf }: RoomViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex w-full min-w-0 flex-col items-center px-1 sm:px-2"
    >
      <h1 className="mb-2 max-w-[95vw] text-center text-2xl font-semibold tracking-wide text-foreground sm:text-3xl">
        ארונות הספרים
      </h1>
      <p className="mb-6 max-w-[95vw] text-center text-sm text-muted-foreground md:mb-10">
        בחרו ארון מהרשימה
      </p>

      {/* Mobile: list grouped by category */}
      <div className="w-full max-w-lg md:hidden">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="mb-6">
            <h2 className="mb-2 text-right text-base font-semibold text-primary">{cat.name}</h2>
            <ul className="flex flex-col gap-2">
              {cat.bookshelves.map((n) => (
                <li key={n}>
                  <button
                    type="button"
                    onClick={() => onSelectBookshelf(n)}
                    className="flex min-h-[52px] w-full touch-manipulation items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-start shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary/50 active:bg-secondary/80"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block font-semibold text-foreground">ארון {n}</span>
                      <span className="text-xs text-muted-foreground">{bookCountLabel(n, books)}</span>
                    </div>
                    <ChevronLeft className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Desktop: 3D shelves grouped by category */}
      <div className="hidden w-full max-w-[100vw] md:block">
        {CATEGORIES.map((cat, catIdx) => (
          <div key={cat.name} className="mb-10">
            <h2 className="mb-3 text-center text-lg font-semibold text-primary">{cat.name}</h2>
            <div
              className="flex w-full min-w-0 items-end justify-center gap-2 overflow-x-auto overflow-y-visible overscroll-x-contain px-1 pb-2 pt-1 touch-pan-x sm:gap-4 md:gap-8 md:overflow-x-visible md:overscroll-x-auto md:px-0 lg:gap-10 xl:gap-12"
              style={{ transform: "rotateX(8deg)" }}
            >
              {cat.bookshelves.map((n, i) => (
                <motion.div
                  key={n}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (catIdx * 3 + i) * 0.1, type: "spring", stiffness: 120 }}
                  className="flex shrink-0 origin-bottom scale-[0.48] sm:scale-[0.72] md:scale-[0.88] lg:scale-100"
                >
                  <BookshelfUnit3D
                    shelfNumber={n}
                    books={books.filter((b) => b.bookshelf_number === n)}
                    onClick={() => onSelectBookshelf(n)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mx-auto mt-8 hidden h-[40px] w-full max-w-[min(100vw,800px)] rounded-full sm:mt-12 sm:h-[60px] md:block"
        style={{
          background: "radial-gradient(ellipse, hsla(140,10%,3%,0.8) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
}
