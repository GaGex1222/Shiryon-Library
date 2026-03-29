import { motion } from "framer-motion";
import { Book } from "@/lib/bookStore";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useElementWidth } from "@/hooks/useElementWidth";

interface ShelfViewProps {
  shelfNumber: number;
  books: Book[];
  onBack: () => void;
  onSelectBook: (book: Book) => void;
  onSelectShelf: (level: number) => void;
  activeShelf: number | null;
}

const SPINE_TITLE_FONT_PX = 11;
const SPINE_THICKNESS_PX = 40;
const SPINE_GAP_PX = 6;
const SPINE_FIXED_HEIGHT_PX = 130;

function chunkBooks<T>(arr: T[], chunkSize: number): T[][] {
  if (chunkSize < 1) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) out.push(arr.slice(i, i + chunkSize));
  return out;
}

export function ShelfView({ shelfNumber, books, onBack, onSelectBook, onSelectShelf, activeShelf }: ShelfViewProps) {
  const { ref: shelfContainerRef, width: shelfContainerW } = useElementWidth<HTMLDivElement>();
  const shelfContentWidth =
    shelfContainerW > 0 ? Math.max(180, Math.min(660, shelfContainerW - 64)) : 660;

  const filteredBooks = activeShelf ? books.filter((b) => b.shelf_level === activeShelf) : [];

  // Compute total height so the back/side panels always match the content
  const booksPerRowForHeight = Math.max(
    1,
    Math.floor(shelfContentWidth / (SPINE_THICKNESS_PX + SPINE_GAP_PX))
  );
  const totalContentHeight =
    [1, 2, 3, 4, 5].reduce((sum, level) => {
      const levelBooks = books.filter((b) => b.shelf_level === level);
      const rows = chunkBooks(levelBooks, booksPerRowForHeight);
      const h =
        36 +
        SPINE_FIXED_HEIGHT_PX +
        Math.max(0, rows.length - 1) * (SPINE_FIXED_HEIGHT_PX + 10);
      return sum + h + 8; // 8 = mb-2
    }, 0) + 32; // 32 = p-4 top+bottom

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      className="mx-auto min-w-0 w-full max-w-4xl px-0 sm:px-0"
    >
      <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-11 w-11 shrink-0 touch-manipulation text-muted-foreground hover:text-foreground"
          aria-label="חזרה לחדר"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h2 className="truncate text-xl font-semibold text-foreground sm:text-2xl">ארון {shelfNumber}</h2>
      </div>

      <div className="perspective-room -mx-1 mb-6 flex touch-pan-x justify-center overflow-x-auto overflow-y-visible overscroll-x-contain px-1 sm:mb-8 md:mx-0 md:touch-auto md:overflow-x-visible md:overscroll-x-auto md:px-0">
        <div className="relative min-w-0 w-full max-w-[700px] preserve-3d" style={{ transform: "rotateX(5deg)" }}>
          <div
            ref={shelfContainerRef}
            className="relative min-w-0 w-full max-w-[700px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="wood-dark absolute inset-0 rounded-lg"
              style={{
                transform: "translateZ(-50px)",
                height: `${totalContentHeight}px`,
                boxShadow: "inset 0 0 40px rgba(0,0,0,0.6)",
              }}
            />

            <div
              className="wood-texture absolute left-0 top-0 w-8 sm:w-[50px]"
              style={{
                height: `${totalContentHeight}px`,
                transform: "rotateY(90deg) translateZ(0px)",
                transformOrigin: "left center",
              }}
            />

            <div
              className="wood-texture absolute right-0 top-0 w-8 sm:w-[50px]"
              style={{
                height: `${totalContentHeight}px`,
                transform: "rotateY(-90deg) translateZ(0px)",
                transformOrigin: "right center",
              }}
            />

            <div className="relative p-4" style={{ transformStyle: "preserve-3d" }}>
              {[1, 2, 3, 4, 5].map((level) => {
                const shelfLevelBooks = books.filter((b) => b.shelf_level === level);
                const isActive = activeShelf === level;
                const totalCount = shelfLevelBooks.reduce((sum, b) => sum + b.quantity, 0);

                const booksPerRow = Math.max(
                  1,
                  Math.floor(shelfContentWidth / (SPINE_THICKNESS_PX + SPINE_GAP_PX))
                );
                const rows = chunkBooks(shelfLevelBooks, booksPerRow);
                const shelfHeight =
                  36 + SPINE_FIXED_HEIGHT_PX + Math.max(0, rows.length - 1) * (SPINE_FIXED_HEIGHT_PX + 10);

                return (
                  <motion.div
                    key={level}
                    className={`relative mb-2 cursor-pointer rounded transition-colors ${
                      isActive ? "ring-2 ring-primary/50" : ""
                    }`}
                    onClick={() => onSelectShelf(level)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.995 }}
                    style={{ transformStyle: "preserve-3d", height: `${shelfHeight}px` }}
                  >
                    <div className="absolute start-2 top-1 z-10 flex max-w-[95%] flex-wrap items-center gap-1 sm:gap-2">
                      <span className="text-[10px] font-medium text-gold-dim">מדף {level}</span>
                      {shelfLevelBooks.length > 0 && (
                        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] leading-tight text-primary">
                          {shelfLevelBooks.length === 1
                            ? "ספר אחד"
                            : `${shelfLevelBooks.length} ספרים`}{" "}
                          • {totalCount} עותקים
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-[10px] start-3 end-3 flex flex-wrap content-end items-end gap-1.5 sm:start-4 sm:end-4">
                      {shelfLevelBooks.map((book) => {
                        return (
                          <motion.div
                            key={book.id}
                            title={book.title}
                            className="relative shrink-0 cursor-pointer touch-manipulation overflow-hidden rounded-sm border border-black/20"
                            style={{
                              width: `${SPINE_THICKNESS_PX}px`,
                              height: `${SPINE_FIXED_HEIGHT_PX}px`,
                              backgroundColor: book.color,
                              boxShadow: "2px 3px 8px rgba(0,0,0,0.45)",
                            }}
                            whileHover={{ y: -4, scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBook(book);
                            }}
                          >
                            <span
                              className="absolute bottom-2 left-1/2 z-[1] -translate-x-1/2 font-sans text-[10px] tabular-nums leading-none"
                              style={{ color: "rgba(255,255,255,0.9)" }}
                            >
                              ×{book.quantity}
                            </span>
                            <span
                              className="absolute left-1/2 top-[44%] block text-center font-medium leading-none text-white/95 [text-shadow:0_1px_3px_rgba(0,0,0,0.65)]"
                              style={{
                                transform: "translate(-50%, -50%) rotate(-90deg)",
                                fontSize: `${SPINE_TITLE_FONT_PX}px`,
                                whiteSpace: "nowrap",
                                maxWidth: `${SPINE_FIXED_HEIGHT_PX - 32}px`,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {book.title}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div
                      className="wood-shelf absolute bottom-0 left-0 right-0 h-[8px] rounded-sm"
                      style={{
                        boxShadow: "0 3px 8px rgba(0,0,0,0.5)",
                        transform: "translateZ(2px)",
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {activeShelf && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card p-4 sm:p-6"
        >
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            מדף {activeShelf} —{" "}
            {filteredBooks.length === 1 ? "ספר אחד" : `${filteredBooks.length} ספרים`}
          </h3>
          {filteredBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין עדיין ספרים במדף זה.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredBooks.map((book) => (
                <motion.div
                  key={book.id}
                  className="cursor-pointer rounded-lg border border-border bg-secondary p-3 transition-colors hover:border-primary/40"
                  onClick={() => onSelectBook(book)}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="mb-2 h-2 rounded-full" style={{ backgroundColor: book.color }} />
                  <p className="truncate text-sm text-foreground">{book.title}</p>
                  <p className="text-xs text-muted-foreground">{book.quantity} עותקים</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
