/*
  # Sales Management System Schema

  1. New Tables
    - `sales`
      - `id` (uuid, primary key) - Unique identifier for each sale
      - `customer_name` (text) - Customer's full name
      - `phone` (text) - Customer phone in format XXXX-XXXX
      - `course` (text) - Course or workshop name
      - `enrollment_date` (date) - Date of enrollment
      - `amount` (numeric) - Sale amount in colones
      - `campaign_name` (text) - Name of the advertising campaign
      - `image_video_name` (text) - Name of the image/video ad
      - `seller` (text) - Salesperson name
      - `sale_type` (text) - Auto-calculated: INGRESO CURSO or INGRESO TALLER
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

    - `advertising_expenses`
      - `id` (uuid, primary key) - Unique identifier
      - `campaign_name` (text) - Campaign name
      - `week_number` (integer) - Week number (1-22)
      - `year` (integer) - Year
      - `day_1` through `day_7` (numeric) - Daily expenses
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

    - `week_periods`
      - `id` (uuid, primary key) - Unique identifier
      - `week_number` (integer) - Week number (1-22)
      - `year` (integer) - Year
      - `start_date` (date) - Week start date
      - `end_date` (date) - Week end date

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since no auth is required for this system)
*/

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  course text NOT NULL,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  campaign_name text,
  image_video_name text,
  seller text NOT NULL,
  sale_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create advertising expenses table
CREATE TABLE IF NOT EXISTS advertising_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name text NOT NULL,
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  day_1 numeric(12, 2) DEFAULT 0,
  day_2 numeric(12, 2) DEFAULT 0,
  day_3 numeric(12, 2) DEFAULT 0,
  day_4 numeric(12, 2) DEFAULT 0,
  day_5 numeric(12, 2) DEFAULT 0,
  day_6 numeric(12, 2) DEFAULT 0,
  day_7 numeric(12, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(campaign_name, week_number, year)
);

-- Create week periods table for the 22 weeks (August - December)
CREATE TABLE IF NOT EXISTS week_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  year integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  UNIQUE(week_number, year)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_enrollment_date ON sales(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(seller);
CREATE INDEX IF NOT EXISTS idx_sales_course ON sales(course);
CREATE INDEX IF NOT EXISTS idx_sales_image_video ON sales(image_video_name);
CREATE INDEX IF NOT EXISTS idx_sales_sale_type ON sales(sale_type);
CREATE INDEX IF NOT EXISTS idx_expenses_week ON advertising_expenses(week_number, year);

-- Enable RLS
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertising_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_periods ENABLE ROW LEVEL SECURITY;

-- Create policies for sales table (allowing all operations with anon key for this internal tool)
CREATE POLICY "Allow select on sales"
  ON sales FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow insert on sales"
  ON sales FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow update on sales"
  ON sales FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete on sales"
  ON sales FOR DELETE
  TO anon
  USING (true);

-- Create policies for advertising_expenses table
CREATE POLICY "Allow select on advertising_expenses"
  ON advertising_expenses FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow insert on advertising_expenses"
  ON advertising_expenses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow update on advertising_expenses"
  ON advertising_expenses FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete on advertising_expenses"
  ON advertising_expenses FOR DELETE
  TO anon
  USING (true);

-- Create policies for week_periods table
CREATE POLICY "Allow select on week_periods"
  ON week_periods FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow insert on week_periods"
  ON week_periods FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow update on week_periods"
  ON week_periods FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert the 22 week periods for 2025 (August 1 - December 31)
INSERT INTO week_periods (week_number, year, start_date, end_date) VALUES
  (1, 2025, '2025-08-01', '2025-08-07'),
  (2, 2025, '2025-08-08', '2025-08-14'),
  (3, 2025, '2025-08-15', '2025-08-21'),
  (4, 2025, '2025-08-22', '2025-08-28'),
  (5, 2025, '2025-08-29', '2025-09-04'),
  (6, 2025, '2025-09-05', '2025-09-11'),
  (7, 2025, '2025-09-12', '2025-09-18'),
  (8, 2025, '2025-09-19', '2025-09-25'),
  (9, 2025, '2025-09-26', '2025-10-02'),
  (10, 2025, '2025-10-03', '2025-10-09'),
  (11, 2025, '2025-10-10', '2025-10-16'),
  (12, 2025, '2025-10-17', '2025-10-23'),
  (13, 2025, '2025-10-24', '2025-10-30'),
  (14, 2025, '2025-10-31', '2025-11-06'),
  (15, 2025, '2025-11-07', '2025-11-13'),
  (16, 2025, '2025-11-14', '2025-11-20'),
  (17, 2025, '2025-11-21', '2025-11-27'),
  (18, 2025, '2025-11-28', '2025-12-04'),
  (19, 2025, '2025-12-05', '2025-12-11'),
  (20, 2025, '2025-12-12', '2025-12-18'),
  (21, 2025, '2025-12-19', '2025-12-25'),
  (22, 2025, '2025-12-26', '2025-12-31')
ON CONFLICT (week_number, year) DO NOTHING;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON advertising_expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON advertising_expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();