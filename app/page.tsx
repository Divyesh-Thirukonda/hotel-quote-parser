'use client';

import { useState } from 'react';
import QuoteUploader from '@/components/QuoteUploader';
import ParsedResults from '@/components/ParsedResults';
import QuoteHistory from '@/components/QuoteHistory';

export default function Home() {
  const [parseResult, setParseResult] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleParseComplete = (result: any) => {
    setParseResult(result);
  };

  const handleNewParse = () => {
    setParseResult(null);
    setShowHistory(false);
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Hero Header */}
        <header className="text-center mb-16 animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-black text-black-600 mb-4 tracking-tight leading-tight">
            Hotel Quote Parser
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto">
            Extract financial data from hotel quotes
          </p>
        </header>

        {/* Quick Stats (if we have a result) */}
        {parseResult && !showHistory && (
          <div className="mb-8 animate-slide-up">
            <ParsedResults result={parseResult} onNewParse={handleNewParse} />
          </div>
        )}

        {/* Main Content */}
        {!parseResult && !showHistory && (
          <div className="animate-fade-in">
            <QuoteUploader onParseComplete={handleParseComplete} />
          </div>
        )}

        {/* History View */}
        {showHistory && (
          <div className="animate-fade-in">
            <QuoteHistory />
          </div>
        )}

        {/* Bottom Navigation */}
        <nav className="mt-12 flex gap-4 justify-center">
          <button
            onClick={() => {
              setShowHistory(false);
              if (parseResult) setParseResult(null);
            }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${!showHistory
              ? 'btn-primary'
              : 'btn-secondary'
              }`}
          >
            New Quote
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${showHistory
              ? 'btn-primary'
              : 'btn-secondary'
              }`}
          >
            History
          </button>
        </nav>

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-400 text-sm">
          <p>Powered by OpenAI GPT-4 • Built with Next.js & Supabase</p>
        </footer>
      </div>
    </main>
  );
}
