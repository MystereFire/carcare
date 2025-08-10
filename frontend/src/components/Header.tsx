import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface HeaderProps {
  variant?: 'full' | 'minimal';
}

export default function Header({ variant = 'full' }: HeaderProps) {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">CarCare</Link>
      {variant === 'full' && (
        <div className="space-x-4">
          {!token ? (
            !isAuthPage && (
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
            )
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
