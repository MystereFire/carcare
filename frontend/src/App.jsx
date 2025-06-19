import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AddVehicle from './pages/AddVehicle'; // <-- ajout de la page
import EditVehicle from './pages/EditVehicle';
import VehicleDetails from './pages/VehicleDetails';
import AddExpense from './pages/AddExpense';
import VehicleExpenses from './pages/VehicleExpenses';
import Profile from './pages/Profile';



function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 text-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/add-vehicle" element={<ProtectedRoute> <AddVehicle /> </ProtectedRoute>} />
          <Route path="/vehicle/:id" element={<ProtectedRoute> <VehicleDetails /> </ProtectedRoute>} />
          <Route path="/vehicle/:id/edit" element={<ProtectedRoute> <EditVehicle /> </ProtectedRoute>} />
          <Route path="/vehicle/:id/add-expense" element={<ProtectedRoute> <AddExpense  /> </ProtectedRoute>} />
          <Route path="/vehicle/:id/expenses" element={<ProtectedRoute> <VehicleExpenses   /> </ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
