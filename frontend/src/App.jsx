import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthInitializer from './components/common/AuthInitializer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsersPage from './pages/users/UsersPage';
import UserDetailPage from './pages/users/UserDetailPage';
import FlightsPage from './pages/listings/FlightsPage';
import HotelsPage from './pages/listings/HotelsPage';
import CarsPage from './pages/listings/CarsPage';
import BookingsPage from './pages/bookings/BookingsPage';
import BookingDetailPage from './pages/bookings/BookingDetailPage';
import PaymentsPage from './pages/payments/PaymentsPage';
import AdminPage from './pages/admin/AdminPage';
import ConciergePage from './pages/concierge/ConciergePage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <>
      <AuthInitializer />
      <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <ProtectedRoute>
              <UserDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/hotels" element={<HotelsPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:bookingId"
          element={
            <ProtectedRoute>
              <BookingDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/concierge"
          element={
            <ProtectedRoute>
              <ConciergePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
    </>
  );
}

export default App;

