import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Users, BarChart3, LogOut, Search, Network } from 'lucide-react';
import { BooksManager } from './BooksManager';
import { StudentsManager } from './StudentsManager';
import { BorrowReturn } from './BorrowReturn';
import { SearchBooks } from '../Search/SearchBooks';
import { GraphView } from '../Graph/GraphView';

type View = 'books' | 'students' | 'borrow' | 'search' | 'graph';

export const TeacherDashboard = () => {
  const { profile, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('books');

  const renderView = () => {
    switch (currentView) {
      case 'books':
        return <BooksManager />;
      case 'students':
        return <StudentsManager />;
      case 'borrow':
        return <BorrowReturn />;
      case 'search':
        return <SearchBooks />;
      case 'graph':
        return <GraphView />;
      default:
        return <BooksManager />;
    }
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
                <p className="text-xs text-slate-600">Teacher: {profile?.username}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
            onClick={() => setCurrentView('students')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              currentView === 'students'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Students</span>
          </button>
          <button
            onClick={() => setCurrentView('borrow')}
            className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              currentView === 'borrow'
                ? 'bg-slate-900 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Borrow</span>
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
