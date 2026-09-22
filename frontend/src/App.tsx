import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AgentDashboard from './pages/AgentDashboard';
import TicketDetail from './pages/TicketDetail';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes for Customers */}
          <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>

          {/* Protected Routes for Agents/Admins */}
          <Route element={<ProtectedRoute allowedRoles={['AGENT']} />}>
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
          </Route>

          {/* Protected Routes for All Authenticated Users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/tickets/:id" element={<TicketDetail />} />
          </Route>

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
