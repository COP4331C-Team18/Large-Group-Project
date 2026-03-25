import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import VerificationCard from '@/components/signup/VerificationCard';
import OAuth from '@/components/signup/OAuth';

const app_name = 'inkboard.xyz';

function buildPath(route: string): string {
    if (import.meta.env.MODE != 'development') {
        return 'http://' + app_name + ':5000/' + route;
    }
    else {
        return 'http://localhost:5000/' + route;
    }
}

export default function Signup() {
    const navigate = useNavigate();

    // useState hooks to store form field values
    const [signupEmail, setSignupEmail] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    // Property to control display of verification card
    const [showVerification, setShowVerification] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    /* 
        Handlers for form field changes
        Sends data to backend API
    */
    const handleSetSignupEmail = (e: React.ChangeEvent<HTMLInputElement>) => setSignupEmail(e.target.value);
    const handleSetSignupName = (e: React.ChangeEvent<HTMLInputElement>) => setSignupName(e.target.value);
    const handleSetSignupPassword = (e: React.ChangeEvent<HTMLInputElement>) => setSignupPassword(e.target.value);
    const handleSetSignupConfirmPassword = (e: React.ChangeEvent<HTMLInputElement>) => setSignupConfirmPassword(e.target.value);

    const doSignup = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (!signupEmail || !signupName || !signupPassword || !signupConfirmPassword) {
            setMessage('Please fill in all fields');
            return;
        }

        if (signupPassword !== signupConfirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        // ENFORCING THE SAME PASSWORD CHECK ON THE FRONTEND AS THE BACKEND TO PREVENT DUMB ERRORS
        if (signupPassword.length < 10) {
            setMessage('Password must be at least 10 characters long');
            return;
        }


        /* 
            Temporarily show verification card without API call for testing
            !!! Reminder to remove this after merging !!!
        
        setShowVerification(true);
        setSubmittedEmail(signupEmail);
        return;
        */

        // matching the payload to what the backend expects
        const obj = {
            username: signupName,
            email: signupEmail,
            password: signupPassword
        };

        try {
            const response = await fetch(buildPath('api/auth/signup'), {
                method: 'POST',
                body: JSON.stringify(obj),
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();

            if (!response.ok) {
                setMessage(res.error || 'An error occurred during signup');
                return;
            }

            // Signup successful, show verification card
            setMessage('');
            setShowVerification(true);
            setSubmittedEmail(res.email); // Use the email from the response to ensure it's the one that was processed

        } catch (error: any) {
            setMessage('An error occured during signup. Please try again later.');
        }
    };

    /*
    handled by OAuth component now, but leaving this here for reference until we're sure the OAuth component works fine
    const doGoogleSignup = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        window.location.href = buildPath('api/auth/google');
    };
    */

    // Resets fields 
    const handleReturn = () => {
        setShowVerification(false);
        setSubmittedEmail('');
        setSignupEmail('');
        setSignupName('');
        setSignupPassword('');
        setSignupConfirmPassword('');
    };

    // Returns JSX for the sign-up form
    return (
        <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center min-h-screen p-5">
            <div className={`card w-full max-w-md bg-white bg-base-100  border-primary border-t-[3px] rounded-[3px] border-t-cap p-6 sm:p-10 transition-all duration-300 ${showVerification ? 'blur-[1.5px] opacity-45 pointer-events-none select-none' : ''}`}>
                <div className="text-center mb-6">
                    <h1 className="font-serif text-2xl font-semibold font-bold leading-[0.95] mb-2 ">Welcome to <em className="text-moss italic-600">InkBoard</em>{' '}
                    </h1>
                    <p className="text-base text-gray-600">Create an account to save your boards and collaborate with anyone</p>
                </div>

                <div className="form-control gap-4">
                    <input type="email" placeholder="Email" value={signupEmail} onChange={handleSetSignupEmail}
                        className="w-full px-4 py-[0.7rem]
                        font-sans text-[0.93rem] text-ink
                        bg-stem-bg border border-[rgba(74,90,58,0.28)] rounded-[3px]
                        placeholder:text-soil-light
                        outline-none
                        focus:border-moss focus:ring-2 focus:ring-[rgba(74,90,58,0.15)]
                        transition-all duration-150" />
                    <input type="text" placeholder="Username" value={signupName} onChange={handleSetSignupName} className="w-full px-4 py-[0.7rem]
                        font-sans text-[0.93rem] text-ink
                        bg-stem-bg border border-[rgba(74,90,58,0.28)] rounded-[3px]
                        placeholder:text-soil-light
                        outline-none
                        focus:border-moss focus:ring-2 focus:ring-[rgba(74,90,58,0.15)]
                        transition-all duration-150" />
                    <input type="password" placeholder="Password" value={signupPassword} onChange={handleSetSignupPassword} className="w-full px-4 py-[0.7rem]
                        font-sans text-[0.93rem] text-ink
                        bg-stem-bg border border-[rgba(74,90,58,0.28)] rounded-[3px]
                        placeholder:text-soil-light
                        outline-none
                        focus:border-moss focus:ring-2 focus:ring-[rgba(74,90,58,0.15)]
                        transition-all duration-150" />
                    <input type="password" placeholder="Confirm Password" value={signupConfirmPassword} onChange={handleSetSignupConfirmPassword}
                        className="w-full px-4 py-[0.7rem]
                        font-sans text-[0.93rem] text-ink
                        bg-stem-bg border border-[rgba(74,90,58,0.28)] rounded-[3px]
                        placeholder:text-soil-light
                        outline-none
                        focus:border-moss focus:ring-2 focus:ring-[rgba(74,90,58,0.15)]
                        transition-all duration-150" />
                </div>

                <div className="text-error text-sm min-h-[16px] my-2 text-center p-[2px]">
                    {message}
                </div>

                <button className="btn w-full bg-[#4a5a3a] text-[#e4ddd0] hover:bg-[#2e3d28] border-none rounded-[3px] font-sans text-[0.76rem] font-semibold tracking-[0.1em] uppercase" onClick={doSignup}>
                    Create Account
                </button>

                {/* Google OAuth button */}
                <button className="mt-4 flex justify-center ">
                    <OAuth />
                </button>

                <p className="font-sans text-[0.84rem] text-soil-light text-center mt-[10px] pt-1">
                    Already have an account?{' '}
                    <button
                        onClick={() => navigate('/login')}
                        className="text-moss font-semibold
                            border-b border-[rgba(74,90,58,0.3)] pb-px
                            hover:border-moss transition-colors duration-150
                            bg-transparent border-x-0 border-t-0 cursor-pointer p-0"
                    >
                        Sign In
                    </button>
                </p>
            </div>
            {
                showVerification && (
                    <div className="absolute inset-0 flex justify-center items-center z-10 p-5">
                        <VerificationCard
                            email={submittedEmail}
                            onReturn={handleReturn}
                        />
                    </div>
                )
            }

        </div >
    );
}