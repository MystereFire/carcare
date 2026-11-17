import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);
  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const token = new URLSearchParams(window.location.search).get('token');
    window.history.replaceState(null, '', window.location.pathname);
    if (token) {
      localStorage.setItem('token', token);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  return <div className="page-loading" role="status"><span className="loading-ring" />Ouverture de votre espace…</div>;
}
