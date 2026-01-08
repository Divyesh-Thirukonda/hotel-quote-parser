'use client';

import { useEffect, useState } from 'react';
import { Quote } from '@/lib/supabase';

export default function QuoteHistory() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
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
            <div className="glass-card p-4">
                <input
                    type="text"
                    placeholder="🔍 Search by hotel name or total..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field"
                />
            </div>

            {/* Quote list */}
            <div className="grid gap-4">
                {filteredQuotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="glass-card-hover p-6 cursor-pointer"
                        onClick={() => setSelectedQuote(selectedQuote?.id === quote.id ? null : quote)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h4 className="text-xl font-bold text-white">
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
                                <p className="text-white/60 text-sm mb-3">
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
                                        <p className="text-white/40 text-xs">Total</p>
                                        <p className="text-white font-semibold">{formatCurrency(quote.total_quote)}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">Guestrooms</p>
                                        <p className="text-white font-semibold">
                                            {formatCurrency(quote.guestroom_total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">Meeting Rooms</p>
                                        <p className="text-white font-semibold">
                                            {formatCurrency(quote.meeting_room_total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-white/40 text-xs">F&B</p>
                                        <p className="text-white font-semibold">
                                            {formatCurrency(quote.food_beverage_total)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteQuote(quote.id);
                                }}
                                className="ml-4 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            >
                                🗑️
                            </button>
                        </div>

                        {/* Expanded details */}
                        {selectedQuote?.id === quote.id && (
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <h5 className="text-sm font-semibold text-white/60 mb-3">Original Content</h5>
                                <div className="bg-white/5 rounded-lg p-4 max-h-64 overflow-auto">
                                    <pre className="text-white/80 text-xs whitespace-pre-wrap font-mono">
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
        </div>
    );
}
