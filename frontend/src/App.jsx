import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import VehicleDetails from './pages/VehicleDetails';
import AddExpense from './pages/AddExpense';
import VehicleExpenses from './pages/VehicleExpenses';
import Profile from './pages/Profile';
import CompareVehicles from './pages/CompareVehicles';
import MaintenancePage from './pages/MaintenancePage';
import OAuthCallback from './pages/OAuthCallback';



function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route
              path="/"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/add-vehicle"
              element={<ProtectedRoute><AddVehicle /></ProtectedRoute>}
            />
            <Route
              path="/vehicle/:id"
              element={<ProtectedRoute><VehicleDetails /></ProtectedRoute>}
            />
            <Route
              path="/vehicle/:id/edit"
              element={<ProtectedRoute><EditVehicle /></ProtectedRoute>}
            />
            <Route
              path="/vehicle/:id/add-expense"
              element={<ProtectedRoute><AddExpense /></ProtectedRoute>}
            />
            <Route
              path="/vehicle/:id/expenses"
              element={<ProtectedRoute><VehicleExpenses /></ProtectedRoute>}
            />
            <Route
              path="/vehicle/:id/maintenance"
              element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>}
            />
            <Route
              path="/compare"
              element={<ProtectedRoute><CompareVehicles /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/oauth2" element={<OAuthCallback />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
