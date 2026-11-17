import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { useEffect } from 'react';
import { useDialog } from '../lib/useDialog';

export function Brand() {
  return <Link to="/" className="brand" aria-label="CarCare, accueil"><span className="brand-mark"><Icon name="car" size={25} /></span><span>carcare<span className="brand-dot">.</span></span></Link>;
}

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useDialog(menuOpen, () => setMenuOpen(false));
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = event => { if (event.matches) setMenuOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  const location = useLocation();
  const navigate = useNavigate();
  const vehicleId = location.pathname.match(/^\/vehicle\/([^/]+)/)?.[1] || localStorage.getItem('currentVehicleId');
  const title = location.pathname.includes('maintenance') ? 'Entretien' : location.pathname.includes('expense') ? 'Dépenses' : location.pathname === '/compare' ? 'Comparateur' : location.pathname === '/profile' ? 'Mon compte' : location.pathname.includes('edit') || location.pathname.includes('add-vehicle') ? 'Mon garage' : 'Vue d’ensemble';
  const nav = [
    { to: '/', icon: 'grid', label: 'Tableau de bord', active: location.pathname === '/' || /^\/vehicle\/[^/]+$/.test(location.pathname) },
    { to: vehicleId ? `/vehicle/${vehicleId}/expenses` : '/add-vehicle', icon: 'wallet', label: 'Dépenses' },
    { to: vehicleId ? `/vehicle/${vehicleId}/maintenance` : '/add-vehicle', icon: 'tool', label: 'Entretien' },
    { to: '/compare', icon: 'compare', label: 'Comparateur' },
  ];
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentVehicleId');
    navigate('/login', { replace: true });
  };
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Aller au contenu</a>
      <button className={`sidebar-backdrop ${menuOpen ? 'is-open' : ''}`} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" />
      <aside ref={menuRef} className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <Brand />
        <div className="sidebar-caption">VOTRE ESPACE AUTO</div>
        <nav aria-label="Navigation principale">
          {nav.map(item => <NavLink key={item.label} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${(item.active ?? isActive) ? 'is-active' : ''}`}><Icon name={item.icon} /><span>{item.label}</span><span className="nav-active-dot" /></NavLink>)}
        </nav>
        <div className="garage-invite"><span className="garage-invite-icon"><Icon name="car" size={25} /></span><strong>Votre garage, bien suivi.</strong><p>Un espace pour chacun de vos véhicules.</p><Link to="/add-vehicle" className="btn-secondary" onClick={() => setMenuOpen(false)}><Icon name="plus" size={16} />Ajouter un véhicule</Link></div>
        <div className="sidebar-bottom"><NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}><Icon name="user" /><span>Mon compte</span></NavLink><button className="nav-link" onClick={logout}><Icon name="logout" /><span>Déconnexion</span></button><div className="sidebar-footnote"><span className="status-dot" />CarCare · Votre carnet automobile</div></div>
      </aside>
      <div className="workspace" inert={menuOpen ? '' : undefined}>
        <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Ouvrir le menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><Icon name="menu" /></button><span className="breadcrumb">Mon espace <span>/</span> <strong>{title}</strong></span></div><div className="topbar-right"><span className="topbar-date"><Icon name="calendar" size={16} />{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span><Link className="avatar" to="/profile" aria-label="Mon compte"><Icon name="user" size={19} /></Link></div></header>
        <main id="main-content" className="workspace-content"><Outlet /></main>
        <footer className="workspace-footer"><span>Un peu d’attention. Beaucoup de kilomètres.</span><span>© {new Date().getFullYear()} CarCare</span></footer>
      </div>
    </div>
  );
}
