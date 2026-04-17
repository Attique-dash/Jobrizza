-- Jobrizza Waitlist Table Setup
-- Run this in your Supabase SQL Editor to create the waitlist table

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    user_type VARCHAR(50) DEFAULT 'candidate' CHECK (user_type IN ('candidate', 'company')),
    company_name VARCHAR(255),
    company_size VARCHAR(50),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    referrer VARCHAR(500),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_type ON waitlist(user_type);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at DESC);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow anyone to insert (for public signup form)
CREATE POLICY IF NOT EXISTS "Allow public insert" ON waitlist
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow users to view their own entry
CREATE POLICY IF NOT EXISTS "Allow users to view own entry" ON waitlist
    FOR SELECT TO authenticated
    USING (email = auth.jwt()->>'email');

-- Allow service role full access
CREATE POLICY IF NOT EXISTS "Allow service role full access" ON waitlist
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE waitlist IS 'Stores waitlist entries for early access requests';
COMMENT ON COLUMN waitlist.email IS 'Unique email address of the waitlist entry';
COMMENT ON COLUMN waitlist.user_type IS 'Type of user: candidate or company';
COMMENT ON COLUMN waitlist.status IS 'Current status: pending, approved, rejected, or converted';
