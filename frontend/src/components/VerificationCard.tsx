import React, { useState, useRef } from 'react';
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

/*
    Change in Property: 
    Hides verification card and return to sign up card
*/

interface VerificationCardProp {
    email: string;
    onReturn: () => void;
}

export default function Verification({ email, onReturn }: VerificationCardProp) {
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [message, setMessage] = useState('');
    const [resendMessage, setResendMessage] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const navigate = useNavigate();


    /*  
        Handles input changes for verification code fields
        Ensures single digit input, auto-advance, and auto-submit
    */
    const handleInputChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const newCode = [...code];
        newCode[index] = digit;
        setCode(newCode);
        setMessage('');

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        if (digit && index === 5) {
            const fullCode = [...newCode].join('');
            if (fullCode.length === 6) {
                submitCode(fullCode);
            }
        }
    };

    // Handles backspace, arrow key navigation, and selection
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (code[index]) {
                const newCode = [...code];
                newCode[index] = ''; // Clears current field
                setCode(newCode);
            }
            else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
        else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
        else if (/^\d$/.test(e.key) && code[index]) {
            e.preventDefault();
            const newCode = [...code];
            newCode[index] = e.key;
            setCode(newCode);
            setMessage('');
            if (index < 5) inputRefs.current[index + 1]?.focus();
            if (index === 5) {
                const fullCode = newCode.join('');
                if (fullCode.length === 6) {
                    submitCode(fullCode);
                }
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

        if (!pasted) {
            return;
        }

        const newCode = [...code];
        pasted.split('').forEach((digit, i) => {
            if (i < 6) {
                newCode[i] = digit;
            }
        });
        setCode(newCode);

        // Focuses last filled or last input
        const lastIndex = Math.min(pasted.length, 5);
        inputRefs.current[lastIndex]?.focus();

        if (pasted.length === 6) {
            submitCode(pasted);
        }
    };

    const submitCode = async (fullCode: string) => {
        setResendMessage('');
        try {
            const response = await fetch(buildPath('api/auth/verify-email'), {
                method: 'POST',
                body: JSON.stringify({ email, code: fullCode }),
                headers: { 'Content-Type': 'application/json' }
            });
            const res = await response.json();

            if (res.error) {
                setMessage('Incorrect code. Please try again.');

                // Clears code and refocuses first input
                setCode(['', '', '', '', '', '']);
                setTimeout(() => inputRefs.current[0]?.focus(), 3000);
            }
            else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            setMessage('Verification failed. Please try again.');
        }
    };

    const handleResend = async () => {
        setMessage('');
        setResendMessage('');
        try {
            const response = await fetch(buildPath('api/auth/resend-verification'), {
                method: 'POST',
                body: JSON.stringify({ email }),
                headers: { 'Content-Type': 'application/json' }
            });
            const res = await response.json();

            if (res.error) {
                setMessage('Failed to resend. Please try again.');
            }
            else {
                setResendMessage('Verification code resent. Please check your email.');
                setTimeout(() => setResendMessage(''), 3000);
            }
        } catch {
            setMessage('Failed to resend. Please try again.');
        }
    };

    return (
        <div id="verificationDiv">
            <div id="verificationDiv-header">
                <p>Please check your email for a verification code:</p>
                <strong>{email}</strong>
            </div>

            <div id="verification-inputs" onPaste={handlePaste}>
                {code.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        className="verification-digit"
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                    />
                ))}
            </div>

            {message && <span id="verification-error">{message}</span>}

            <div id="verification-resend">
                <span>Didn't receive a code?</span>
                <button id="resendButton" className="buttons" onClick={handleResend}>
                    Re-send
                </button>
                {resendMessage && <span id="verification-resendMsg">{resendMessage}</span>}
            </div>

            <hr id="verification-divider" />

            <div id="verification-return">
                <span>Wrong address? Sign up with a different email.</span>
                <button id="returnButton" className="buttons" onClick={onReturn}>
                    Return
                </button>
            </div>
        </div>
    );
};