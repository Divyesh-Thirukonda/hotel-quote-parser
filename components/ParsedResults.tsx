'use client';

import { Quote } from '@/lib/supabase';

interface ParsedResultsProps {
    result: {
        quote: Quote;
        parsed: any;
    };
    onNewParse: () => void;
}

export default function ParsedResults({ result, onNewParse }: ParsedResultsProps) {
    const { quote, parsed } = result;

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const exportAsJSON = () => {
        const dataStr = JSON.stringify(parsed, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `hotel-quote-${quote.id}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const exportAsCSV = () => {
        const csvRows = [
            ['Field', 'Value'],
            ['Total Quote', formatCurrency(parsed.total_quote)],
            ['Guestroom Total', formatCurrency(parsed.guestroom_total)],
            ['Meeting Room Total', formatCurrency(parsed.meeting_room_total)],
            ['Food & Beverage Total', formatCurrency(parsed.food_beverage_total)],
            ['Hotel Name', parsed.hotel_name || 'N/A'],
            ['Check-In', formatDate(parsed.check_in_date)],
            ['Check-Out', formatDate(parsed.check_out_date)],
            ['Number of Rooms', parsed.number_of_rooms || 'N/A'],
            ['Number of Guests', parsed.number_of_guests || 'N/A'],
        ];

        const csvContent = csvRows.map((row) => row.join(',')).join('\n');
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const exportFileDefaultName = `hotel-quote-${quote.id}.csv`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Success header */}
            <div className="glass-card p-6 border-l-4 border-emerald-400" style={{ background: 'linear-gradient(to right, rgba(16, 185, 129, 0.08), transparent)' }}>
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">Quote Parsed Successfully</h3>
                    <p className="text-gray-600 text-sm font-medium">
                        {quote.hotel_name && `${quote.hotel_name} • `}
                        Parsed on {new Date(quote.created_at).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Key financial data - Big Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total Quote - Biggest */}
                <div className="md:col-span-2 glass-card category-total p-8 gentle-glow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-600 text-sm font-semibold uppercase tracking-wider mb-3">
                                Total Quote
                            </p>
                            <p className="text-6xl md:text-7xl font-black gradient-text leading-none">
                                {formatCurrency(parsed.total_quote)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Guestroom Total */}
                <div className="glass-card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-xs font-bold uppercase tracking-wide mb-2">
                                🛏️ Guestrooms
                            </p>
                            <p className="text-3xl font-black text-blue-700">
                                {formatCurrency(parsed.guestroom_total)}
                            </p>
                        </div>
                        <div className="text-4xl">🏨</div>
                    </div>
                </div>

                {/* Meeting Room Total */}
                <div className="glass-card category-meeting p-6">
                    <div>
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-3">
                            Meeting Rooms
                        </p>
                        <p className="text-4xl font-bold text-gray-900">
                            {formatCurrency(parsed.meeting_room_total)}
                        </p>
                    </div>
                </div>

                {/* Food & Beverage Total */}
                <div className="md:col-span-2 glass-card category-food p-6">
                    <div>
                        <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-3">
                            Food & Beverage
                        </p>
                        <p className="text-4xl font-bold text-gray-900">
                            {formatCurrency(parsed.food_beverage_total)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Additional information */}
            {(parsed.check_in_date ||
                parsed.check_out_date ||
                parsed.number_of_rooms ||
                parsed.number_of_guests ||
                parsed.additional_notes) && (
                    <div className="glass-card p-6 bg-white/90">
                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span>📝</span> Additional Details
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {parsed.check_in_date && (
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-gray-500 text-xs font-semibold mb-1">Check-In</p>
                                    <p className="text-gray-800 font-bold">{formatDate(parsed.check_in_date)}</p>
                                </div>
                            )}
                            {parsed.check_out_date && (
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-gray-500 text-xs font-semibold mb-1">Check-Out</p>
                                    <p className="text-gray-800 font-bold">{formatDate(parsed.check_out_date)}</p>
                                </div>
                            )}
                            {parsed.number_of_rooms && (
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-gray-500 text-xs font-semibold mb-1">Rooms</p>
                                    <p className="text-gray-800 font-bold">{parsed.number_of_rooms}</p>
                                </div>
                            )}
                            {parsed.number_of_guests && (
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-gray-500 text-xs font-semibold mb-1">Guests</p>
                                    <p className="text-gray-800 font-bold">{parsed.number_of_guests}</p>
                                </div>
                            )}
                        </div>
                        {parsed.additional_notes && (
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-gray-500 text-xs font-semibold mb-2">Notes</p>
                                <p className="text-gray-700 text-sm">{parsed.additional_notes}</p>
                            </div>
                        )}
                    </div>
                )}

        </div>
    );
}
