import LandingPage from '@/pages/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignUpPage';


export default function App() {
  return (
    <div className="Router">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );

}
