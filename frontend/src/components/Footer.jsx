import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-white text-center text-gray-500 p-4 border-t ${className}`}
    >
      &copy; {new Date().getFullYear()} CarCare
    </footer>
  );
}