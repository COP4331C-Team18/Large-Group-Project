import LandingPage from '@/pages/LandingPage';
import Dashboard from '@/pages/Dashboard';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignUpPage';
import PrivateRoutes from '@/config/privateRoutes';
import WhiteboardRoom from '@/pages/InkBoardRoom';
import Whiteboard from '@/pages/Whiteboard';

export default function App() {
  return (
    <div className="Router">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* PUBLIC Collaborative Room Route */}
        {/* This allows guests to join via a link or 6-digit code without logging in */}
        <Route path="/board/:code" element={<WhiteboardRoom />} /> {/* <-- 2. Add the route */}
        
        {/* NEW: CRDT Test Route */}
        <Route path="/test-crdt/:id" element={<Whiteboard />} />

        {/* Private Routes needs authentication */}
        <Route element={<PrivateRoutes />} >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </div>
  );
}