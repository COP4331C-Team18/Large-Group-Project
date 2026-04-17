import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignUpPage';
import PrivateRoutes from '@/config/privateRoutes';
import JoinBoard from '@/pages/JoinBoard';
import Whiteboard from '@/pages/Whiteboard';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';
import ForgetPassword from '@/pages/ForgetPasswordPage';

export default function App() {
  return (
    <div className="Router">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Public: sends a unqiue link for password reset */}
        <Route path="/forgetpassword/:id/:token" element={<ForgetPassword />} />

        {/* Public: resolves a join code and redirects to /board/:id?collab=CODE */}
        <Route path="/join/:code" element={<JoinBoard />} />

        {/* Public: Yjs whiteboard — handles both owners (via ?id) and guests (via ?collab=) */}
        <Route path="/board/:id" element={<Whiteboard />} />

        {/* Private Routes needs authentication */}
        <Route element={<PrivateRoutes />} >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} /> 
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </div>
  );
}