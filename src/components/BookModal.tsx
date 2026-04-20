import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Book, locationLabel } from "@/lib/bookStore";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface BookModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onSaveBook: (id: string, title: string, quantity: number) => void | Promise<void>;
  onDeleteBook: (id: string) => void | Promise<void>;
}

export function BookModal({ book, open, onClose, onSaveBook, onDeleteBook }: BookModalProps) {
  const [titleInput, setTitleInput] = useState("");
  const [quantityInput, setQuantityInput] = useState("0");

  useEffect(() => {
    if (!book) return;
    setTitleInput(book.title);
    setQuantityInput(String(book.quantity));
  }, [book, open]);

  if (!book) return null;

  const parsedQuantity = Number.parseInt(quantityInput, 10);
  const safeQuantity = Number.isFinite(parsedQuantity) ? Math.max(0, parsedQuantity) : 0;
  const normalizedTitle = titleInput.trim();
  const canSave = normalizedTitle.length > 0 && (normalizedTitle !== book.title || safeQuantity !== book.quantity);

  const handleSave = async () => {
    if (!normalizedTitle) return;
    await onSaveBook(book.id, normalizedTitle, safeQuantity);
  };

  const handleDelete = async () => {
    await onDeleteBook(book.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader className="pe-10 sm:pe-8">
          <DialogTitle className="text-lg font-semibold text-foreground sm:text-xl">עריכת ספר</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {locationLabel(book.bookshelf_number, book.shelf_level)}
            </span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-title">שם הספר</Label>
            <Input
              id="book-title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="הזן שם ספר"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
            <span className="font-medium text-foreground">עותקים במלאי</span>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 touch-manipulation border-border sm:h-8 sm:w-8"
                onClick={() => setQuantityInput(String(Math.max(0, safeQuantity - 1)))}
                disabled={safeQuantity <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                className="w-20 text-center text-lg font-bold text-primary"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value)}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 touch-manipulation border-border sm:h-8 sm:w-8"
                onClick={() => setQuantityInput(String(safeQuantity + 1))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Button variant="destructive" onClick={handleDelete}>
              מחיקה מלאה
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              שמירה
            </Button>
          </div>
          <div className="h-3 rounded-full" style={{ background: book.color }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
