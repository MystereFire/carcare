import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-white text-center text-gray-500 p-4 mt-8 border-t">
      &copy; {new Date().getFullYear()} CarCare
    </footer>
  );
}
