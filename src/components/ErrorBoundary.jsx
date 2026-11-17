import React from 'react';

export default class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('Erreur d’affichage CarCare', error); }
  render() {
    if (this.state.failed) return <div className="empty-state full-page" role="alert"><span className="eyebrow">UN IMPRÉVU</span><h1>L’affichage a rencontré un problème.</h1><p>Rechargez votre espace pour réessayer.</p><button className="btn-primary" onClick={() => window.location.reload()}>Recharger</button><a href="/" className="text-link">Revenir à l’accueil</a></div>;
    return this.props.children;
  }
}
