'use client';

import { useState } from 'react';
import { CardInstance, PokemonState } from '@/app/lib/notation/training-format';
import { cn } from '@/lib/utils';

interface CardDisplayProps {
  card: CardInstance | null;
  pokemonState?: PokemonState | null;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  className?: string;
  showOverlay?: boolean;
}

// Map energy types to colors
const energyColors: Record<string, string> = {
  lightning: 'bg-yellow-400',
  fire: 'bg-red-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  psychic: 'bg-purple-500',
  fighting: 'bg-orange-600',
  darkness: 'bg-gray-800',
  metal: 'bg-gray-400',
  fairy: 'bg-pink-400',
  dragon: 'bg-amber-600',
  colorless: 'bg-gray-300',
  normal: 'bg-gray-300',
  basic: 'bg-gray-200',
};

// Map status conditions to colors and labels
const statusInfo: Record<string, { color: string; label: string }> = {
  paralyzed: { color: 'bg-yellow-500', label: 'PAR' },
  asleep: { color: 'bg-blue-400', label: 'SLP' },
  confused: { color: 'bg-purple-400', label: 'CNF' },
  burned: { color: 'bg-red-600', label: 'BRN' },
  poisoned: { color: 'bg-green-600', label: 'PSN' },
};

const sizeClasses = {
  sm: { card: 'w-16 h-22', text: 'text-[8px]', badge: 'text-[6px] px-0.5' },
  md: { card: 'w-24 h-33', text: 'text-xs', badge: 'text-[8px] px-1' },
  lg: { card: 'w-32 h-44', text: 'text-sm', badge: 'text-[10px] px-1' },
};

/**
 * Display a single card with optional Pokemon state overlay
 */
export function CardDisplay({
  card,
  pokemonState,
  size = 'md',
  faceDown = false,
  className,
  showOverlay = true,
}: CardDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const sizes = sizeClasses[size];

  // Construct image URL (fallback to pokemon-card.com pattern)
  const imageUrl = card
    ? `https://www.pokemon-card.com/assets/images/card_images/large/${card.cardId}.png`
    : null;

  // Handle face-down cards first (works even with null card for opponent's hand)
  if (faceDown) {
    return (
      <div
        className={cn(
          sizes.card,
          'rounded-lg bg-gradient-to-br from-blue-600 to-blue-800',
          'border-2 border-blue-900 shadow-md',
          'flex items-center justify-center',
          className
        )}
      >
        <div className="w-3/4 h-3/4 rounded border-2 border-blue-400/50 bg-blue-700" />
      </div>
    );
  }

  // Handle empty slot
  if (!card) {
    return (
      <div
        className={cn(
          sizes.card,
          'rounded-lg border-2 border-dashed border-gray-300 bg-gray-50',
          'flex items-center justify-center',
          className
        )}
      >
        <span className={cn(sizes.text, 'text-gray-400')}>Empty</span>
      </div>
    );
  }

  return (
    <div className={cn('relative group', className)}>
      {/* Card Image */}
      <div
        className={cn(
          sizes.card,
          'rounded-lg overflow-hidden shadow-md',
          'border border-gray-200 bg-gray-100',
          'transition-transform hover:scale-105'
        )}
      >
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-gradient-to-b from-gray-100 to-gray-200">
            <span className={cn(sizes.text, 'text-gray-700 font-medium text-center')}>
              {card.name}
            </span>
            <span className={cn(sizes.badge, 'text-gray-500 mt-1')}>
              {card.cardId}
            </span>
          </div>
        )}
      </div>

      {/* Overlays for PokemonState */}
      {showOverlay && pokemonState && (
        <>
          {/* Damage Counter */}
          {pokemonState.damage > 0 && (
            <div
              className={cn(
                'absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4',
                'bg-red-600 text-white rounded-full',
                'flex items-center justify-center font-bold shadow-lg',
                size === 'sm' ? 'w-5 h-5 text-[8px]' : size === 'md' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'
              )}
            >
              {pokemonState.damage}
            </div>
          )}

          {/* HP Bar */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0',
              'h-1.5 bg-gray-300 rounded-b-lg overflow-hidden'
            )}
          >
            <div
              className={cn(
                'h-full transition-all',
                pokemonState.hp / pokemonState.maxHp > 0.5
                  ? 'bg-green-500'
                  : pokemonState.hp / pokemonState.maxHp > 0.25
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              )}
              style={{ width: `${(pokemonState.hp / pokemonState.maxHp) * 100}%` }}
            />
          </div>

          {/* Status Condition */}
          {pokemonState.status && (
            <div
              className={cn(
                'absolute top-0 left-0 transform -translate-x-1/4 -translate-y-1/4',
                statusInfo[pokemonState.status.type]?.color || 'bg-gray-500',
                'text-white rounded-full px-1.5 py-0.5 font-bold shadow-lg',
                sizes.badge
              )}
            >
              {statusInfo[pokemonState.status.type]?.label || '???'}
            </div>
          )}

          {/* Attached Energy */}
          {pokemonState.attachedEnergy.length > 0 && (
            <div
              className={cn(
                'absolute bottom-1 left-1 flex flex-wrap gap-0.5',
                'max-w-full'
              )}
            >
              {pokemonState.attachedEnergy.slice(0, 4).map((energy, i) => (
                <div
                  key={energy.id}
                  className={cn(
                    'rounded-full border border-white/50 shadow-sm',
                    energyColors[energy.subtype || 'basic'] || 'bg-gray-300',
                    size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
                  )}
                  title={energy.name}
                />
              ))}
              {pokemonState.attachedEnergy.length > 4 && (
                <div
                  className={cn(
                    'rounded-full bg-gray-600 text-white',
                    'flex items-center justify-center',
                    size === 'sm' ? 'w-2 h-2 text-[6px]' : size === 'md' ? 'w-3 h-3 text-[7px]' : 'w-4 h-4 text-[8px]'
                  )}
                >
                  +{pokemonState.attachedEnergy.length - 4}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Hover tooltip */}
      <div
        className={cn(
          'absolute -bottom-8 left-1/2 transform -translate-x-1/2',
          'bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap',
          'opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10'
        )}
      >
        {card.name}
        {pokemonState && ` (${pokemonState.hp}/${pokemonState.maxHp} HP)`}
      </div>
    </div>
  );
}

// Also export a simpler version for non-Pokemon cards
export function SimpleCardDisplay({
  card,
  size = 'md',
  faceDown = false,
  className,
}: Omit<CardDisplayProps, 'pokemonState' | 'showOverlay'>) {
  return (
    <CardDisplay
      card={card}
      size={size}
      faceDown={faceDown}
      className={className}
      showOverlay={false}
    />
  );
}
