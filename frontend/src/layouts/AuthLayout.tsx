import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow grid place-items-center px-4 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
