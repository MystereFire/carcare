import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
    }
    navigate('/');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen">Redirection...</div>
  );
}
