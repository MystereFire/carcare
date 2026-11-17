import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/AppShell';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddVehicle = lazy(() => import('./pages/AddVehicle'));
const EditVehicle = lazy(() => import('./pages/EditVehicle'));
const AddExpense = lazy(() => import('./pages/AddExpense'));
const VehicleExpenses = lazy(() => import('./pages/VehicleExpenses'));
const Profile = lazy(() => import('./pages/Profile'));
const CompareVehicles = lazy(() => import('./pages/CompareVehicles'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<div className="page-loading" role="status"><span className="loading-ring" />Chargement de votre espace…</div>}>
          <Routes>
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="vehicle/:id" element={<Dashboard />} />
              <Route path="add-vehicle" element={<AddVehicle />} />
              <Route path="vehicle/:id/edit" element={<EditVehicle />} />
              <Route path="vehicle/:id/add-expense" element={<AddExpense />} />
              <Route path="vehicle/:id/expenses" element={<VehicleExpenses />} />
              <Route path="vehicle/:id/maintenance" element={<MaintenancePage />} />
              <Route path="compare" element={<CompareVehicles />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
            <Route path="oauth2" element={<OAuthCallback />} />
            <Route path="*" element={<div className="empty-state full-page"><span className="eyebrow">ERREUR 404</span><h1>Cette route n’existe pas.</h1><p>Retrouvez vos véhicules dans votre tableau de bord.</p><Link className="btn-primary" to="/">Revenir à l’accueil</Link></div>} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
