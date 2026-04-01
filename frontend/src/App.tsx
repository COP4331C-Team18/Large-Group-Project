import { Routes, Route } from 'react-router-dom';
import {Suspense, lazy} from 'react';
import PrivateRoutes from '@/config/privateRoutes';
import WhiteboardRoom from '@/pages/InkBoardRoom';

export default function App() {
  return (
    <div className="Router">
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />

        {/* PUBLIC Collaborative Room Route */}
        {/* This allows guests to join via a link or 6-digit code without logging in */}
        <Route path="/board/:code" element={<WhiteboardRoom />} /> {/* <-- 2. Add the route */}

        {/* Private Routes needs authentication */}
        <Route element={<PrivateRoutes />} >
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
    </div>
  );
}