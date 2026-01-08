'use client';

import { useEffect, useState } from 'react';
import { Quote } from '@/lib/supabase';

export default function QuoteHistory() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const response = await fetch('/api/quotes');
            const data = await response.json();
            if (data.success) {
                setQuotes(data.quotes);
            }
        } catch (error) {
            console.error('Failed to fetch quotes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteQuote = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quote?')) return;

        try {
            const response = await fetch(`/api/quotes?id=${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setQuotes((prev) => prev.filter((q) => q.id !== id));
                if (selectedQuote?.id === id) {
                    setSelectedQuote(null);
                }
            }
        } catch (error) {
            console.error('Failed to delete quote:', error);
        }
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const filteredQuotes = quotes.filter((quote) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            quote.hotel_name?.toLowerCase().includes(searchLower) ||
            quote.id.toLowerCase().includes(searchLower) ||
            formatCurrency(quote.total_quote).includes(searchLower)
        );
    });

    if (isLoading) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-white/60">Loading quote history...</p>
            </div>
        );
    }

    if (quotes.length === 0) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Quotes Yet</h3>
                <p className="text-white/60">Parse your first hotel quote to see it here!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search bar */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200/50">
                <input
                    type="text"
                    placeholder="🔍 Search by hotel name or total..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base"
                />
            </div>

            {/* Quote list */}
            <div className="grid gap-4">
                {filteredQuotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="bg-white/90 backdrop-blur-md rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border border-gray-200/50"
                        onClick={() => setSelectedQuote(selectedQuote?.id === quote.id ? null : quote)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-xl font-bold text-gray-900">
                                        {quote.hotel_name || 'Unnamed Hotel'}
                                    </h4>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${quote.parsing_status === 'success'
                                            ? 'bg-green-500/20 text-green-400'
                                            : quote.parsing_status === 'failed'
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}
                                    >
                                        {quote.parsing_status}
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-3">
                                    {new Date(quote.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                    {quote.file_name && ` • ${quote.file_name}`}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium">Total</p>
                                        <p className="text-gray-900 font-bold">{formatCurrency(quote.total_quote)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium">Guestrooms</p>
                                        <p className="text-gray-900 font-bold">
                                            {formatCurrency(quote.guestroom_total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium">Meeting Rooms</p>
                                        <p className="text-gray-900 font-bold">
                                            {formatCurrency(quote.meeting_room_total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs font-medium">F&B</p>
                                        <p className="text-gray-900 font-bold">
                                            {formatCurrency(quote.food_beverage_total)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Action buttons */}
                            <div className="flex gap-2">
                                {quote.parsing_status === 'success' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingQuote(quote);
                                        }}
                                        className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg transition-colors font-medium"
                                    >
                                        👀
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteQuote(quote.id);
                                    }}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>

                        {/* Expanded details */}
                        {selectedQuote?.id === quote.id && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h5 className="text-sm font-semibold text-gray-700 mb-3">📄 Original Quote Content</h5>
                                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto border border-gray-200">
                                    <pre className="text-gray-700 text-xs whitespace-pre-wrap font-mono leading-relaxed">
                                        {quote.original_content.substring(0, 1000)}
                                        {quote.original_content.length > 1000 && '...'}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredQuotes.length === 0 && searchTerm && (
                <div className="glass-card p-12 text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Results</h3>
                    <p className="text-white/60">No quotes match your search term</p>
                </div>
            )}

            {/* Hotel Profile Modal */}
            {viewingQuote && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setViewingQuote(null)}
                >
                    <div
                        className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900">
                                    {viewingQuote.hotel_name || 'Unnamed Hotel'}
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    {new Date(viewingQuote.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingQuote(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold transition-colors"
                            >
                                ✕ Close
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-8">
                            {/* Total Quote - Giant Gradient */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200/50 gentle-glow">
                                <p className="text-sm font-semibold text-gray-600 mb-2">TOTAL QUOTE</p>
                                <p className="text-6xl font-black gradient-text">
                                    {formatCurrency(viewingQuote.total_quote)}
                                </p>
                            </div>

                            {/* Category Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Guestrooms */}
                                <div className="category-rooms bg-white/90 rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🛏️</span>
                                        <p className="text-sm font-semibold text-gray-600">GUESTROOMS</p>
                                    </div>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {formatCurrency(viewingQuote.guestroom_total)}
                                    </p>
                                </div>

                                {/* Meeting Rooms */}
                                <div className="category-meeting bg-white/90 rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">📊</span>
                                        <p className="text-sm font-semibold text-gray-600">MEETING ROOMS</p>
                                    </div>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {formatCurrency(viewingQuote.meeting_room_total)}
                                    </p>
                                </div>

                                {/* Food & Beverage */}
                                <div className="category-food bg-white/90 rounded-2xl p-6 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🍽️</span>
                                        <p className="text-sm font-semibold text-gray-600">FOOD & BEVERAGE</p>
                                    </div>
                                    <p className="text-3xl font-bold text-pink-600">
                                        {formatCurrency(viewingQuote.food_beverage_total)}
                                    </p>
                                </div>
                            </div>

                            {/* Original Content */}
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-3">📄 Original Quote Content</h3>
                                <div className="bg-gray-50 rounded-xl p-6 max-h-96 overflow-auto border border-gray-200">
                                    <pre className="text-gray-700 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                        {viewingQuote.original_content}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
