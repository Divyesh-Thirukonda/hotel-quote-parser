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
    // All data is now in extracted_data
    const dataToExport = quote.extracted_data || {};

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `hotel-quote-${quote.id.substring(0, 8)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};

export const exportAsCSV = (quote: Quote) => {
    // All data is now in extracted_data
    const data = quote.extracted_data || {};

    const csvRows = [
        ['Field', 'Value'],
        ['Total Quote', formatCurrency(data.total_quote)],
        ['Guestroom Total', formatCurrency(data.guestroom_total)],
        ['Meeting Room Total', formatCurrency(data.meeting_room_total)],
        ['Food & Beverage Total', formatCurrency(data.food_beverage_total)],
        ['Other Fees Total', formatCurrency(data.other_fees_total || 0)],
        ['Hotel Name', data.hotel_name || 'N/A'],
        ['Check-In', formatDate(data.check_in_date)],
        ['Check-Out', formatDate(data.check_out_date)],
        ['Number of Rooms', data.number_of_rooms || 'N/A'],
        ['Number of Guests', data.number_of_guests || 'N/A'],
    ];

    // Wrap each value in quotes to handle commas in formatted currency
    const csvContent = csvRows
        .map((row) => row.map(val => `"${val}"`).join(','))
        .join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `hotel-quote-${quote.id.substring(0, 8)}.csv`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
};
