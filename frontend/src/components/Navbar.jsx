import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-card shadow-sm p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-primary">CarCare</Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {!token ? (
          <>
            <Link
              to="/login"
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            <Link to="/compare" className="text-primary hover:underline">Comparer</Link>
            <Link to="/profile" className="text-primary hover:underline">Profil</Link>
            <button
              onClick={handleLogout}
              className="text-destructive hover:underline"
            >
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
