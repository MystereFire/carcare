import React from 'react';
import { Brand } from './AppShell';
import Icon from './Icon';

export default function AuthLayout({ children }) {
  return <div className="auth-layout"><aside className="auth-story"><Brand /><div className="auth-story-content"><span className="eyebrow">VOTRE AUTO. L’ESPRIT TRANQUILLE.</span><h2>Prenez la route.<br /><em>On garde le fil.</em></h2><p>Les pleins, les dépenses, les prochains entretiens. Toute la vie de vos véhicules, réunie dans un carnet qui vous ressemble.</p><img className="auth-car" src="/car-placeholder.svg" alt="" /><div className="auth-feature-row"><div><Icon name="wallet" size={17} />Budget suivi</div><div><Icon name="fuel" size={17} />Consommation claire</div><div><Icon name="tool" size={17} />Entretien anticipé</div></div></div><div className="auth-story-footer">Un peu d’attention. Beaucoup de kilomètres.</div></aside><main className="auth-form-area"><div className="auth-form-wrap"><div className="auth-mobile-brand"><Brand /></div>{children}<p className="auth-note"><Icon name="shield" size={13} />Votre carnet automobile personnel</p></div></main></div>;
}
