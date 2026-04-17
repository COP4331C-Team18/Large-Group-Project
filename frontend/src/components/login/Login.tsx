import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import LoginHero from './LoginHero';
import OAuth from '@/components/signup/OAuth';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/api/services/authService';

export default function Login() {
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const navigate = useNavigate();

  const handleSetLoginName = (e: React.ChangeEvent<HTMLInputElement>) => setLoginName(e.target.value);
  const handleSetPassword = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);
  const { login } = useAuth();

  const doLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    try {
      const data = await authService.login({
         login: loginName, 
         password: loginPassword 
        });
      login(data.user);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  const handleRequestReset = async () => {
    try {
      await authService.requestPasswordReset(resetEmail); 
      setMessage("If that email exists, a link is on the way.");
    } catch (error: any) {
      setMessage("Error requesting reset.");
    }
  };

  {/* Forgot Password Card */}
  if (isForgotMode) {
    return (
      <section className="relative w-full max-w-4xl mx-auto flex justify-center items-center min-h-screen p-5">
        <div className="card w-full max-w-md bg-base-300  border-primary border-t-[3px] rounded-[3px] p-6 sm:p-10 transition-all duration-300">
          <div className="text-center mb-6">
              <h1 className="font-serif text-2xl font-bold leading-[0.95] mb-2 ">Reset Your <em className="text-primary italic-600">Password</em>{' '}</h1>
              <p className="text-base text-primary">Enter your email and we'll send you a link to get back into your account</p>
          </div>
          <input
            type="email" placeholder="Email Address" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
              className="w-full px-4 py-[0.7rem]
              font-sans text-[0.93rem] text-base-content
              bg-base-100 border border-primary/70 rounded-[3px]
              placeholder:text-base-content/60        
              outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/30
              transition-all duration-150" />
          <div className="text-error text-sm min-h-[16px] my-2 text-center p-[2px]">
            {message}
          </div>
          <button onClick={handleRequestReset} className="btn w-full bg-primary/90 text-primary-content hover:bg-primary border-none rounded-[3px] font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase">Send Reset Link</button>
          <button onClick={() => {setIsForgotMode(false); setMessage("");}} className="mt-4 text-primary text-sm font-semibold">Back to Login</button>
        </div>
      </section>
    );
  }

  return (
    <section
      className="
        relative min-h-screen flex flex-col items-center justify-center
        pt-28 pb-20 px-8 overflow-hidden bg-base-100
      "
    >
            <div 
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle,grey,transparent_1px)] bg-[length:24px_24px]"
      />

      <LoginHero />
 
      {/* Login card */}
      <div className="relative z-[4] flex flex-col items-center text-center gap-10 w-full mt-10">
        <div
          className="
            flex flex-col items-center gap-5
            bg-base-200 border border-primary/20 border-t-[3px] border-t-primary
            rounded px-9 py-8
            shadow-[0_4px_20px_rgba(42,45,46,0.08)]
            w-full max-w-[420px]
          "
        >
          <p className="font-sans text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-primary">
            Sign in to your account
          </p>
 
          <div className="flex flex-col gap-3 w-full">
            <input
              type="text"
              placeholder="Username"
              value={loginName}
              onChange={handleSetLoginName}
              onKeyDown={(e) => e.key === 'Enter' && doLogin(e as any)}
              className="
                w-full px-4 py-[0.7rem]
                font-sans text-[0.93rem] text-base-content
                bg-base-100 border border-primary/20 rounded-[3px]
                placeholder:text-base-content/60
                outline-none
                focus:border-primary focus:ring-2 focus:ring-primary/30
                transition-all duration-150
              "
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={handleSetPassword}
              onKeyDown={(e) => e.key === 'Enter' && doLogin(e as any)}
              className="
                w-full px-4 py-[0.7rem]
                font-sans text-[0.93rem] text-base-content
                bg-base-100 border border-primary/20 rounded-[3px]
                placeholder:text-base-content/60
                outline-none
                focus:border-primary focus:ring-2 focus:ring-primary/30
                transition-all duration-150
              "
            />
          </div>
 

          <button
            onClick={doLogin}
            className="
              w-full flex items-center justify-center gap-2
              font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase
              bg-primary text-primary-content
              px-6 py-[0.82rem] rounded-[3px] border-none
              transition-colors duration-200 hover:bg-primary/90
              cursor-pointer
            "
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Sign In
          </button>

          {/* Google OAuth button */}
          <div className="mt-4 flex justify-center w-full">
            <OAuth />
          </div>
 
          {message && (
            <p className="font-sans text-[0.84rem] text-red-700 text-center -mt-1">
              {message}
            </p>
          )}
 
          <p className="font-sans text-[0.84rem] text-base-content/70 text-center">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="
                text-primary font-semibold
                border-b border-[rgba(74,90,58,0.3)] pb-px
                hover:border-primary transition-colors duration-150
                bg-transparent border-x-0 border-t-0 cursor-pointer p-0
              "
            >
              Create one free
            </button>
          </p>

          <p className="font-sans text-[0.84rem] text-base-content/70 text-center">
            Forgot your password?{' '}
            <button
              onClick={() => setIsForgotMode(true)}
              className="
                text-primary font-semibold
                border-b border-[rgba(74,90,58,0.3)] pb-px
                hover:border-primary transition-colors duration-150
                bg-transparent border-x-0 border-t-0 cursor-pointer p-0
              "
            >
              Click here
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}