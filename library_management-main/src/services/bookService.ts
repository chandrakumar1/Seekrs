import { supabase, Book } from '../lib/supabase';

export const bookService = {
  async getAllBooks(): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getBookById(id: number): Promise<Book | null> {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'borrowed_copies'>) {
    const existingBook = await supabase
      .from('books')
      .select('*')
      .eq('title', book.title)
      .eq('author', book.author)
      .eq('edition', book.edition)
      .maybeSingle();

    if (existingBook.data) {
      const { data, error } = await supabase
        .from('books')
        .update({
          total_copies: existingBook.data.total_copies + book.total_copies,
        })
        .eq('id', existingBook.data.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        ...book,
        borrowed_copies: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBook(id: number, updates: Partial<Book>) {
    const { data, error } = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBook(id: number) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async searchBooks(filters: {
    title?: string;
    author?: string;
    category?: string;
    year?: number;
    availableOnly?: boolean;
  }): Promise<Book[]> {
    let query = supabase.from('books').select('*');

    if (filters.title) {
      query = query.ilike('title', `%${filters.title}%`);
    }
    if (filters.author) {
      query = query.ilike('author', `%${filters.author}%`);
    }
    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }
    if (filters.year) {
      query = query.eq('year_published', filters.year);
    }
    if (filters.availableOnly) {
      query = query.filter('total_copies', 'gt', 'borrowed_copies');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getAvailableCopies(book: Book): number {
    return book.total_copies - book.borrowed_copies;
  },

  async borrowBook(bookId: number, studentId: number) {
    const book = await this.getBookById(bookId);
    if (!book) throw new Error('Book not found');

    const available = this.getAvailableCopies(book);
    if (available <= 0) throw new Error('No copies available');

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) throw new Error('Student not found');
    if (student.currently_borrowing === 'YES') {
      throw new Error('Student already has a borrowed book');
    }

    const { error: bookError } = await supabase
      .from('books')
      .update({ borrowed_copies: book.borrowed_copies + 1 })
      .eq('id', bookId);

    if (bookError) throw bookError;

    const { error: studentUpdateError } = await supabase
      .from('students')
      .update({
        currently_borrowing: 'YES',
        borrowed_book_id: bookId,
        borrowed_book_name: book.title,
        borrowed_date: new Date().toISOString().split('T')[0],
        days_borrowed: 0,
      })
      .eq('id', studentId);

    if (studentUpdateError) throw studentUpdateError;
  },

  async returnBook(studentId: number) {
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .maybeSingle();

    if (studentError) throw studentError;
    if (!student) throw new Error('Student not found');
    if (student.currently_borrowing === 'NO') {
      throw new Error('Student has no borrowed books');
    }

    if (student.borrowed_book_id) {
      const book = await this.getBookById(student.borrowed_book_id);
      if (book) {
        const { error: bookError } = await supabase
          .from('books')
          .update({ borrowed_copies: Math.max(0, book.borrowed_copies - 1) })
          .eq('id', book.id);

        if (bookError) throw bookError;
      }
    }

    const { error: studentUpdateError } = await supabase
      .from('students')
      .update({
        currently_borrowing: 'NO',
        borrowed_book_id: null,
        borrowed_book_name: null,
        borrowed_date: null,
        days_borrowed: 0,
      })
      .eq('id', studentId);

    if (studentUpdateError) throw studentUpdateError;
  },
};
