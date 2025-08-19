import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white border-t text-center text-gray-500 py-4 mt-auto ${className}`}
    >
      © 2025 CarCare
    </footer>
  );
}