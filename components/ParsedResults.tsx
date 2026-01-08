'use client';

import { useState } from 'react';
import { Quote } from '@/lib/supabase';
import { formatCurrency, formatDate, exportAsJSON, exportAsCSV } from '@/lib/export-utils';

interface ParsedResultsProps {
    result: {
        quote: Quote;
        parsed: any;
    };
    onNewParse: () => void;
}

export default function ParsedResults({ result, onNewParse }: ParsedResultsProps) {
    const { quote, parsed } = result;
    const [showReasoning, setShowReasoning] = useState(false);

    // No local formatters or export functions needed!

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Quote - Biggest */}
                <div className="md:col-span-2 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                Total Quote
                            </p>
                            <p className="text-4xl font-bold text-gray-900 leading-none">
                                {formatCurrency(parsed.total_quote)}
                            </p>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => exportAsCSV(quote)}
                            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold"
                        >
                            <span>📊</span> Export CSV
                        </button>
                        <button
                            onClick={() => exportAsJSON(quote)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                        >
                            <span>{'{ }'}</span> Export JSON
                        </button>
                        <button
                            onClick={onNewParse}
                            className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span>✨</span> New Quote
                        </button>
                    </div>
                </div>

                {/* Guestroom Total */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">
                                🛏️ Guestrooms
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(parsed.guestroom_total)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Meeting Room Total */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                            📊 Meeting Rooms
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(parsed.meeting_room_total)}
                        </p>
                    </div>
                </div>

                {/* Food & Beverage Total */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                            🍽️ Food & Beverage
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(parsed.food_beverage_total)}
                        </p>
                    </div>
                </div>

                {/* Other Fees Total - Show only if > 0 */}
                {(parsed.other_fees_total || 0) > 0 && (
                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                🧾 Other Fees
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(parsed.other_fees_total)}
                            </p>
                        </div>
                    </div>
                )}
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

                        {/* Reasoning Section - Collapsible */}
                        {parsed.reasoning && (
                            <div className="mb-4">
                                <button
                                    onClick={() => setShowReasoning(!showReasoning)}
                                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-600 hover:text-amber-700 transition-colors mb-2"
                                >
                                    <span>🧠</span> Calculation Logic
                                    <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded-full">
                                        {showReasoning ? 'Hide' : 'Show'}
                                    </span>
                                </button>

                                {showReasoning && (
                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 animate-slide-down">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                            {parsed.reasoning}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

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
