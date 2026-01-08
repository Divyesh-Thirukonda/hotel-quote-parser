import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (use with caution)
export const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Database types
export interface Quote {
    id: string;
    created_at: string;
    original_content: string;
    content_type: 'html' | 'text' | 'pdf' | 'image' | 'file';
    total_quote: number | null;
    guestroom_total: number | null;
    meeting_room_total: number | null;
    food_beverage_total: number | null;
    hotel_name: string | null;
    check_in_date: string | null;
    check_out_date: string | null;
    number_of_rooms: number | null;
    number_of_guests: number | null;
    extracted_data: any;
    parsing_status: 'pending' | 'processing' | 'success' | 'failed';
    error_message: string | null;
    file_name: string | null;
    file_size: number | null;
}
