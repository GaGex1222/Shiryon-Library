import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { CATEGORIES } from "@/lib/bookStore";

interface PlacementFormProps {
  onAdd: (title: string, bookshelf: number, shelf: number, quantity: number) => void;
}

export function PlacementForm({ onAdd }: PlacementFormProps) {
  const [title, setTitle] = useState("");
  const [bookshelf, setBookshelf] = useState("");
  const [shelf, setShelf] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !bookshelf || !shelf) return;
    onAdd(title.trim(), Number(bookshelf), Number(shelf), Math.max(1, Number(quantity) || 1));
    setTitle("");
    setBookshelf("");
    setShelf("");
    setQuantity("1");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:p-4"
    >
      <div className="min-w-0 w-full sm:min-w-[200px] sm:flex-1">
        <label className="mb-1 block text-sm text-muted-foreground">שם הספר</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="הזינו שם ספר…"
          className="bg-secondary border-border"
        />
      </div>
      <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:min-w-0 sm:max-w-none">
        <div className="min-w-0 w-full sm:w-40">
          <label className="mb-1 block text-sm text-muted-foreground">ארון</label>
          <Select value={bookshelf} onValueChange={setBookshelf}>
            <SelectTrigger className="touch-manipulation bg-secondary border-border">
              <SelectValue placeholder="בחרו…" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <div key={cat.name}>
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                    {cat.name}
                  </div>
                  {cat.bookshelves.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      ארון {n}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 w-full sm:w-40">
          <label className="mb-1 block text-sm text-muted-foreground">מדף</label>
          <Select value={shelf} onValueChange={setShelf}>
            <SelectTrigger className="touch-manipulation bg-secondary border-border">
              <SelectValue placeholder="בחרו…" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  מדף {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex w-full flex-wrap items-end gap-3 sm:w-auto">
        <div className="min-w-[5.5rem] flex-1 sm:flex-initial sm:w-28">
          <label className="mb-1 block text-sm text-muted-foreground">כמות</label>
          <Input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <Button type="submit" className="h-11 min-w-[44px] flex-1 touch-manipulation gap-2 sm:h-10 sm:flex-initial">
          <Plus className="h-4 w-4" /> הוספת ספר
        </Button>
      </div>
    </form>
  );
}
