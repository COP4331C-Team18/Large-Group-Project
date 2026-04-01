import { Routes, Route } from 'react-router-dom';
import {Suspense, lazy} from 'react';
import PrivateRoutes from '@/config/privateRoutes';

// Lazy loaded pages
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const SignupPage = lazy(() => import('@/pages/SignUpPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// fallback component for lazy loading
const Loading = () => <div>Loading...</div>;

export default function App() {
  return (
    <div className="Router">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Private Routes needs authentication*/}
          <Route element={<PrivateRoutes />} >
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  );

}
