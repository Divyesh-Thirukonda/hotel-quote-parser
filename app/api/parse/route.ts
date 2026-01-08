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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper function to process a single file from storage
async function processFile(fileInfo: { filePath: string; fileName: string; fileType?: string }) {
    const { filePath, fileName, fileType = 'application/octet-stream' } = fileInfo;

    console.log(`API: Processing file ${fileName} from storage`);

    // Download from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
        .storage
        .from('quotes')
        .download(filePath);

    if (downloadError || !fileData) {
        throw new Error(`Failed to download file: ${downloadError?.message || 'File not found'}`);
    }

    const fileSize = fileData.size;
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const fileContentType = getContentTypeFromFilename(fileName);

    let textContent = '';
    let originalContent = '';
    let parsed: any;

    // Process based on file type
    if (fileContentType === 'pdf') {
        textContent = await extractTextFromPDF(buffer);
        originalContent = textContent;
    } else if (fileContentType === 'image') {
        const dataUrl = bufferToDataURL(buffer, fileType);
        originalContent = `[Image file: ${fileName}]`;
        parsed = await parseQuoteFromImage(dataUrl);
    } else if (fileContentType === 'docx') {
        textContent = await extractTextFromDOCX(buffer);
        originalContent = textContent;
    } else {
        textContent = buffer.toString('utf-8');
        originalContent = textContent;
    }

    // Parse with AI if we haven't already (images are parsed above)
    if (!parsed) {
        parsed = await parseQuoteWithAI(textContent);
    }

    // Store in database
    const { data, error } = await supabaseAdmin
        .from('quotes')
        .insert({
            original_content: originalContent,
            content_type: fileContentType,
            extracted_data: parsed,
            parsing_status: 'success',
            file_name: fileName,
            file_size: fileSize,
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }

    return { quote: data, parsed };
}

// Helper function to process single request (file or pasted content)
async function processSingleRequest(body: any) {
    let textContent = '';
    let originalContent = '';
    let fileContentType = 'text';
    let fileName: string | null = null;
    let fileSize: number | null = null;

    // Case 1: File from storage
    if (body.filePath) {
        return await processFile({
            filePath: body.filePath,
            fileName: body.fileName || 'uploaded-file',
            fileType: body.fileType,
        });
    }
    // Case 2: Pasted content
    else if (body.content) {
        originalContent = body.content;
        fileContentType = body.contentType || 'text';

        if (fileContentType === 'html') {
            textContent = stripHTML(body.content);
        } else {
            textContent = body.content;
        }

        // Parse with AI
        const parsed = await parseQuoteWithAI(textContent);

        // Store in database
        const { data, error } = await supabaseAdmin
            .from('quotes')
            .insert({
                original_content: originalContent,
                content_type: fileContentType,
                extracted_data: parsed,
                parsing_status: 'success',
                file_name: fileName,
                file_size: fileSize,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Database error: ${error.message}`);
        }

        return { success: true, quote: data, parsed };
    } else {
        throw new Error('No content or file path provided');
    }
}

export async function POST(request: NextRequest) {
    console.log('API: Parse request received');
    try {
        const contentType = request.headers.get('content-type') || '';

        // Handle JSON body (both single file and batch)
        if (contentType.includes('application/json')) {
            const body = await request.json();

            // Check if this is a batch request
            if (body.batch && Array.isArray(body.batch)) {
                console.log(`API: Batch request detected with ${body.batch.length} files`);

                const results = [];

                // Process each file sequentially to avoid rate limits
                for (const fileInfo of body.batch) {
                    try {
                        const result = await processFile(fileInfo);
                        results.push({
                            success: true,
                            fileName: fileInfo.fileName,
                            ...result,
                        });
                    } catch (error: any) {
                        console.error(`API: Error processing ${fileInfo.fileName}:`, error.message);
                        results.push({
                            success: false,
                            fileName: fileInfo.fileName,
                            error: error.message,
                        });
                    }
                }

                // Check if any succeeded
                const successCount = results.filter(r => r.success).length;

                return NextResponse.json({
                    success: successCount > 0,
                    batch: true,
                    results,
                    summary: {
                        total: results.length,
                        succeeded: successCount,
                        failed: results.length - successCount,
                    },
                });
            }

            // Single file from storage or pasted content
            const result = await processSingleRequest(body);
            return NextResponse.json(result);
        }

        // Fallback: unsupported content type
        return NextResponse.json(
            { error: 'Unsupported content type. Use application/json.' },
            { status: 400 }
        );

    } catch (error: any) {
        console.error('API: Error in parse route:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to process request' },
            { status: 500 }
        );
    }
}
