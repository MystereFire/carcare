import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  variant?: 'default' | 'minimal';
}

export default function Header({ variant = 'default' }: HeaderProps) {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">CarCare</Link>
      {variant !== 'minimal' && (
        <div className="space-x-4">
          {!token ? (
            <>
              <Link
                to="/login"
                className="text-sm text-blue-600 px-2 py-1 rounded hover:underline focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm text-blue-600 px-2 py-1 rounded hover:underline focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link to="/compare" className="text-blue-500 hover:underline">Comparer</Link>
              <Link to="/profile" className="text-blue-500 hover:underline">Profil</Link>
              <button
                onClick={handleLogout}
                className="text-red-500 hover:underline"
              >
                Déconnexion
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
