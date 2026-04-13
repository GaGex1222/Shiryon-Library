import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Book, locationLabel } from "@/lib/bookStore";
import { Minus, Plus } from "lucide-react";

interface BookModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export function BookModal({ book, open, onClose, onUpdateQuantity }: BookModalProps) {
  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-border bg-card">
        <DialogHeader className="pe-10 sm:pe-8">
          <DialogTitle className="text-lg font-semibold text-foreground sm:text-xl">{book.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {locationLabel(book.bookshelf_number, book.shelf_level)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
            <span className="font-medium text-foreground">עותקים במלאי</span>
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 touch-manipulation border-border sm:h-8 sm:w-8"
                onClick={() => onUpdateQuantity(book.id, -1)}
                disabled={book.quantity <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-xl font-bold text-primary">{book.quantity}</span>
              <Button
                size="icon"
                variant="outline"
                className="h-11 w-11 touch-manipulation border-border sm:h-8 sm:w-8"
                onClick={() => onUpdateQuantity(book.id, 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="h-3 rounded-full" style={{ background: book.color }} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
