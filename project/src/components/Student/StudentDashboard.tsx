import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Book, Student } from '../../lib/supabase';
import { bookService } from '../../services/bookService';
import { studentService } from '../../services/studentService';
import { BookOpen, LogOut, Search, Network } from 'lucide-react';
import { SearchBooks } from '../Search/SearchBooks';
import { GraphView } from '../Graph/GraphView';

type View = 'books' | 'search' | 'graph';

export const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('books');

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    try {
      setLoading(true);
      const booksData = await bookService.getAllBooks();
      setBooks(booksData);

      if (profile?.id) {
        const student = await studentService.getStudentByUserId(profile.id);
        setStudentInfo(student);
      }
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'books':
        return renderBooksView();
      case 'search':
        return <SearchBooks />;
      case 'graph':
        return <GraphView />;
      default:
        return renderBooksView();
    }
  };

  const renderBooksView = () => {
    if (loading) {
      return <div className="text-center py-8 text-slate-600">Loading books...</div>;
    }

    return (
      <div>
        {studentInfo && studentInfo.currently_borrowing === 'YES' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Currently Borrowed</h3>
            <p className="text-yellow-700 text-sm">
              <strong>Book:</strong> {studentInfo.borrowed_book_name}
            </p>
            <p className="text-yellow-700 text-sm">
              <strong>Since:</strong> {studentInfo.borrowed_date} ({studentInfo.days_borrowed} days)
            </p>
          </div>
        )}

        <h3 className="text-xl font-semibold text-slate-900 mb-4">Available Books</h3>

        {books.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No books available in the library.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => {
              const available = bookService.getAvailableCopies(book);
              return (
                <div key={book.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                  <h4 className="font-semibold text-slate-900 mb-2">{book.title}</h4>
                  <div className="space-y-1 text-sm text-slate-700">
                    <p><strong>Author:</strong> {book.author}</p>
                    <p><strong>Edition:</strong> {book.edition}</p>
                    <p><strong>Category:</strong> {book.category}</p>
                    <p><strong>Year:</strong> {book.year_published}</p>
                    <div className="pt-2 mt-2 border-t border-slate-300">
                      <p className="flex justify-between items-center">
                        <span><strong>Available:</strong></span>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {available} of {book.total_copies}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-slate-900" />
              <div>
                <h1 className="text-xl font-bold text-slate-900">Library Management</h1>
                <p className="text-xs text-slate-600">Student: {profile?.username}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => setCurrentView('books')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              currentView === 'books'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Books</span>
          </button>
          <button
            onClick={() => setCurrentView('search')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              currentView === 'search'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setCurrentView('graph')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              currentView === 'graph'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Network className="w-5 h-5" />
            <span>Graph</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {renderView()}
        </div>
      </div>
    </div>
  );
};
