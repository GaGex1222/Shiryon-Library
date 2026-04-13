import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface BookCategory {
  name: string;
  bookshelves: readonly [number, number, number];
}

export const CATEGORIES: BookCategory[] = [
  { name: 'מדור מרכבה', bookshelves: [1, 2, 3] },
  { name: 'מדור מענ"ק וכשירויות', bookshelves: [4, 5, 6] },
  { name: 'מדור בדח', bookshelves: [7, 8, 9] },
];

export function getCategoryForBookshelf(bookshelfNumber: number): BookCategory | undefined {
  return CATEGORIES.find((c) => (c.bookshelves as number[]).includes(bookshelfNumber));
}

export function locationLabel(bookshelfNumber: number, shelfLevel: number | string): string {
  const cat = getCategoryForBookshelf(bookshelfNumber);
  const catPart = cat ? `${cat.name}, ` : '';
  return `${catPart}ארון ${bookshelfNumber}, מדף ${shelfLevel}`;
}

export interface BookDbRow {
  id: string;
  book_name: string;
  quantity: number;
  shelf: string;
}

export interface Book extends BookDbRow {
  title: string;
  shelf_level: number;
  bookshelf_number: number;
  color: string;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function spineColorFromId(id: string): string {
  const h = hashString(id);
  const hue = 100 + (h % 42);
  const sat = 38 + (h % 4) * 4;
  const light = 28 + (h % 5) * 3;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function bookSpineHeightFromId(id: string): number {
  const h = hashString(id);
  return 40 + ((h * 7 + 13) % 23);
}

export function normalizeBookFromDb(row: BookDbRow, bookshelfNumber: number): Book {
  const shelfLevel = parseInt(String(row.shelf), 10);
  return {
    ...row,
    title: row.book_name,
    shelf_level: Number.isFinite(shelfLevel) && shelfLevel > 0 ? shelfLevel : 1,
    bookshelf_number: bookshelfNumber,
    color: spineColorFromId(row.id),
  };
}

export async function addBookToShelf(bookshelfNumber: number, bookData: Omit<BookDbRow, "id">) {
  if (bookshelfNumber < 1 || bookshelfNumber > 9) {
    throw new Error("Bookshelf number must be between 1 and 9");
  }

  const tableName = `bookshelf_${bookshelfNumber}`;

  const { data, error } = await supabase
    .from(tableName)
    .insert([
      {
        book_name: bookData.book_name,
        quantity: bookData.quantity,
        shelf: bookData.shelf,
      },
    ])
    .select();

  if (error) {
    console.error(`Error adding book to ${tableName}:`, error.message);
    return null;
  }

  return data;
}

export async function updateBookStock(bookshelfNumber: number, bookId: string, newQuantity: number) {
  const tableName = `bookshelf_${bookshelfNumber}`;

  const { data, error } = await supabase
    .from(tableName)
    .update({ quantity: newQuantity })
    .eq("id", bookId)
    .select();

  if (error) {
    console.error(`Error updating stock in ${tableName}:`, error.message);
    return null;
  }

  return data;
}

export interface WithdrawalItem {
  book_name: string;
  quantity: number;
}

export interface Withdrawal {
  id: number;
  full_name: string;
  unit: string;
  books: WithdrawalItem[];
  created_at: string;
}

// Returns a list of validation errors (empty = all OK)
export async function checkWithdrawalStock(
  books: WithdrawalItem[]
): Promise<string[]> {
  const errors: string[] = [];

  for (const item of books) {
    if (!item.book_name.trim() || item.quantity <= 0) continue;

    const results = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        supabase
          .from(`bookshelf_${i + 1}`)
          .select("*")
          .ilike("book_name", item.book_name.trim())
      )
    );

    let found = false;
    for (const res of results) {
      const rows = (res.data ?? []) as BookDbRow[];
      if (rows.length > 0) {
        const book = rows[0];
        found = true;
        if (item.quantity > book.quantity) {
          errors.push(
            `"${item.book_name}" — מבוקש ${item.quantity}, במלאי רק ${book.quantity}`
          );
        }
        break;
      }
    }

    if (!found) {
      errors.push(`"${item.book_name}" — לא נמצא בספרייה`);
    }
  }

  return errors;
}

export async function deductWithdrawalStock(books: WithdrawalItem[]): Promise<void> {
  for (const item of books) {
    if (!item.book_name.trim() || item.quantity <= 0) continue;

    // Search the book by exact name across all bookshelves
    const searchResults = await Promise.all(
      Array.from({ length: 9 }, (_, i) =>
        supabase
          .from(`bookshelf_${i + 1}`)
          .select("*")
          .ilike("book_name", item.book_name.trim())
      )
    );

    // Deduct from the first match found
    for (let i = 0; i < searchResults.length; i++) {
      const rows = (searchResults[i].data ?? []) as BookDbRow[];
      if (rows.length > 0) {
        const book = rows[0];
        const newQty = Math.max(0, book.quantity - item.quantity);
        await supabase
          .from(`bookshelf_${i + 1}`)
          .update({ quantity: newQty })
          .eq("id", book.id);
        break; // deduct from first match only
      }
    }
  }
}

export async function createWithdrawal(
  fullName: string,
  unit: string,
  books: WithdrawalItem[]
): Promise<Withdrawal | null> {
  const { data, error } = await supabase
    .from("withdrawals")
    .insert([{ full_name: fullName, unit, books }])
    .select()
    .single();

  if (error) {
    console.error("Error creating withdrawal:", error.message, error.details, error.hint);
    return null;
  }

  // Deduct stock for each book taken
  await deductWithdrawalStock(books);

  return data as Withdrawal;
}

export async function fetchWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from("withdrawals")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching withdrawals:", error.message);
    return [];
  }

  return (data ?? []) as Withdrawal[];
}

export async function searchBooks(bookshelfNumber: number, searchTerm: string): Promise<BookDbRow[]> {
  const tableName = `bookshelf_${bookshelfNumber}`;

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .ilike("book_name", `%${searchTerm}%`);

  if (error) {
    console.error(`Error searching ${tableName}:`, error.message);
    return [];
  }

  return (data ?? []) as BookDbRow[];
}
