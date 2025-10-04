import { useState, useEffect } from 'react';
import { Book } from '../../lib/supabase';
import { bookService } from '../../services/bookService';
import { Plus, CreditCard as Edit2, Trash2, BookOpen } from 'lucide-react';
import { BookForm } from './BookForm';

export const BooksManager = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await bookService.getAllBooks();
      setBooks(data);
    } catch (err) {
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      await bookService.deleteBook(id);
      await loadBooks();
    } catch (err) {
      alert('Failed to delete book');
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBook(null);
    loadBooks();
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading books...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Books Collection</h2>
          <p className="text-slate-600 mt-1">Manage your library's book inventory</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Book</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <BookForm
          book={editingBook}
          onClose={handleFormClose}
        />
      )}

      {books.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No books in the library yet.</p>
          <p className="text-sm mt-1">Click "Add Book" to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Title</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Author</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Edition</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Category</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Year</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Total</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Borrowed</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Available</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {books.map((book) => {
                const available = bookService.getAvailableCopies(book);
                return (
                  <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{book.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{book.author}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{book.edition}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{book.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{book.year_published}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{book.total_copies}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{book.borrowed_copies}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
