'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';

interface QuoteUploaderProps {
    onParseComplete: (result: any) => void;
}

export default function QuoteUploader({ onParseComplete }: QuoteUploaderProps) {
    const [pastedContent, setPastedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            const file = acceptedFiles[0];
            setIsLoading(true);
            setError(null);

            try {
                console.log('Uploader: Starting file upload process', { fileName: file.name, fileSize: file.size });

                // 1. Upload to Supabase Storage
                const timestamp = Date.now();
                // Sanitize filename to avoid issues
                const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const filePath = `${timestamp}_${cleanFileName}`;

                console.log('Uploader: Uploading to Supabase Storage...', filePath);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('quotes')
                    .upload(filePath, file);

                if (uploadError) {
                    console.error('Uploader: Storage upload failed', uploadError);
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                console.log('Uploader: Storage upload successful, sending to API...');

                // 2. Send file path to API for processing
                const response = await fetch('/api/parse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        filePath,
                        fileType: file.type,
                        fileName: file.name
                    }),
                });

                console.log('Uploader: API Response status', response.status);

                if (!response.ok) {
                    const text = await response.text();
                    try {
                        const jsonError = JSON.parse(text);
                        throw new Error(jsonError.error || `Server error: ${response.status}`);
                    } catch (e) {
                        throw new Error(`Processing failed: ${response.status} ${response.statusText}`);
                    }
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to parse quote');
                }

                onParseComplete(result);
            } catch (err: any) {
                console.error('Uploader: Error during process', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        },
        [onParseComplete]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'text/plain': ['.txt'],
            'text/html': ['.html', '.htm'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        maxFiles: 1,
        disabled: isLoading,
    });

    const handlePastedSubmit = async () => {
        if (!pastedContent.trim()) {
            setError('Please paste some content');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/parse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: pastedContent,
                    contentType: 'text',
                }),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to parse quote');
            }

            onParseComplete(result);
            setPastedContent('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div
                {...getRootProps()}
                className={`glass-card p-12 text-center cursor-pointer transition-all ${isDragActive
                    ? 'border-slate-500 bg-slate-50 scale-105'
                    : 'border-slate-200 hover:border-slate-400 hover:shadow-lg'
                    } ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="space-y-4">
                    <div className="text-6xl text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mx-auto">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                            {isLoading ? (
                                <span className="loading-dots">Analyzing your quote</span>
                            ) : isDragActive ? (
                                'Drop to upload'
                            ) : (
                                'Drop your hotel quote here'
                            )}
                        </h3>
                        <p className="text-slate-500">
                            {isLoading
                                ? 'This may take a moment'
                                : 'PDF, Images, Word docs - we handle it all'}
                        </p>
                    </div>
                    {!isLoading && (
                        <button className="btn-primary inline-block">
                            Or browse files
                        </button>
                    )}
                </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                <span className="text-gray-400 font-medium">or paste text</span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            <div className="glass-card p-6 space-y-4">
                <label className="block">
                    <span className="text-gray-700 font-bold mb-3 block text-lg">
                        Or paste text
                    </span>
                    <textarea
                        value={pastedContent}
                        onChange={(e) => setPastedContent(e.target.value)}
                        placeholder="Paste hotel quote text here...

Example:
Grand Plaza Hotel
Event Quote #12345

GUESTROOM ACCOMMODATIONS:
75 Standard King Rooms @ $189.00 per night
Guestroom Subtotal: $32,460.75

MEETING SPACE:
Grand Ballroom = $2,500.00
..."
                        className="w-full h-64 px-5 py-4 rounded-2xl border-2 border-gray-200 focus:border-purple-400 transition-all outline-none resize-none text-gray-800 font-mono text-sm leading-relaxed"
                        disabled={isLoading}
                    />
                </label>

                <button
                    onClick={handlePastedSubmit}
                    disabled={isLoading || !pastedContent.trim()}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </svg>
                            Parsing...
                        </span>
                    ) : (
                        '✓ Parse Quote'
                    )}
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="glass-card p-4 bg-red-50 border-2 border-red-200 animate-fade-in">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">❌</span>
                        <div>
                            <p className="font-bold text-red-800">Oops! Something went wrong</p>
                            <p className="text-sm text-red-600 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
