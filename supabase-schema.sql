-- Hotel Quote Parser Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    original_content TEXT NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('html', 'text', 'pdf', 'image', 'file')),
    
    -- Core extracted data points
    total_quote DECIMAL(12, 2),
    guestroom_total DECIMAL(12, 2),
    meeting_room_total DECIMAL(12, 2),
    food_beverage_total DECIMAL(12, 2),
    
    -- Additional extracted information
    hotel_name VARCHAR(255),
    check_in_date DATE,
    check_out_date DATE,
    number_of_rooms INTEGER,
    number_of_guests INTEGER,
    
    -- Full parsed data (stores complete AI extraction)
    extracted_data JSONB,
    
    -- Parsing status
    parsing_status VARCHAR(50) DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'success', 'failed')),
    error_message TEXT,
    
    -- Metadata
    file_name VARCHAR(255),
    file_size INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_parsing_status ON quotes(parsing_status);
CREATE INDEX IF NOT EXISTS idx_quotes_hotel_name ON quotes(hotel_name);

-- Enable Row Level Security (RLS)
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on quotes" ON quotes
    FOR ALL
    USING (true)
    WITH CHECK (true);
