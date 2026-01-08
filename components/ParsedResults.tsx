'use client';

import { useState } from 'react';
import { Quote } from '@/lib/supabase';
import { formatCurrency, formatDate, exportAsJSON, exportAsCSV } from '@/lib/export-utils';

interface ParsedResultsProps {
    result: any; // Can be single or batch result
    onNewParse: () => void;
}

export default function ParsedResults({ result, onNewParse }: ParsedResultsProps) {
    const [showReasoning, setShowReasoning] = useState<Record<number, boolean>>({});
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    // Determine if batch or single
    const isBatch = result.batch && result.results;
    const items = isBatch
        ? result.results.filter((r: any) => r.success)
        : result.quote ? [{ quote: result.quote, parsed: result.parsed }] : [];

    if (items.length === 0) {
        return (
            <div className="glass-card p-8 border-l-4 border-red-400">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing Failed</h3>
                <p className="text-gray-600">No quotes could be processed.</p>
                <button onClick={onNewParse} className="mt-4 btn-primary">
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-slide-up">
            {/* Batch summary */}
            {isBatch && result.summary && (
                <div className="glass-card p-6 border-l-4 border-emerald-400">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        Batch Processing Complete
                    </h3>
                    <p className="text-gray-600">
                        Successfully parsed {result.summary.succeeded} of {result.summary.total} file(s)
                    </p>
                </div>
            )}

            {/* Render each result */}
            {items.map((item: any, idx: number) => {
                const { quote, parsed } = item;
                const isExpanded = isBatch ? expandedIdx === idx : true;

                return (
                    <div key={idx} className="space-y-4">
                        {/* Batch file header */}
                        {isBatch && (
                            <button
                                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                                className="w-full glass-card p-4 flex items-center justify-between hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📄</span>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">{item.fileName}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatCurrency(parsed.total_quote)}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-2xl text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                            </button>
                        )}

                        {isExpanded && (
                            <>
                                {/* Single file success header */}
                                {!isBatch && (
                                    <div className="glass-card p-6 border-l-4 border-emerald-400">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                            Quote Parsed Successfully
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {quote.hotel_name && `${quote.hotel_name} • `}
                                            Parsed on {new Date(quote.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                {/* Financial data grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Total */}
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
                                        {/* Export buttons for each */}
                                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                            <button onClick={() => exportAsCSV(quote)} className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm">
                                                <span>📊</span> CSV
                                            </button>
                                            <button onClick={() => exportAsJSON(quote)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-sm">
                                                <span>{'{ }'}</span> JSON
                                            </button>
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    {(parsed.guestroom_total || 0) > 0 && (
                                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-1">
                                                🛏️ Guestrooms
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(parsed.guestroom_total)}
                                            </p>
                                        </div>
                                    )}

                                    {(parsed.meeting_room_total || 0) > 0 && (
                                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                                📊 Meeting Rooms
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(parsed.meeting_room_total)}
                                            </p>
                                        </div>
                                    )}

                                    {(parsed.food_beverage_total || 0) > 0 && (
                                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                                🍽️ Food & Beverage
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(parsed.food_beverage_total)}
                                            </p>
                                        </div>
                                    )}

                                    {(parsed.other_fees_total || 0) > 0 && (
                                        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                                            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
                                                🧾 Other Fees
                                            </p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(parsed.other_fees_total)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Additional info */}
                                {(parsed.check_in_date || parsed.check_out_date || parsed.number_of_rooms || parsed.number_of_guests || parsed.reasoning) && (
                                    <div className="bg-white/90 rounded-xl p-6 border border-gray-200">
                                        <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                            <span>📝</span> Additional Details
                                        </h4>

                                        {/* Reasoning */}
                                        {parsed.reasoning && (
                                            <div className="mb-4">
                                                <button
                                                    onClick={() => setShowReasoning(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-600 hover:text-amber-700 transition-colors mb-2"
                                                >
                                                    <span>🧠</span> Calculation Logic
                                                    <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded-full">
                                                        {showReasoning[idx] ? 'Hide' : 'Show'}
                                                    </span>
                                                </button>
                                                {showReasoning[idx] && (
                                                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                                                        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                                                            {parsed.reasoning}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Dates and counts */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            })}

            {/* New Quote button at bottom */}
            <div className="flex justify-center pt-4">
                <button onClick={onNewParse} className="btn-primary px-8 py-3">
                    ✨ Parse More Quotes
                </button>
            </div>
        </div>
    );
}
