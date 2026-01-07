'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface GameStateLoaderProps {
  onLoad: (json: string) => void;
  onLoadMock: (name: 'early' | 'mid' | 'late') => void;
  error?: string | null;
  className?: string;
}

/**
 * Component for loading game state from JSON or mock data
 */
export function GameStateLoader({
  onLoad,
  onLoadMock,
  error,
  className,
}: GameStateLoaderProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleLoad = () => {
    if (jsonInput.trim()) {
      onLoad(jsonInput);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJsonInput(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-lg overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-gray-700">Load Game State</h3>
        <button className="text-gray-400 hover:text-gray-600">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Quick Load Mock States */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Quick Load (Mock Data)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onLoadMock('early')}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Early Game
              </button>
              <button
                onClick={() => onLoadMock('mid')}
                className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Mid Game
              </button>
              <button
                onClick={() => onLoadMock('late')}
                className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                Late Game
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* JSON Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-600">
                Paste GameState JSON
              </label>
              <button
                onClick={handlePaste}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Paste from clipboard
              </button>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"hand": [...], "deck": {...}, ...}'
              className={cn(
                'w-full h-32 px-3 py-2 text-sm font-mono',
                'border rounded-lg resize-none',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                error ? 'border-red-300' : 'border-gray-300'
              )}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {/* Load Button */}
          <button
            onClick={handleLoad}
            disabled={!jsonInput.trim()}
            className={cn(
              'w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              jsonInput.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            Load JSON
          </button>

          {/* Help Text */}
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Expected Format:</p>
            <p className="font-mono text-[10px] text-gray-400">
              {`{ hand: CardInstance[], deck: DeckState, discard: CardInstance[], ... }`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline loader for switching states
 */
export function GameStateLoaderInline({
  onLoadMock,
  onClear,
  hasState,
  className,
}: {
  onLoadMock: (name: 'early' | 'mid' | 'late') => void;
  onClear: () => void;
  hasState: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-gray-500">Load:</span>
      <button
        onClick={() => onLoadMock('early')}
        className="text-xs text-blue-600 hover:underline"
      >
        Early
      </button>
      <button
        onClick={() => onLoadMock('mid')}
        className="text-xs text-green-600 hover:underline"
      >
        Mid
      </button>
      <button
        onClick={() => onLoadMock('late')}
        className="text-xs text-orange-600 hover:underline"
      >
        Late
      </button>
      {hasState && (
        <>
          <span className="text-gray-300">|</span>
          <button
            onClick={onClear}
            className="text-xs text-red-600 hover:underline"
          >
            Clear
          </button>
        </>
      )}
    </div>
  );
}
