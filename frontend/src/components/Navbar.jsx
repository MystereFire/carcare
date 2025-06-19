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
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">CarCare</Link>
      <div className="space-x-4">
        {!token ? (
          <>
            <Link to="/login" className="text-blue-500 hover:underline">Login</Link>
            <Link to="/register" className="text-blue-500 hover:underline">Register</Link>
          </>
        ) : (
          <>
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
    </nav>
  );
}
