import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between">
      <Link
        to="/"
        className="text-xl font-bold text-blue-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        CarCare
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {!token ? (
          <>
            <Link
              to="/login"
              className="text-gray-700 hover:text-blue-600 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-gray-700 hover:text-blue-600 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/compare"
              className="text-gray-700 hover:text-blue-600 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Comparer
            </Link>
            <Link
              to="/profile"
              className="text-gray-700 hover:text-blue-600 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Profil
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

