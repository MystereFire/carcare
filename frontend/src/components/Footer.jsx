import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-slate-950/20 backdrop-blur border-t border-white/5 text-center text-slate-500 py-4 mt-auto ${className}`}
    >
      (c) 2026 CarCare Manager
    </footer>
  );
}
