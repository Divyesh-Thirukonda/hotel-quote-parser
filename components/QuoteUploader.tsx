'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabase';
import SnakeGame from './SnakeGame';

interface QuoteUploaderProps {
    onParseComplete: (result: any) => void;
}

export default function QuoteUploader({ onParseComplete }: QuoteUploaderProps) {
    const [pastedContent, setPastedContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ fileName: string; status: 'uploading' | 'processing' | 'done' | 'error' }[]>([]);
    const [showSnakeGame, setShowSnakeGame] = useState(false);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;

            setIsLoading(true);
            setShowSnakeGame(true);
            setError(null);
            setUploadProgress(acceptedFiles.map(f => ({ fileName: f.name, status: 'uploading' })));

            try {
                console.log(`Uploader: Starting batch upload for ${acceptedFiles.length} file(s)`);

                // 1. Upload all files to Supabase Storage in parallel
                const uploadPromises = acceptedFiles.map(async (file) => {
                    const timestamp = Date.now();
                    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const filePath = `${timestamp}_${cleanFileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('quotes')
                        .upload(filePath, file);

                    if (uploadError) {
                        throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
                    }

                    return {
                        filePath,
                        fileType: file.type,
                        fileName: file.name,
                    };
                });

                const uploadResults = await Promise.all(uploadPromises);
                console.log('Uploader: All files uploaded, sending batch to API...');

                // Update progress to processing
                setUploadProgress(prev => prev.map(p => ({ ...p, status: 'processing' })));

                // 2. Send batch request to API
                const response = await fetch('/api/parse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        batch: uploadResults,
                    }),
                });

                if (!response.ok) {
                    const text = await response.text();
                    try {
                        const jsonError = JSON.parse(text);
                        throw new Error(jsonError.error || `Server error: ${response.status}`);
                    } catch (e) {
                        throw new Error(`Processing failed: ${response.status}`);
                    }
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to parse quotes');
                }

                // Update progress to done
                setUploadProgress(prev => prev.map(p => ({ ...p, status: 'done' })));

                onParseComplete(result);
            } catch (err: any) {
                console.error('Uploader: Batch processing error', err);
                setError(err.message);
                setUploadProgress(prev => prev.map(p => ({ ...p, status: 'error' })));
            } finally {
                setIsLoading(false);
                setTimeout(() => setUploadProgress([]), 3000);
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
        multiple: true, // Enable multiple files
        disabled: isLoading,
    });

    const handlePastedSubmit = async () => {
        if (!pastedContent.trim()) {
            setError('Please paste some content');
            return;
        }

        setIsLoading(true);
        setShowSnakeGame(true); // Show Snake game when loading starts
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

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to parse quote');
            }

            onParseComplete(data);
            setPastedContent(''); // Clear the textarea
            setIsLoading(false);
            setShowSnakeGame(false);
        } catch (err: any) {
            console.error('Paste parse error:', err);
            setError(err.message || 'Failed to process content');
            setIsLoading(false);
            setShowSnakeGame(false);
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
                                <span className="loading-dots">Processing your files</span>
                            ) : isDragActive ? (
                                'Drop to upload'
                            ) : (
                                'Drop files here or click to browse'
                            )}
                        </h3>
                        <p className="text-slate-500">
                            {isLoading ? (
                                uploadProgress.length > 0 && (
                                    <span className="text-sm">
                                        Processing {uploadProgress.length} file{uploadProgress.length > 1 ? 's' : ''}...
                                    </span>
                                )
                            ) : (
                                <>Supports PDF, HTML, images, and text files • Multiple files accepted</>
                            )}
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
                        'Parse Quote'
                    )}
                </button>
            </div>


            {/* Snake Game Modal - Show while loading */}
            {showSnakeGame && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="relative">
                        <div className="text-center mb-6">
                            <h3 className="text-3xl font-bold text-white mb-2">
                                While You Wait... 🐍
                            </h3>
                            <p className="text-gray-300">
                                Your files are being parsed by AI
                            </p>
                        </div>
                        <SnakeGame onClose={() => setShowSnakeGame(false)} />
                    </div>
                </div>
            )}


            {/* Error message */}
            {
                error && (
                    <div className="glass-card p-4 bg-red-50 border-2 border-red-200 animate-fade-in">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">❌</span>
                            <div>
                                <p className="font-bold text-red-800">Oops! Something went wrong</p>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
