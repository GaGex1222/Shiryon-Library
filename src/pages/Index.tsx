import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { RoomView } from "@/components/RoomView";
import { ShelfView } from "@/components/ShelfView";
import { BookModal } from "@/components/BookModal";
import { PlacementForm } from "@/components/PlacementForm";
import { WithdrawalForm } from "@/components/WithdrawalForm";
import { SearchBar } from "@/components/SearchBar";
import { Loader2 } from "lucide-react";
import {
  supabase,
  addBookToShelf,
  updateBookStock,
  normalizeBookFromDb,
  type Book,
  type BookDbRow,
} from "@/lib/bookStore";
import { SITE_NAME } from "@/lib/site";

const Index = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeBookshelf, setActiveBookshelf] = useState<number | null>(null);
  const [activeShelf, setActiveShelf] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllBooks = useCallback(async () => {
    setLoading(true);
    try {
      const fetchPromises = Array.from({ length: 9 }, (_, i) =>
        supabase.from(`bookshelf_${i + 1}`).select("*")
      );

      const results = await Promise.all(fetchPromises);

      for (const res of results) {
        if (res.error) {
          console.error("Error fetching library data:", res.error.message);
        }
      }

      const allBooks = results.flatMap((res, index) =>
        (res.data ?? []).map((row) => normalizeBookFromDb(row as BookDbRow, index + 1))
      );

      setBooks(allBooks);
    } catch (error) {
      console.error("Error fetching library data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllBooks();
  }, [fetchAllBooks]);

  const handleSelectBookshelf = useCallback((n: number) => {
    setActiveBookshelf(n);
    setActiveShelf(null);
  }, []);

  const handleBack = useCallback(() => {
    setActiveBookshelf(null);
    setActiveShelf(null);
  }, []);

  const handleUpdateQuantity = useCallback(
    async (id: string, delta: number) => {
      if (!selectedBook) return;

      const newQty = Math.max(0, (selectedBook.quantity || 0) + delta);
      const updatedData = await updateBookStock(selectedBook.bookshelf_number, id, newQty);

      if (updatedData) {
        setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, quantity: newQty } : b)));
        setSelectedBook((prev) => (prev ? { ...prev, quantity: newQty } : null));
      }
    },
    [selectedBook]
  );

  const handleAddBook = useCallback(
    async (title: string, bookshelf: number, shelf: number, quantity: number) => {
      const newData = await addBookToShelf(bookshelf, {
        book_name: title,
        quantity: quantity,
        shelf: shelf.toString(),
      });

      if (newData) {
        const row = Array.isArray(newData) ? newData[0] : newData;
        if (row) {
          setBooks((prev) => [...prev, normalizeBookFromDb(row, bookshelf)]);
        }
      }
    },
    []
  );

  const handleSearchNavigate = useCallback((bookshelfNumber: number, shelfLevel: number) => {
    setActiveBookshelf(bookshelfNumber);
    setActiveShelf(shelfLevel);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">טוען את הספרייה…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-background pb-safe">
      <header className="flex items-center justify-center gap-3 border-b border-border px-3 py-3 pt-safe sm:gap-4 sm:py-4">
        <img src="/logo.png" alt="לוגו" className="h-9 w-auto shrink-0 sm:h-11" />
        <span className="max-w-[min(100%,20rem)] text-center text-base font-semibold leading-tight tracking-wide text-foreground sm:text-lg">
          {SITE_NAME}
        </span>
      </header>

      <div className="px-3 pt-4 sm:px-4 sm:pt-6">
        <SearchBar onNavigate={handleSearchNavigate} onSelectBook={setSelectedBook} />
      </div>

      <main className="min-w-0 px-3 py-3 sm:px-4 sm:py-4">
        <AnimatePresence mode="wait">
          {activeBookshelf === null ? (
            <RoomView key="room" books={books} onSelectBookshelf={handleSelectBookshelf} />
          ) : (
            <ShelfView
              key={`shelf-${activeBookshelf}`}
              shelfNumber={activeBookshelf}
              books={books.filter((b) => b.bookshelf_number === activeBookshelf)}
              onBack={handleBack}
              onSelectBook={setSelectedBook}
              onSelectShelf={setActiveShelf}
              activeShelf={activeShelf}
            />
          )}
        </AnimatePresence>

        <div className="mx-auto mt-8 max-w-4xl space-y-6 pb-8 sm:mt-10 sm:pb-20">
          <PlacementForm onAdd={handleAddBook} />
          <WithdrawalForm onWithdrawalSaved={fetchAllBooks} />
        </div>
      </main>

      <BookModal
        book={selectedBook}
        open={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  );
};

export default Index;
