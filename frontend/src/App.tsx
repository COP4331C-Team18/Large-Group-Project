import LandingPage from '@/pages/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignUpPage';
import PrivateRoutes from '@/config/privateRoutes';


export default function App() {
  return (
    <div className="Router">
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
    </div>
  );

}
