import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../signup.css';
import VerificationCard from './VerificationCard';

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
        */
        setShowVerification(true);
        setSubmittedEmail(signupEmail);
        return;

        const obj = {
            email: signupEmail, name: signupName,
            password: signupPassword, confirmPassword: signupConfirmPassword
        };
        const js = JSON.stringify(obj);

        try {
            const response = await fetch(buildPath('api/auth/signup'), {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();

            if (res.id <= 0 || res.error) {
                setMessage('Account creation failed. Please try again.');
            }
            else {
                const user = { firstName: res.firstName, lastName: res.lastName, id: res.id };
                localStorage.setItem('user_data', JSON.stringify(user));
                setMessage('');

                setShowVerification(true);
                setSubmittedEmail(signupEmail);
            }
        } catch (error: any) {
            alert(error.toString());
        }
    };

    const doGoogleSignup = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        window.location.href = buildPath('api/auth/google');
    };

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
        <div id="signupContainer">
            <div id="signupDiv" className={showVerification ? 'is-hidden-behind' : ''}>
                <div id="signupDiv-header">
                    <h2>Welcome to InkBoard</h2>
                    <p>Create an account to save your boards and collaborate with anyone</p>
                </div>

                <div id="signupDiv-fields">
                    <input type="email" id="signupEmail" placeholder="Email" value={signupEmail} onChange={handleSetSignupEmail} />
                    <input type="text" id="signupName" placeholder="Username" value={signupName} onChange={handleSetSignupName} />
                    <input type="password" id="signupPassword" placeholder="Password" value={signupPassword} onChange={handleSetSignupPassword} />
                    <input type="password" id="signupConfirmPassword" placeholder="Confirm Password" value={signupConfirmPassword} onChange={handleSetSignupConfirmPassword} />
                </div>

                <span id="signupDiv-error">{message}</span>

                <button id="signupDiv-button" className="buttons" onClick={doSignup}>
                    Create Account
                </button>

                <div id="signupDiv-">
                    <span>or sign up with:</span>
                </div>

                <button id="googleButton" className="buttons" onClick={doGoogleSignup}>
                    <img src="../googleIcon.png" alt="GoogleLogo" width={24} height={24} />
                    Google
                </button>
            </div >
            {showVerification && (
                <VerificationCard
                    email={submittedEmail}
                    onReturn={handleReturn}
                />
            )}
        </div>
    );
};