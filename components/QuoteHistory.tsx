'use client';

import { useEffect, useState } from 'react';
import { Quote } from '@/lib/supabase';

export default function QuoteHistory() {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showReasoning, setShowReasoning] = useState(false);

    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchQuotes();
    }, []);

    const handleCopy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

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
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 text-center border border-gray-200/50">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading quote history...</p>
            </div>
        );
    }

    if (quotes.length === 0) {
        return (
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 text-center border border-gray-200/50">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Quotes Yet</h3>
                <p className="text-gray-600">Parse your first hotel quote to see it here!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search bar */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border border-gray-200/50 flex items-center gap-3">
                <span className="text-gray-400 text-xl">🔍</span>
                <input
                    type="text"
                    placeholder="Search by hotel name or total..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 py-3 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 text-base"
                />
            </div>

            {/* Quote list */}
            <div className="grid gap-4">
                {filteredQuotes.map((quote) => (
                    <div
                        key={quote.id}
                        className="bg-white/90 backdrop-blur-md rounded-2xl p-6 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border border-gray-200/50"
                        onClick={() => {
                            if (selectedQuote?.id === quote.id) {
                                setSelectedQuote(null);
                            } else {
                                setSelectedQuote(quote);
                                setShowReasoning(false);
                            }
                        }}
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
                                {/* Reasoning Section - Collapsible (Migrated from Modal) */}
                                {quote.extracted_data?.reasoning && (
                                    <div className="mb-6">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowReasoning(!showReasoning);
                                            }}
                                            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-600 hover:text-amber-700 transition-colors mb-2"
                                        >
                                            <span>🧠</span> Calculation Logic
                                            <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded-full">
                                                {showReasoning ? 'Hide' : 'Show'}
                                            </span>
                                        </button>

                                        {showReasoning && (
                                            <div
                                                className="bg-amber-50 p-4 rounded-xl border border-amber-100 animate-slide-down mb-4"
                                                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
                                            >
                                                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                                    {quote.extracted_data.reasoning}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-3">
                                    <h5 className="text-sm font-semibold text-gray-700">📄 Original Quote Content</h5>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(quote.original_content, quote.id);
                                        }}
                                        className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-purple-50"
                                    >
                                        {copiedId === quote.id ? (
                                            <>
                                                <span>✓</span> Copied!
                                            </>
                                        ) : (
                                            <>
                                                <span>📋</span> Copy Text
                                            </>
                                        )}
                                    </button>
                                </div>
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
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 text-center border border-gray-200/50">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No Results</h3>
                    <p className="text-gray-600">No quotes match your search term</p>
                </div>
            )}
        </div>
    );
}
