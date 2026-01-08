import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseQuoteWithAI, parseQuoteFromImage } from '@/lib/openai';
import {
    extractTextFromPDF,
    extractTextFromDOCX,
    stripHTML,
    bufferToDataURL,
    getContentTypeFromFilename,
} from '@/lib/file-processor';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        let textContent = '';
        let originalContent = '';
        let fileContentType = 'text';
        let fileName: string | null = null;
        let fileSize: number | null = null;

        // Handle multipart/form-data (file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json(
                    { error: 'No file provided' },
                    { status: 400 }
                );
            }

            fileName = file.name;
            fileSize = file.size;

            if (fileSize > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: 'File size exceeds 10MB limit' },
                    { status: 400 }
                );
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            fileContentType = getContentTypeFromFilename(fileName);

            // Process based on file type
            if (fileContentType === 'pdf') {
                textContent = await extractTextFromPDF(buffer);
                originalContent = textContent;
            } else if (fileContentType === 'image') {
                // For images, we'll use GPT-4 Vision
                const dataUrl = bufferToDataURL(buffer, file.type);
                originalContent = `[Image file: ${fileName}]`;

                // Parse directly from image
                const parsed = await parseQuoteFromImage(dataUrl);

                // Store in database
                const { data, error } = await supabaseAdmin
                    .from('quotes')
                    .insert({
                        original_content: originalContent,
                        content_type: fileContentType,
                        total_quote: parsed.total_quote,
                        guestroom_total: parsed.guestroom_total,
                        meeting_room_total: parsed.meeting_room_total,
                        food_beverage_total: parsed.food_beverage_total,
                        hotel_name: parsed.hotel_name,
                        check_in_date: parsed.check_in_date,
                        check_out_date: parsed.check_out_date,
                        number_of_rooms: parsed.number_of_rooms,
                        number_of_guests: parsed.number_of_guests,
                        extracted_data: parsed,
                        parsing_status: 'success',
                        file_name: fileName,
                        file_size: fileSize,
                    })
                    .select()
                    .single();

                if (error) {
                    console.error('Database error:', error);
                    throw new Error('Failed to store parsed quote in database');
                }

                return NextResponse.json({
                    success: true,
                    quote: data,
                    parsed,
                });
            } else if (fileName.endsWith('.docx')) {
                textContent = await extractTextFromDOCX(buffer);
                originalContent = textContent;
            } else {
                // Treat as text
                textContent = buffer.toString('utf-8');
                originalContent = textContent;
            }
        } else {
            // Handle JSON body (pasted text/HTML)
            const body = await request.json();

            if (!body.content) {
                return NextResponse.json(
                    { error: 'No content provided' },
                    { status: 400 }
                );
            }

            originalContent = body.content;
            fileContentType = body.contentType || 'text';

            // If HTML, strip tags to get plain text
            if (fileContentType === 'html') {
                textContent = stripHTML(body.content);
            } else {
                textContent = body.content;
            }
        }

        // Parse the text content with AI
        const parsed = await parseQuoteWithAI(textContent);

        // Store in database
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .insert({
                original_content: originalContent,
                content_type: fileContentType,
                total_quote: parsed.total_quote,
                guestroom_total: parsed.guestroom_total,
                meeting_room_total: parsed.meeting_room_total,
                food_beverage_total: parsed.food_beverage_total,
                hotel_name: parsed.hotel_name,
                check_in_date: parsed.check_in_date,
                check_out_date: parsed.check_out_date,
                number_of_rooms: parsed.number_of_rooms,
                number_of_guests: parsed.number_of_guests,
                extracted_data: parsed,
                parsing_status: 'success',
                file_name: fileName,
                file_size: fileSize,
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            throw new Error('Failed to store parsed quote in database');
        }

        return NextResponse.json({
            success: true,
            quote: data,
            parsed,
        });
    } catch (error: any) {
        console.error('Parse error:', error);

        // Store failed parse in database
        try {
            await supabaseAdmin.from('quotes').insert({
                original_content: '',
                content_type: 'text',
                parsing_status: 'failed',
                error_message: error.message,
            });
        } catch (dbError) {
            console.error('Failed to store error in database:', dbError);
        }

        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to parse quote'
            },
            { status: 500 }
        );
    }
}
