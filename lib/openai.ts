import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for structured output
const QuoteSchema = z.object({
    total_quote: z.number().nullable().describe('The overall total cost for the entire booking'),
    guestroom_total: z.number().nullable().describe('Total cost for all guestrooms'),
    meeting_room_total: z.number().nullable().describe('Total cost for all meeting/conference rooms'),
    food_beverage_total: z.number().nullable().describe('Total cost for all food and beverage items'),
    hotel_name: z.string().nullable().describe('Name of the hotel'),
    check_in_date: z.string().nullable().describe('Check-in date in ISO format'),
    check_out_date: z.string().nullable().describe('Check-out date in ISO format'),
    number_of_rooms: z.number().nullable().describe('Total number of rooms'),
    number_of_guests: z.number().nullable().describe('Total number of guests'),
    additional_notes: z.string().nullable().describe('Any additional relevant information'),
});

export type ParsedQuote = z.infer<typeof QuoteSchema>;

export async function parseQuoteWithAI(content: string): Promise<ParsedQuote> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
            {
                role: 'system',
                content: `You are an expert at parsing hotel quotes and extracting financial information. 
        
Your task is to extract the following key data points from hotel quote emails:
1. Total Quote - The overall cost for the entire booking
2. Guestroom Total - Total cost for all guestrooms
3. Meeting Room Total - Total cost for all meeting/conference rooms
4. Food and Beverage Total - Total cost for all food and beverage

Also extract any additional relevant information like hotel name, dates, number of rooms, and number of guests.

Rules:
- All monetary amounts should be numbers (e.g., 1234.56, not "$1,234.56")
- If a value cannot be found, return null
- Look for line items, subtotals, and grand totals
- Be smart about categorizing items (e.g., "Continental Breakfast" goes into F&B, "Boardroom Rental" goes into Meeting Room)
- Handle various formats: HTML tables, plain text lists, PDF-like formats
- Extract dates in ISO format (YYYY-MM-DD)

Return your response as a JSON object with these exact keys: total_quote, guestroom_total, meeting_room_total, food_beverage_total, hotel_name, check_in_date, check_out_date, number_of_rooms, number_of_guests, additional_notes`,
            },
            {
                role: 'user',
                content: `Please parse the following hotel quote and extract all relevant financial information:\n\n${content}`,
            },
        ],
        response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
        throw new Error('Failed to parse quote with AI - no response content');
    }

    const parsed = JSON.parse(responseContent);

    // Validate and return
    return QuoteSchema.parse(parsed);
}

// For image-based quotes (OCR)
export async function parseQuoteFromImage(imageUrl: string): Promise<ParsedQuote> {
    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-2024-08-06',
        messages: [
            {
                role: 'system',
                content: `You are an expert at parsing hotel quotes and extracting financial information from images.
        
Extract the following key data points:
1. Total Quote - The overall cost for the entire booking
2. Guestroom Total - Total cost for all guestrooms
3. Meeting Room Total - Total cost for all meeting/conference rooms
4. Food and Beverage Total - Total cost for all food and beverage

Also extract hotel name, dates, number of rooms, and number of guests.

Rules:
- All monetary amounts should be numbers only
- If a value cannot be found, return null
- Be thorough in reading all text in the image

Return your response as a JSON object with these exact keys: total_quote, guestroom_total, meeting_room_total, food_beverage_total, hotel_name, check_in_date, check_out_date, number_of_rooms, number_of_guests, additional_notes`,
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: 'Please parse this hotel quote image and extract all relevant financial information:',
                    },
                    {
                        type: 'image_url',
                        image_url: { url: imageUrl },
                    },
                ],
            },
        ],
        response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
        throw new Error('Failed to parse quote from image - no response content');
    }

    const parsed = JSON.parse(responseContent);
    return QuoteSchema.parse(parsed);
}
