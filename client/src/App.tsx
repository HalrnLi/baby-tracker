import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import FeedPage from './pages/FeedPage';
import PumpPage from './pages/PumpPage';
import DiaperPage from './pages/DiaperPage';
import WeightPage from './pages/WeightPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import { useReminders } from './hooks/useReminders';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// Component to handle PWA and reminders setup when authenticated
function AppSetup({ children }: { children: React.ReactNode }) {
  // Initialize reminders when logged in
  useReminders();

  // PWA: register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('SW registration failed:', err);
        });
      });
    }
  }, []);

  return <>{children}</>;
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppSetup>
              <DashboardPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <AppSetup>
              <FeedPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pump"
        element={
          <ProtectedRoute>
            <AppSetup>
              <PumpPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/diaper"
        element={
          <ProtectedRoute>
            <AppSetup>
              <DiaperPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/weight"
        element={
          <ProtectedRoute>
            <AppSetup>
              <WeightPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <AppSetup>
              <HistoryPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <AppSetup>
              <StatsPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppSetup>
              <SettingsPage />
            </AppSetup>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
