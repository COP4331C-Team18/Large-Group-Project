import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    
    if (!loginName || !loginPassword) {
      setMessage('Please fill in all fields');
      return;
    }
    
    try {
      const data = await authService.login({
         login: loginName, 
         password: loginPassword 
        });
      login(data.user);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "User is not found. Please try again.");
    }
  };

  const handleRequestReset = async () => {
    try {
      await authService.requestPasswordReset(resetEmail); 
      setMessage("If that email exists, a link is on the way.");
    } catch (error: any) {
      setMessage("Please enter an email");
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
              className="
              w-full px-4 py-[0.7rem]
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
    <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center min-h-screen p-5">
 
      {/* Login card */}
      <div className="card w-full max-w-md bg-base-300 border-primary border-t-[3px] rounded-[3px] p-6 sm:p-10 transition-all duration-300">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl font-bold leading-[0.95] mb-2 ">Welcome <em className="text-primary italic-600">Back!</em>{' '}</h1>
          <p className="text-base text-primary">Sign in to your account and pick up right</p>
          <p className="text-base text-primary">where you left off</p>
        </div>
        
        <div className="form-control gap-4">
          <input
            type="text"
            placeholder="Username"
            value={loginName}
            onChange={handleSetLoginName}
            onKeyDown={(e) => e.key === 'Enter' && doLogin(e as any)}
            className="
              w-full px-4 py-[0.7rem]
              font-sans text-[0.93rem] text-base-content
              bg-base-100 border border-primary/70 rounded-[3px]
              placeholder:text-base-content/60
              outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/30
              transition-all duration-150"
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
              bg-base-100 border border-primary/70 rounded-[3px]
              placeholder:text-base-content/60
              outline-none
              focus:border-primary focus:ring-2 focus:ring-primary/30
              transition-all duration-150"
          />
        </div>

        <div className="text-error text-sm min-h-[16px] my-2 text-center p-[2px]">
          {message}
        </div>

        <button className="btn w-full bg-primary/90 text-primary-content hover:bg-primary border-none rounded-[3px] font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase" onClick={doLogin}>
          Sign In
        </button>

        {/* Google OAuth button */}
        <div className="mt-4 flex justify-center">
            <OAuth />
        </div>

        <p className="font-sans text-[0.84rem] text-base-content text-center mt-[10px] pt-1">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="
              text-primary/70 font-semibold
              border-b border-primary/90 pb-px
              hover:border-primary transition-colors duration-150
              bg-transparent border-x-0 border-t-0 cursor-pointer p-0"
          >
            Create one free
          </button>
        </p>

        <p className="font-sans text-[0.84rem] text-base-content text-center mt-[10px] pt-1">
          Forgot your password?{' '}
          <button
            onClick={() => {setIsForgotMode(true); setMessage("")}}
            className="
              text-primary/70 font-semibold
              border-b border-primary/90 pb-px
              hover:border-primary transition-colors duration-150
              bg-transparent border-x-0 border-t-0 cursor-pointer p-0"
          >
            Click here
          </button>
        </p>
      </div>
    </div>
  );
}