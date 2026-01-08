import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Zod schema for structured output
const QuoteSchema = z.object({
    reasoning: z.string().describe('Step-by-step logic used to calculate the totals. Explain your math here.'),
    total_quote: z.number().nullable().describe('The overall total cost for the entire booking'),
    guestroom_total: z.number().nullable().describe('Total cost for all guestrooms'),
    meeting_room_total: z.number().nullable().describe('Total cost for all meeting/conference rooms'),
    food_beverage_total: z.number().nullable().describe('Total cost for all food and beverage items'),
    other_fees_total: z.number().nullable().describe('Total cost for any other miscellaneous items (resort fees, parking, AV, admin fees, etc.) not included in the above categories.'),
    hotel_name: z.string().nullable().describe('Name of the hotel'),
    check_in_date: z.string().nullable().describe('Check-in date in ISO format'),
    check_out_date: z.string().nullable().describe('Check-out date in ISO format'),
    number_of_rooms: z.number().nullable().describe('Total number of rooms'),
    number_of_guests: z.number().nullable().describe('Total number of guests'),
    additional_notes: z.string().nullable().describe('Any additional relevant information'),
});

export type ParsedQuote = z.infer<typeof QuoteSchema>;

export async function parseQuoteWithAI(content: string): Promise<ParsedQuote> {
    // @ts-ignore - responses API is experimental in this version
    const response: any = await openai.responses.create({
        model: "gpt-5",
        reasoning: { effort: "high" },
        instructions: `You are an expert at parsing hotel quotes and extracting financial information. 
        
Your task is to extract the following key data points from hotel quote emails:
1. Total Quote - The overall total cost for the entire booking
2. Guestroom Total - Total cost for all guestrooms
3. Meeting Room Total - Total cost for all meeting/conference rooms
4. Food and Beverage Total - Total cost for all food and beverage
5. Other Fees Total - Total cost for any other miscellaneous items (resort fees, parking, AV, admin fees, etc.) not included in the above categories.

Also extract any additional relevant information like hotel name, dates, number of rooms, and number of guests.

CRITICAL RULES:
- **Reasoning First**: Before extracting numbers, you MUST calculate them step-by-step in the 'reasoning' field.
- **Math**: Check specifically for "per night" rates. If a rate is $219/night for 200 rooms for 2 nights, the total is 219 * 200 * 2. Don't miss the multipliers.
- **Minima**: If there is an F&B minimum (e.g. "$52,000++"), use that as the F&B total if no specific items are listed.
- All monetary amounts should be numbers (e.g., 1234.56, not "$1,234.56")
- If a value cannot be found, return null
- Extract dates in ISO format (YYYY-MM-DD)
- Default *_total fields to subtotal lines for each category (including all listed taxes/fees/service charges). Put the computed “all-in estimate” in additional_notes.
- For grand total quote, if it cannot be computed because of missing categories, just return the computed value so far (like if guestroom_total is 100 and meeting_room_total is null, return 100).

Return your response as a JSON object with these exact keys: reasoning, total_quote, guestroom_total, meeting_room_total, food_beverage_total, other_fees_total, hotel_name, check_in_date, check_out_date, number_of_rooms, number_of_guests, additional_notes`,
        input: `Please parse the following hotel quote and extract all relevant financial information:\n\n${content}`,
    });

    // Defensive response handling for experimental API
    let responseContent: string | null = null;

    console.log(response);

    if (response.output_text) {
        responseContent = response.output_text;
    } else if (response.output_parsed) {
        responseContent = JSON.stringify(response.output_parsed);
    } else if (Array.isArray(response.output)) {
        // Try to find text output
        const textItem = response.output.find((item: any) => item.type === 'message' || item.content);
        if (textItem && textItem.content) {
            if (typeof textItem.content === 'string') {
                responseContent = textItem.content;
            } else if (Array.isArray(textItem.content)) {
                // Handle array of content parts
                responseContent = textItem.content
                    .filter((part: any) => part.type === 'text')
                    .map((part: any) => part.text)
                    .join('');
            } else {
                responseContent = JSON.stringify(textItem.content);
            }
        }
    }

    if (!responseContent) {
        console.error('Experimental API Response:', JSON.stringify(response, null, 2));
        throw new Error('Failed to parse quote with AI - no response content found in experimental API');
    }

    // Clean markdown code blocks if present (common in reasoning models)
    responseContent = responseContent.replace(/```json\n?|\n?```/g, '');

    let parsed: any;
    try {
        parsed = JSON.parse(responseContent);
        // Handle array response (common in strict JSON mode or reasoning models returning a list)
        if (Array.isArray(parsed) && parsed.length > 0) {
            parsed = parsed[0];
        }
    } catch (e) {
        // If it's already an object (from the array access earlier), use it directly
        if (typeof responseContent === 'object') {
            parsed = responseContent;
        } else {
            console.error('Failed to parse response content:', responseContent);
            throw new Error('Failed to parse AI response as JSON');
        }
    }

    // Validate and return
    return QuoteSchema.parse(parsed);
}

// For image-based quotes (OCR)
export async function parseQuoteFromImage(imageUrl: string): Promise<ParsedQuote> {
    // @ts-ignore - responses API is experimental in this version
    const response: any = await openai.responses.create({
        model: "gpt-5",
        reasoning: { effort: "high" },
        instructions: `You are an expert at parsing hotel quotes and extracting financial information from images.
        
Extract the following key data points:
1. Total Quote - The overall total cost for the entire booking
2. Guestroom Total - Total cost for all guestrooms
3. Meeting Room Total - Total cost for all meeting/conference rooms
4. Food and Beverage Total - Total cost for all food and beverage
5. Other Fees Total - Total cost for any other miscellaneous items (resort fees, parking, AV, admin fees, etc.) not included in the above categories.

Also extract hotel name, dates, number of rooms, and number of guests.

CRITICAL RULES:
- **Reasoning First**: Before extracting numbers, you MUST calculate them step-by-step in the 'reasoning' field.
- **Math**: Check specifically for "per night" rates. If a rate is $219/night for 200 rooms for 2 nights, the total is 219 * 200 * 2. Don't miss the multipliers.
- **Minima**: If there is an F&B minimum (e.g. "$52,000++"), use that as the F&B total if no specific items are listed.
- All monetary amounts should be numbers only
- If a value cannot be found, return null
- Be thorough in reading all text in the image
- Default *_total fields to subtotal lines for each category (including all listed taxes/fees/service charges). Put the computed “all-in estimate” in additional_notes.

Return your response as a JSON object with these exact keys: reasoning, total_quote, guestroom_total, meeting_room_total, food_beverage_total, other_fees_total, hotel_name, check_in_date, check_out_date, number_of_rooms, number_of_guests, additional_notes`,
        input: [
            {
                type: 'text',
                text: 'Please parse this hotel quote image and extract all relevant financial information:',
            },
            {
                type: 'image_url',
                image_url: { url: imageUrl },
            },
        ],
    });

    // Defensive response handling for experimental API
    let responseContent: string | null = null;

    if (response.output_text) {
        responseContent = response.output_text;
    } else if (response.output_parsed) {
        responseContent = JSON.stringify(response.output_parsed);
    } else if (Array.isArray(response.output)) {
        // Try to find text output
        const textItem = response.output.find((item: any) => item.type === 'message' || item.content);
        if (textItem && textItem.content) {
            if (typeof textItem.content === 'string') {
                responseContent = textItem.content;
            } else if (Array.isArray(textItem.content)) {
                // Handle array of content parts
                responseContent = textItem.content
                    .filter((part: any) => part.type === 'text')
                    .map((part: any) => part.text)
                    .join('');
            } else {
                responseContent = JSON.stringify(textItem.content);
            }
        }
    }

    if (!responseContent) {
        console.error('Experimental API Response (Image):', JSON.stringify(response, null, 2));
        throw new Error('Failed to parse quote from image - no response content found');
    }

    // Clean markdown code blocks
    responseContent = responseContent.replace(/```json\n?|\n?```/g, '');

    let parsed: any;
    try {
        parsed = JSON.parse(responseContent);
        // Handle array response (common in strict JSON mode or reasoning models returning a list)
        if (Array.isArray(parsed) && parsed.length > 0) {
            parsed = parsed[0];
        }
    } catch (e) {
        if (typeof responseContent === 'object') {
            parsed = responseContent;
        } else {
            throw new Error('Failed to parse Image AI response as JSON');
        }
    }

    return QuoteSchema.parse(parsed);
}
