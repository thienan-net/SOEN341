
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import MyTickets from './pages/MyTickets';
import MySavedEvents from './pages/MySavedEvents';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CreateEvent from './pages/CreateEvent';
// import EditEvent from './pages/EditEvent';
import EventAnalytics from './pages/EventAnalytics';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              
              {/* Keep /home working for users who navigate there */}
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              
              {/* Protected routes - Students */}
              <Route 
                path="/my-tickets" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MyTickets />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/my-saved-events" 
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <MySavedEvents />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected routes - Organizers */}
              <Route 
                path="/organizer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/organizer/events/create" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <CreateEvent />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/organizer/events/:id/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <EventAnalytics />
                  </ProtectedRoute>
                } 
              />

              

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
