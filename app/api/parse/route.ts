import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseQuoteWithAI, parseQuoteFromImage } from '@/lib/openai';
import {
    extractTextFromPDF,
    extractTextFromDOCX,
    stripHTML,
    bufferToDataURL,
    getContentTypeFromFilename,
} from '@/lib/file-processor';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (Server limit)

export async function POST(request: NextRequest) {
    console.log('API: Parse request received');
    try {
        const contentType = request.headers.get('content-type') || '';

        let textContent = '';
        let originalContent = '';
        let fileContentType = 'text';
        let fileName: string | null = null;
        let fileSize: number | null = null;

        // Handle multipart/form-data (direct file upload - legacy/fallback)
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
            fileContentType = getContentTypeFromFilename(fileName || 'file');

            // Process based on file type
            if (fileContentType === 'pdf') {
                textContent = await extractTextFromPDF(buffer);
                originalContent = textContent;
            } else if (fileContentType === 'image') {
                const dataUrl = bufferToDataURL(buffer, file.type);
                originalContent = `[Image file: ${fileName}]`;
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
                        file_name: fileName || 'file',
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
            }
        }
        // Handle JSON body (pasted text OR file path from storage)
        else {
            const body = await request.json();

            // Case 1: File Path provided (New Large File Flow)
            if (body.filePath) {
                console.log('API: Processing file from storage path:', body.filePath);

                fileName = body.fileName || 'uploaded-file';
                const fileType = body.fileType || 'application/octet-stream';

                // Download from Supabase Storage
                const { data: fileData, error: downloadError } = await supabaseAdmin
                    .storage
                    .from('quotes')
                    .download(body.filePath);

                if (downloadError) {
                    console.error('API: Storage download error', downloadError);
                    throw new Error(`Failed to download file from storage: ${downloadError.message}`);
                }

                if (!fileData) {
                    throw new Error('File not found in storage');
                }

                fileSize = fileData.size;
                const buffer = Buffer.from(await fileData.arrayBuffer());
                fileContentType = getContentTypeFromFilename(fileName || 'file');

                console.log('API: File downloaded, size:', fileSize, 'type:', fileContentType);

                // Process based on file type (Unified logic)
                if (fileContentType === 'pdf') {
                    textContent = await extractTextFromPDF(buffer);
                    originalContent = textContent;
                } else if (fileContentType === 'image') {
                    const dataUrl = bufferToDataURL(buffer, fileType);
                    originalContent = `[Image file: ${fileName}]`;

                    // Parse image directly
                    const parsed = await parseQuoteFromImage(dataUrl);

                    // Helper to store and return response (to avoid duplication)
                    // But since we are inside the 'else', we can just return here?
                    // The existing code has specific return for image.

                    // To keep it clean, let's just copy the store logic for image here or use a shared function later.
                    // For now, inline.
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
                            file_name: fileName || 'file',
                            file_size: fileSize,
                        })
                        .select()
                        .single();

                    if (error) throw new Error('Failed to store parsed quote in database');
                    return NextResponse.json({ success: true, quote: data, parsed });
                } else if (fileName && fileName.endsWith('.docx')) {
                    textContent = await extractTextFromDOCX(buffer);
                    originalContent = textContent;
                } else {
                    textContent = buffer.toString('utf-8');
                    originalContent = textContent;
                }

                // Allow flow to continue to 'parseQuoteWithAI' at the bottom
            }
            // Case 2: Pasted Content
            else if (body.content) {
                originalContent = body.content;
                fileContentType = body.contentType || 'text';

                if (fileContentType === 'html') {
                    textContent = stripHTML(body.content);
                } else {
                    textContent = body.content;
                }
            } else {
                return NextResponse.json({ error: 'No content provided' }, { status: 400 });
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
                file_name: fileName || 'pasted-content',
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
