import { useState, useEffect } from 'react';
import { Book, Student } from '../../lib/supabase';
import { bookService } from '../../services/bookService';
import { studentService } from '../../services/studentService';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export const BorrowReturn = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [booksData, studentsData] = await Promise.all([
        bookService.getAllBooks(),
        studentService.getAllStudents(),
      ]);
      setBooks(booksData);
      setStudents(studentsData);
    } catch (err) {
      setError('Failed to load data');
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await bookService.borrowBook(parseInt(selectedBook), parseInt(selectedStudent));
      setSuccess('Book borrowed successfully!');
      setSelectedBook('');
      setSelectedStudent('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to borrow book');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (studentId: number) => {
    if (!confirm('Are you sure you want to mark this book as returned?')) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await bookService.returnBook(studentId);
      setSuccess('Book returned successfully!');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return book');
    } finally {
      setLoading(false);
    }
  };

  const availableBooks = books.filter(book => bookService.getAvailableCopies(book) > 0);
  const availableStudents = students.filter(student => student.currently_borrowing === 'NO');
  const borrowingStudents = students.filter(student => student.currently_borrowing === 'YES');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Borrow & Return Management</h2>
        <p className="text-slate-600 mt-1">Manage book borrowing and return operations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ArrowRight className="w-5 h-5 text-slate-900" />
            <h3 className="text-lg font-semibold text-slate-900">Borrow Book</h3>
          </div>

          <form onSubmit={handleBorrow} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="">Choose a book...</option>
                {availableBooks.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} by {book.author} (Available: {bookService.getAvailableCopies(book)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Student
              </label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              >
                <option value="">Choose a student...</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} ({student.branch} - Section {student.section})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedBook || !selectedStudent}
              className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Borrow Book'}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ArrowLeft className="w-5 h-5 text-slate-900" />
            <h3 className="text-lg font-semibold text-slate-900">Currently Borrowed</h3>
          </div>

          {borrowingStudents.length === 0 ? (
            <p className="text-slate-500 text-sm">No books are currently borrowed.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {borrowingStudents.map((student) => (
                <div key={student.id} className="bg-white p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-600">
                        {student.branch} - Section {student.section}
                      </p>
                    </div>
                    <button
                      onClick={() => handleReturn(student.id)}
                      disabled={loading}
                      className="px-3 py-1 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Return
                    </button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-sm text-slate-700">{student.borrowed_book_name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-slate-500">
                        Borrowed: {student.borrowed_date}
                      </p>
                      <p className="text-xs font-medium text-slate-900">
                        {student.days_borrowed} days
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
