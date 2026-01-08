import { Quote } from '@/lib/supabase';

export const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(value);
};

export const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const exportAsJSON = (quote: Quote) => {
    // Use extracted_data if available, otherwise construct from fields
    const dataToExport = quote.extracted_data || {
        total_quote: quote.total_quote,
        guestroom_total: quote.guestroom_total,
        meeting_room_total: quote.meeting_room_total,
        food_beverage_total: quote.food_beverage_total,
        other_fees_total: null, // explicit null if reconstructing
        hotel_name: quote.hotel_name,
        check_in_date: quote.check_in_date,
        check_out_date: quote.check_out_date,
        number_of_rooms: quote.number_of_rooms,
        number_of_guests: quote.number_of_guests,
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `hotel-quote-${quote.id.substring(0, 8)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

export const exportAsCSV = (quote: Quote) => {
    // extracted_data contains the full parsed object including other_fees_total
    const extracted = quote.extracted_data || {};

    // We prefer top-level fields from the Quote object where possible as they are typed columns,
    // but fall back to extracted_data for non-column fields like other_fees_total.

    const csvRows = [
        ['Field', 'Value'],
        ['Total Quote', formatCurrency(quote.total_quote)],
        ['Guestroom Total', formatCurrency(quote.guestroom_total)],
        ['Meeting Room Total', formatCurrency(quote.meeting_room_total)],
        ['Food & Beverage Total', formatCurrency(quote.food_beverage_total)],
        ['Other Fees Total', formatCurrency(extracted.other_fees_total || 0)],
        ['Hotel Name', quote.hotel_name || 'N/A'],
        ['Check-In', formatDate(quote.check_in_date)],
        ['Check-Out', formatDate(quote.check_out_date)],
        ['Number of Rooms', quote.number_of_rooms || 'N/A'],
        ['Number of Guests', quote.number_of_guests || 'N/A'],
    ];

    const csvContent = csvRows.map((row) => row.join(',')).join('\n');
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `hotel-quote-${quote.id.substring(0, 8)}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};
