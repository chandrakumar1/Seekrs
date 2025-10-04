import { useState, useEffect } from 'react';
import { Student } from '../../lib/supabase';
import { studentService } from '../../services/studentService';
import { Plus, CreditCard as Edit2, Trash2, CircleUser as UserCircle } from 'lucide-react';
import { StudentForm } from './StudentForm';

export const StudentsManager = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAllStudents();
      setStudents(data);
    } catch (err) {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await studentService.deleteStudent(id);
      await loadStudents();
    } catch (err) {
      alert('Failed to delete student');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingStudent(null);
    loadStudents();
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading students...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Students Directory</h2>
          <p className="text-slate-600 mt-1">Manage student records and borrowing status</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <StudentForm
          student={editingStudent}
          onClose={handleFormClose}
        />
      )}

      {students.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <UserCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No students registered yet.</p>
          <p className="text-sm mt-1">Click "Add Student" to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Branch</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Section</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Phone</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Borrowed Book</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Days</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium">{student.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{student.branch}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{student.section}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{student.phone}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      student.currently_borrowing === 'YES'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {student.currently_borrowing === 'YES' ? 'Borrowing' : 'Available'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {student.borrowed_book_name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {student.currently_borrowing === 'YES' ? student.days_borrowed : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
