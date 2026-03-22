import React, { useState } from 'react';
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

        if (signupPassword !== signupConfirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        if (!signupEmail || !signupName || !signupPassword || !signupConfirmPassword) {
            setMessage('Please fill in all fields');
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
            <div className={`card w-full max-w-md bg-base-100 shadow-xl border-2 border-[#d0c5ad] rounded-[40px] p-6 sm:p-10 transition-all duration-300 ${showVerification ? 'blur-[1.5px] opacity-45 pointer-events-none select-none' : ''}`}> 
                <div className="text-center mb-6">
                    <h2 className="text-xl font-semibold mb-2">Welcome to InkBoard</h2>
                    <p className="text-base text-gray-600">Create an account to save your boards and collaborate with anyone</p>
                </div>

                {/* Google OAuth button */}
                <div className="mb-4 flex justify-center">
                    <OAuth />
                </div>

                <div className="form-control gap-4">
                    <input type="email" placeholder="Email" value={signupEmail} onChange={handleSetSignupEmail} className="input input-bordered w-full bg-[#ebebeb] rounded-xl" />
                    <input type="text" placeholder="Username" value={signupName} onChange={handleSetSignupName} className="input input-bordered w-full bg-[#ebebeb] rounded-xl" />
                    <input type="password" placeholder="Password" value={signupPassword} onChange={handleSetSignupPassword} className="input input-bordered w-full bg-[#ebebeb] rounded-xl" />
                    <input type="password" placeholder="Confirm Password" value={signupConfirmPassword} onChange={handleSetSignupConfirmPassword} className="input input-bordered w-full bg-[#ebebeb] rounded-xl" />
                </div>

                <div className="text-error text-sm min-h-[16px] my-2 text-center">
                    {message}
                </div>

                <button className="btn w-full bg-[#4a5a3a] text-[#e4ddd0] hover:bg-[#2e3d28] border-none rounded-xl text-lg font-medium h-[60px]" onClick={doSignup}>
                    Create Account
                </button>
            </div>
            
            {showVerification && (
                <div className="absolute inset-0 flex justify-center items-center z-10 p-5">
                    <VerificationCard
                        email={submittedEmail}
                        onReturn={handleReturn}
                    />
                </div>
            )}
        </div>
    );
}