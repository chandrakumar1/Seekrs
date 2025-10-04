import { useState } from 'react';
import { Book } from '../../lib/supabase';
import { bookService } from '../../services/bookService';
import { Search, Download, X } from 'lucide-react';

export const SearchBooks = () => {
  const [filters, setFilters] = useState({
    title: '',
    author: '',
    category: '',
    year: '',
    availableOnly: false,
  });
  const [results, setResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setHasSearched(true);

    try {
      const searchFilters = {
        title: filters.title || undefined,
        author: filters.author || undefined,
        category: filters.category || undefined,
        year: filters.year ? parseInt(filters.year) : undefined,
        availableOnly: filters.availableOnly,
      };

      const data = await bookService.searchBooks(searchFilters);
      setResults(data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  const handleReset = () => {
    setFilters({
      title: '',
      author: '',
      category: '',
      year: '',
      availableOnly: false,
    });
    setResults([]);
    setHasSearched(false);
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Title', 'Author', 'Edition', 'Category', 'Year', 'Total Copies', 'Borrowed', 'Available'];
    const rows = results.map(book => [
      book.title,
      book.author,
      book.edition,
      book.category,
      book.year_published,
      book.total_copies,
      book.borrowed_copies,
      bookService.getAvailableCopies(book),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `library-books-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Advanced Search</h2>
        <p className="text-slate-600 mt-1">Search books with multiple filters</p>
      </div>

      <form onSubmit={handleSearch} className="bg-slate-50 rounded-lg p-6 mb-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={filters.title}
              onChange={(e) => setFilters({ ...filters, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="Search by title..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Author
            </label>
            <input
              type="text"
              value={filters.author}
              onChange={(e) => setFilters({ ...filters, author: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="Search by author..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category
            </label>
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="Search by category..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Year Published
            </label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              placeholder="e.g., 2023"
              min="1000"
              max="2100"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Available only</span>
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={searching}
            className="flex items-center space-x-2 bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{searching ? 'Searching...' : 'Search'}</span>
          </button>
          {hasSearched && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center space-x-2 bg-slate-200 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </form>

      {hasSearched && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-700">
              <strong>{results.length}</strong> book{results.length !== 1 ? 's' : ''} found
            </p>
            {results.length > 0 && (
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No books match your search criteria.</p>
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
                    <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {results.map((book) => {
                    const available = bookService.getAvailableCopies(book);
                    return (
                      <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">{book.title}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{book.author}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{book.edition}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{book.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{book.year_published}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            available > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {available} of {book.total_copies}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
