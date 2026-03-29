import { motion } from "framer-motion";
import { Book } from "@/lib/bookStore";

interface BookshelfUnit3DProps {
  shelfNumber: number;
  books: Book[];
  onClick: () => void;
}

export function BookshelfUnit3D({ shelfNumber, books, onClick }: BookshelfUnit3DProps) {
  const shelfBooks = [1, 2, 3, 4, 5].map((level) => books.filter((b) => b.shelf_level === level));

  return (
    <motion.div
      className="touch-manipulation cursor-pointer preserve-3d pb-10"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      onClick={onClick}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="relative h-[380px] w-[220px]" style={{ transformStyle: "preserve-3d" }}>
        <div
          className="wood-dark absolute inset-0 rounded-sm"
          style={{
            transform: "translateZ(-30px)",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.5)",
          }}
        />

        <div
          className="wood-texture absolute left-0 top-0 h-full w-[30px]"
          style={{
            transform: "rotateY(90deg) translateZ(0px)",
            transformOrigin: "left center",
          }}
        />

        <div
          className="wood-texture absolute right-0 top-0 h-full w-[30px]"
          style={{
            transform: "rotateY(-90deg) translateZ(0px)",
            transformOrigin: "right center",
          }}
        />

        <div
          className="wood-shelf absolute left-0 top-0 h-[30px] w-full"
          style={{
            transform: "rotateX(-90deg) translateZ(0px)",
            transformOrigin: "top center",
          }}
        />

        <div
          className="wood-shelf absolute bottom-0 left-0 h-[30px] w-full"
          style={{
            transform: "rotateX(90deg) translateZ(0px)",
            transformOrigin: "bottom center",
          }}
        />

        <div className="absolute inset-0 flex flex-col justify-between p-1" style={{ transform: "translateZ(0px)" }}>
          {shelfBooks.map((levelBooks, i) => (
            <div key={i} className="relative flex-1">
              <div
                className="wood-shelf absolute bottom-0 left-0 right-0 h-[5px] rounded-sm"
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                }}
              />
              <div className="absolute bottom-[5px] left-1 right-1 flex items-end gap-[2px]">
                {levelBooks.slice(0, 8).map((book) => {
                  const spineW = 14;
                  const spineH = Math.min(
                    56,
                    Math.max(30, 22 + Math.min(book.title.length, 24) * 1.1)
                  );
                  const labelMax = spineH - 6;
                  const fontPx = Math.min(
                    7,
                    Math.max(5, (labelMax / Math.max(book.title.length, 4)) * 1.1)
                  );
                  return (
                    <div
                      key={book.id}
                      title={book.title}
                      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-black/10"
                      style={{
                        width: `${spineW}px`,
                        height: `${spineH}px`,
                        backgroundColor: book.color,
                        boxShadow: "1px 1px 3px rgba(0,0,0,0.4)",
                      }}
                    >
                      <span
                        className="block overflow-hidden text-ellipsis whitespace-nowrap text-center leading-none text-white/90"
                        style={{
                          transform: "rotate(-90deg)",
                          maxWidth: `${labelMax}px`,
                          fontSize: `${fontPx}px`,
                          textShadow: "0 1px 1px rgba(0,0,0,0.55)",
                        }}
                      >
                        {book.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 translate-y-full pt-1 text-center">
          <span className="relative z-10 text-sm font-medium tracking-wide text-gold-dim drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            ארון {shelfNumber}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
