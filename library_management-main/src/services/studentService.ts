import { supabase, Student } from '../lib/supabase';

export const studentService = {
  async getAllStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStudentById(id: number): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getStudentByUserId(userId: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async addStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'currently_borrowing' | 'borrowed_book_id' | 'borrowed_book_name' | 'borrowed_date' | 'days_borrowed'>) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        ...student,
        currently_borrowing: 'NO',
        days_borrowed: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStudent(id: number, updates: Partial<Student>) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteStudent(id: number) {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getBorrowingStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('currently_borrowing', 'YES')
      .order('borrowed_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};
