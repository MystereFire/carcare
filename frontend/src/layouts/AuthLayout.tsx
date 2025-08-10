import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AuthLayout() {
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50">
      <Header variant="minimal" />
      <main className="flex-1 grid place-items-center px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
