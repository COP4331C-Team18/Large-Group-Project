import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import LoginHero from './LoginHero';
import OAuth from '@/components/signup/OAuth';

// const app_name = 'inkboard.xyz';

function buildPath(route:string) : string
{
  if (import.meta.env.MODE != 'development')
  {
    // Production: Point to the secure domain, NO port 5000!
    return '/' + route; 
  }
  else
  {
    // Local Development remains unchanged
    return 'http://localhost:5000/' + route;
  }
}

export default function Login() {
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSetLoginName = (e: React.ChangeEvent<HTMLInputElement>) => setLoginName(e.target.value);
  const handleSetPassword = (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

const doLogin = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const obj = { login: loginName, password: loginPassword };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(buildPath('api/auth/login'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });

      const res = await response.json();

      // Check if the response failed (400, 401, etc.)
      if (!response.ok || res.error) {
        // Display the specific error from the backend (e.g., "Email not verified")
        setMessage(res.error || 'User/Password combination incorrect');
      } else {
        // Success! Save the token so PrivateRoutes lets us through
        localStorage.setItem('token', res.token); 
        
        // Save the user data using the object structure your backend actually returns
        localStorage.setItem('user_data', JSON.stringify(res.user));
        
        setMessage('');
        navigate('/dashboard'); 
      }
    } catch (error: any) {
      alert(error.toString());
    }
  };

  return (
    <section
      className="
        relative min-h-screen flex flex-col items-center justify-center
        pt-28 pb-20 px-8 overflow-hidden bg-stem-bg
      "
    >
      <LoginHero />
 
      {/* Login card */}
      <div className="relative z-[4] flex flex-col items-center text-center gap-10 w-full mt-10">
        <div
          className="
            flex flex-col items-center gap-5
            bg-white border border-[rgba(74,90,58,0.28)] border-t-[3px] border-t-cap
            rounded px-9 py-8
            shadow-[0_4px_20px_rgba(42,45,46,0.08)]
            w-full max-w-[420px]
          "
        >
          <p className="font-sans text-[0.66rem] font-semibold tracking-[0.2em] uppercase text-soil-light">
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
                font-sans text-[0.93rem] text-ink
                bg-stem-bg border border-[rgba(74,90,58,0.28)] rounded-[3px]
                placeholder:text-soil-light
                outline-none
                focus:border-moss focus:ring-2 focus:ring-[rgba(74,90,58,0.15)]
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
                font-sans text-[0.93rem] text-ink
                bg-stem-bg border border-[rgba(74,90,58,0.28)] rounded-[3px]
                placeholder:text-soil-light
                outline-none
                focus:border-moss focus:ring-2 focus:ring-[rgba(74,90,58,0.15)]
                transition-all duration-150
              "
            />
          </div>
 

          <button
            onClick={doLogin}
            className="
              w-full flex items-center justify-center gap-2
              font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase
              bg-moss text-stem-light
              px-6 py-[0.82rem] rounded-[3px] border-none
              transition-colors duration-200 hover:bg-forest
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
 
          <p className="font-sans text-[0.84rem] text-soil-light text-center">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="
                text-moss font-semibold
                border-b border-[rgba(74,90,58,0.3)] pb-px
                hover:border-moss transition-colors duration-150
                bg-transparent border-x-0 border-t-0 cursor-pointer p-0
              "
            >
              Create one free
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}