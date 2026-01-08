import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client has been moved to lib/supabase-admin.ts to prevent client-side errors

export interface Quote {
    id: string;
    created_at: string;
    original_content: string;
    content_type: 'html' | 'text' | 'pdf' | 'image' | 'file';
    extracted_data: any; // All parsed data stored here
    parsing_status: 'pending' | 'processing' | 'success' | 'failed';
    error_message: string | null;
    file_name: string | null;
    file_size: number | null;
}
