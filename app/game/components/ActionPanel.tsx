'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PendingChoice, ActionLogEntry } from '../hooks/useGameActions';
import { ExecutionMessage } from '@/app/lib/effects/executors';

interface ActionPanelProps {
  isExecuting: boolean;
  pendingChoice: PendingChoice | null;
  lastMessages: ExecutionMessage[];
  actionLog: ActionLogEntry[];
  onDealDamage: (amount: number, target: 'self' | 'opponent') => void;
  onDrawCards: (count: number) => void;
  onApplyStatus: (status: 'paralyzed' | 'asleep' | 'confused' | 'burned' | 'poisoned') => void;
  onHealPokemon: (amount: number) => void;
  onResolveChoice: (selectedIndices: number[]) => void;
  onClearLog: () => void;
  className?: string;
}

/**
 * Panel for testing effect execution with demo actions
 */
export function ActionPanel({
  isExecuting,
  pendingChoice,
  lastMessages,
  actionLog,
  onDealDamage,
  onDrawCards,
  onApplyStatus,
  onHealPokemon,
  onResolveChoice,
  onClearLog,
  className,
}: ActionPanelProps) {
  const [damageAmount, setDamageAmount] = useState(30);
  const [drawCount, setDrawCount] = useState(2);
  const [healAmount, setHealAmount] = useState(20);
  const [selectedChoices, setSelectedChoices] = useState<number[]>([]);

  const toggleChoice = (index: number) => {
    if (!pendingChoice) return;

    const { minSelections, maxSelections } = pendingChoice.request;

    if (selectedChoices.includes(index)) {
      setSelectedChoices(prev => prev.filter(i => i !== index));
    } else if (selectedChoices.length < maxSelections) {
      setSelectedChoices(prev => [...prev, index]);
    }
  };

  const handleConfirmChoice = () => {
    onResolveChoice(selectedChoices);
    setSelectedChoices([]);
  };

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm p-4', className)}>
      <h3 className="font-semibold text-lg mb-4">Action Panel</h3>

      {/* Pending Choice Modal */}
      {pendingChoice && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">
            {pendingChoice.request.message}
          </h4>
          <p className="text-sm text-blue-700 mb-3">
            Select {pendingChoice.request.minSelections === pendingChoice.request.maxSelections
              ? pendingChoice.request.minSelections
              : `${pendingChoice.request.minSelections}-${pendingChoice.request.maxSelections}`
            } option(s)
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {pendingChoice.request.options.map((option, index) => (
              <button
                key={option.id}
                onClick={() => toggleChoice(index)}
                className={cn(
                  'px-3 py-2 rounded border text-sm transition-colors',
                  selectedChoices.includes(index)
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirmChoice}
            disabled={selectedChoices.length < pendingChoice.request.minSelections}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium',
              selectedChoices.length >= pendingChoice.request.minSelections
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            Confirm Selection
          </button>
        </div>
      )}

      {/* Demo Actions */}
      <div className="space-y-4">
        {/* Damage */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-20">Damage:</span>
          <input
            type="number"
            value={damageAmount}
            onChange={(e) => setDamageAmount(Number(e.target.value))}
            className="w-16 px-2 py-1 border rounded text-sm"
            min={0}
            step={10}
          />
          <button
            onClick={() => onDealDamage(damageAmount, 'opponent')}
            disabled={isExecuting}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
          >
            To Opponent
          </button>
          <button
            onClick={() => onDealDamage(damageAmount, 'self')}
            disabled={isExecuting}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            To Self
          </button>
        </div>

        {/* Draw */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-20">Draw:</span>
          <input
            type="number"
            value={drawCount}
            onChange={(e) => setDrawCount(Number(e.target.value))}
            className="w-16 px-2 py-1 border rounded text-sm"
            min={0}
            max={10}
          />
          <button
            onClick={() => onDrawCards(drawCount)}
            disabled={isExecuting}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Draw Cards
          </button>
        </div>

        {/* Heal */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 w-20">Heal:</span>
          <input
            type="number"
            value={healAmount}
            onChange={(e) => setHealAmount(Number(e.target.value))}
            className="w-16 px-2 py-1 border rounded text-sm"
            min={0}
            step={10}
          />
          <button
            onClick={() => onHealPokemon(healAmount)}
            disabled={isExecuting}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            Heal Active
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600 w-20">Status:</span>
          {(['paralyzed', 'asleep', 'confused', 'burned', 'poisoned'] as const).map((status) => (
            <button
              key={status}
              onClick={() => onApplyStatus(status)}
              disabled={isExecuting}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium disabled:opacity-50',
                status === 'paralyzed' && 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300',
                status === 'asleep' && 'bg-purple-200 text-purple-800 hover:bg-purple-300',
                status === 'confused' && 'bg-pink-200 text-pink-800 hover:bg-pink-300',
                status === 'burned' && 'bg-red-200 text-red-800 hover:bg-red-300',
                status === 'poisoned' && 'bg-green-200 text-green-800 hover:bg-green-300'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Last Messages */}
      {lastMessages.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Last Action:</h4>
          <div className="space-y-1">
            {lastMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  msg.type === 'damage' && 'bg-red-50 text-red-700',
                  msg.type === 'heal' && 'bg-green-50 text-green-700',
                  msg.type === 'status' && 'bg-yellow-50 text-yellow-700',
                  msg.type === 'draw' && 'bg-blue-50 text-blue-700',
                  msg.type === 'discard' && 'bg-gray-50 text-gray-700',
                  msg.type === 'knockout' && 'bg-purple-50 text-purple-700',
                  msg.type === 'prize' && 'bg-amber-50 text-amber-700',
                  msg.type === 'info' && 'bg-gray-50 text-gray-600'
                )}
              >
                {msg.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Log */}
      {actionLog.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Action Log ({actionLog.length})</h4>
            <button
              onClick={onClearLog}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {actionLog.slice(-10).reverse().map((entry, i) => (
              <div key={i} className="text-xs text-gray-600">
                Turn {entry.turn}: {entry.action.type}
                {entry.messages[0] && ` - ${entry.messages[0].message}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isExecuting && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Executing...
        </div>
      )}
    </div>
  );
}
