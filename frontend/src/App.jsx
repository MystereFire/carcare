import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AddVehicle from './pages/AddVehicle';
import EditVehicle from './pages/EditVehicle';
import VehicleDetails from './pages/VehicleDetails';
import AddExpense from './pages/AddExpense';
import VehicleExpenses from './pages/VehicleExpenses';
import Profile from './pages/Profile';
import CompareVehicles from './pages/CompareVehicles';
import MaintenancePage from './pages/MaintenancePage';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';



function App() {
  return (
    <Router>
      <Routes>
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-vehicle" element={<AddVehicle />} />
          <Route path="/vehicle/:id" element={<VehicleDetails />} />
          <Route path="/vehicle/:id/edit" element={<EditVehicle />} />
          <Route path="/vehicle/:id/add-expense" element={<AddExpense />} />
          <Route path="/vehicle/:id/expenses" element={<VehicleExpenses />} />
          <Route path="/vehicle/:id/maintenance" element={<MaintenancePage />} />
          <Route path="/compare" element={<CompareVehicles />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
