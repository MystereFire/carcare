import React from 'react';

export default function CompareSummary({ rows }) {
  if (!rows || !rows.length) return null;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left">
          <th className="pb-2">Critère</th>
          <th className="pb-2">Gagnant</th>
          <th className="pb-2 text-right">Écart</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r) => (
          <tr key={r.label} className="py-2">
            <td className="py-2">{r.label}</td>
            <td className="py-2 flex items-center gap-1">
              <span>{r.winner === 'Égalité' ? '✗' : '✓'}</span>
              <span>{r.winner}</span>
            </td>
            <td className="py-2 text-right">{r.diffText}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
