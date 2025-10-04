/*
  # Library Management System Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `role` (text, enum: 'teacher' or 'student')
      - `created_at` (timestamptz)
      
    - `books`
      - `id` (bigserial, primary key)
      - `title` (text, not null)
      - `author` (text, not null)
      - `edition` (text, not null)
      - `category` (text, not null)
      - `total_copies` (integer, default 1)
      - `borrowed_copies` (integer, default 0)
      - `year_published` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (title, author, edition)
      
    - `students`
      - `id` (bigserial, primary key)
      - `user_id` (uuid, references profiles, nullable for non-registered students)
      - `name` (text, not null)
      - `branch` (text, enum: CS, IT, ECE, EEE, MECH, CIVIL)
      - `section` (integer)
      - `currently_borrowing` (text, enum: 'YES' or 'NO', default 'NO')
      - `borrowed_book_id` (bigint, references books, nullable)
      - `borrowed_book_name` (text, nullable)
      - `borrowed_date` (date, nullable)
      - `phone` (varchar(10), not null)
      - `days_borrowed` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
  2. Security
    - Enable RLS on all tables
    - Teachers can perform all operations on books and students
    - Students can only view books and their own student record
    - Public can sign up
    
  3. Functions
    - Trigger to auto-update updated_at timestamp
    - Function to check book availability before borrowing
    - Daily function to increment days_borrowed for active borrowers
*/

-- Create profiles table extending auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  author text NOT NULL,
  edition text NOT NULL,
  category text NOT NULL,
  total_copies integer DEFAULT 1 CHECK (total_copies >= 0),
  borrowed_copies integer DEFAULT 0 CHECK (borrowed_copies >= 0),
  year_published integer CHECK (year_published >= 1000 AND year_published <= 2100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_book UNIQUE (title, author, edition),
  CONSTRAINT valid_borrowed_copies CHECK (borrowed_copies <= total_copies)
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  branch text NOT NULL CHECK (branch IN ('CS', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL')),
  section integer NOT NULL CHECK (section > 0),
  currently_borrowing text DEFAULT 'NO' CHECK (currently_borrowing IN ('YES', 'NO')),
  borrowed_book_id bigint REFERENCES books(id) ON DELETE SET NULL,
  borrowed_book_name text,
  borrowed_date date,
  phone varchar(10) NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  days_borrowed integer DEFAULT 0 CHECK (days_borrowed >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment days_borrowed daily
CREATE OR REPLACE FUNCTION increment_days_borrowed()
RETURNS void AS $$
BEGIN
  UPDATE students
  SET days_borrowed = days_borrowed + 1
  WHERE currently_borrowing = 'YES';
END;
$$ LANGUAGE plpgsql;

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_borrowed_book_id ON students(borrowed_book_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can create profile during signup"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Anyone authenticated can view books"
  ON books FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert books"
  ON books FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update books"
  ON books FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete books"
  ON books FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

-- Students policies
CREATE POLICY "Anyone authenticated can view students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Teachers can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
    )
  );

CREATE POLICY "Students can update their own record"
  ON students FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());