import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// // Pages
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
import Events from './pages/Events';
// import EventDetail from './pages/EventDetail';
// import MyTickets from './pages/MyTickets';
// import MySavedEvents from './pages/MySavedEvents';
// import OrganizerDashboard from './pages/OrganizerDashboard';
// import CreateEvent from './pages/CreateEvent';
// import EditEvent from './pages/EditEvent';
// import EventAnalytics from './pages/EventAnalytics';
// import QRValidator from './pages/QRValidator';
// import AdminDashboard from './pages/AdminDashboard';
// import AdminUsers from './pages/AdminUsers';
// import AdminEvents from './pages/AdminEvents';
// import AdminOrganizations from './pages/AdminOrganizations';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/events" element={<Events />} />

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
