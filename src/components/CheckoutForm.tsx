import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ClipboardList } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BookEntry {
  id: string;
  title: string;
  quantity: number;
}

export function CheckoutForm() {
  const [fullName, setFullName] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([
    { id: Date.now().toString(), title: "", quantity: 1 },
  ]);
  const [submitted, setSubmitted] = useState(false);

  const addEntry = () => {
    setBookEntries(prev => [
      ...prev,
      { id: Date.now().toString(), title: "", quantity: 1 },
    ]);
  };

  const removeEntry = (id: string) => {
    if (bookEntries.length <= 1) return;
    setBookEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: "title" | "quantity", value: string | number) => {
    setBookEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !personalId.trim()) return;
    if (bookEntries.some(e => !e.title.trim() || e.quantity < 1)) return;

    // For now just show confirmation (will persist with Cloud later)
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFullName("");
      setPersonalId("");
      setBookEntries([{ id: Date.now().toString(), title: "", quantity: 1 }]);
    }, 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-card border border-border space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-serif text-foreground">Book Checkout</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
          <Input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Enter full name..."
            className="bg-secondary border-border"
            required
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Personal ID</label>
          <Input
            value={personalId}
            onChange={e => setPersonalId(e.target.value)}
            placeholder="Enter personal ID..."
            className="bg-secondary border-border"
            required
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm text-muted-foreground block">Books to check out</label>
        <AnimatePresence initial={false}>
          {bookEntries.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-end gap-3"
            >
              <div className="flex-1 min-w-0">
                {idx === 0 && (
                  <span className="text-xs text-muted-foreground mb-1 block">Book Title</span>
                )}
                <Input
                  value={entry.title}
                  onChange={e => updateEntry(entry.id, "title", e.target.value)}
                  placeholder="Book title..."
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="w-24">
                {idx === 0 && (
                  <span className="text-xs text-muted-foreground mb-1 block">Qty</span>
                )}
                <Input
                  type="number"
                  min={1}
                  value={entry.quantity}
                  onChange={e => updateEntry(entry.id, "quantity", Math.max(1, Number(e.target.value) || 1))}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeEntry(entry.id)}
                disabled={bookEntries.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>

        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="gap-1 border-border">
          <Plus className="h-3 w-3" /> Add another book
        </Button>
      </div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-primary font-medium text-center py-2"
          >
            ✓ Checkout recorded successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" className="w-full gap-2" disabled={submitted}>
        <ClipboardList className="h-4 w-4" /> Submit Checkout
      </Button>
    </form>
  );
}
