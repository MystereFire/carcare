import React from 'react';

export default function Footer({ className = '' }) {
  return (
    <footer
      className={`bg-card text-center text-muted-foreground p-4 mt-auto border-t ${className}`}
    >
      &copy; {new Date().getFullYear()} CarCare
    </footer>
  );
}