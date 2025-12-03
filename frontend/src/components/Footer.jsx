import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white/80 backdrop-blur border-t border-slate-200 text-center text-slate-500 py-4 mt-auto ${className}`}
    >
      (c) 2025 CarCare
    </footer>
  );
}
