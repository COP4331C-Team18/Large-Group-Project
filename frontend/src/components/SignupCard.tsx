import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../signup.css';

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
    const navigate = useNavigate();

    /* 
    Handlers for form field changes
    Send data to backend API
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

        const obj = {
            email: signupEmail, name: signupName,
            password: signupPassword, confirmPassword: signupConfirmPassword
        };
        const js = JSON.stringify(obj);

        try {
            // Need API endpoint for signup
            const response = await fetch(buildPath('api/signup'), {
                method: 'POST',
                body: js,
                headers: { 'Content-Type': 'application/json' }
            });

            const res = await response.json();

            if (res.id <= 0 || res.error) {
                setMessage('Account creation failed. Please try again.');
            } else {
                const user = { firstName: res.firstName, lastName: res.lastName, id: res.id };
                localStorage.setItem('user_data', JSON.stringify(user));
                setMessage('');
                navigate('/cards');
            }
        } catch (error: any) {
            alert(error.toString());
        }
    };

    const doGoogleSignup = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        /* 
        Implement backend's Google OAuth entry point
        
        Backend: Google redirect, get user info, create/finds the account, then return user back to app
        */

        window.location.href = buildPath('api/auth/google');
    };

    //return JSX for the sign-up form
    return (
        <div id="signupDiv">
            <div id="signupDiv-header">
                <h2>Welcome to InkBoard</h2>
                <p>Create an account to save your boards and collaborate with anyone</p>
            </div>

            <div id="signupDiv-fields">
                <input type="email" id="signupEmail" placeholder="Email" onChange={handleSetSignupEmail} /><br />
                <input type="text" id="signupName" placeholder="Username" onChange={handleSetSignupName} /><br />
                <input type="password" id="signupPassword" placeholder="Password" onChange={handleSetSignupPassword} /><br />
                <input type="password" id="signupConfirmPassword" placeholder="Confirm Password" onChange={handleSetSignupConfirmPassword} /><br />
            </div>

            <span id="signupDiv-error">{message}</span>


            <button id="signupDiv-button" className="buttons" onClick={doSignup}>
                Create Account
            </button>

            <div id="signupDiv-">
                <span>or sign up with:</span>
            </div>

            <button id="googleButton" className="buttons" onClick={doGoogleSignup}>
                <img src="../googleIcon.png" alt="GoogleLogo" width={18} height={18} />
                Google
            </button>
        </div >
    );
};