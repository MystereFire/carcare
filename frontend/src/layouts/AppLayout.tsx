import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AppLayout() {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header variant="full" />
      <main className="flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
