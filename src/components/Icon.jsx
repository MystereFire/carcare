import React from 'react';

const paths = {
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  car: 'M5 17H3v-6l3-7h12l3 7v6h-2M5 17v3H3v-3m16 0v3h2v-3M5 17h14M3 11h18M6 14h2m8 0h2',
  wallet: 'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6m18 7h-5v4h5',
  tool: 'M14.7 6.3a5 5 0 0 0-6.4 6.4L3 18a2.1 2.1 0 0 0 3 3l5.3-5.3a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z',
  compare: 'M8 3v18M16 3v18M3 8l5-5 5 5M11 16l5 5 5-5',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  logout: 'M9 21H4V3h5M14 8l5 4-5 4m-6-4h11',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  down: 'm6 9 6 6 6-6',
  fuel: 'M4 21V4h9v17M3 21h11M4 10h9m0 4h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9l-4-4m2 2v4h2',
  gauge: 'M3 17a10 10 0 1 1 18 0M12 13l5-6M6 17h12M5 10l2 1m10 0 2-1M12 3v3',
  calendar: 'M8 2v4m8-4v4M3 10h18M3 5h18v16H3zM7 14h2m4 0h2m-8 3h2',
  check: 'm5 12 4 4L19 6',
  shield: 'M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6',
  close: 'm6 6 12 12M6 18 18 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  trend: 'm3 17 6-6 4 4 8-11m-6 0h6v6',
  info: 'M12 11v6m0-10h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};

export default function Icon({ name, size = 20, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.info} /></svg>;
}
