import React from 'react';

export default function WinnerBadge({ winnerName, savingsPercent }) {
  if (!winnerName) return null;
  return (
    <div className="text-center mb-6">
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-4 py-1 rounded-full shadow-sm text-sm">
        <span role="img" aria-label="trophy">🏆</span>
        <span>{winnerName} plus économique (-{savingsPercent}%)</span>
      </span>
    </div>
  );
}
