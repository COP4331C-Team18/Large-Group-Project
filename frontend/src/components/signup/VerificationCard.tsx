import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const app_name = 'inkboard.xyz';

function buildPath(route: string): string {
    if (import.meta.env.MODE != 'development') {
        return 'http://' + app_name + ':5000/' + route;
    }
    else {
        return 'http://localhost:5000/' + route;
    }
}

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

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (code[index]) {
                const newCode = [...code];
                newCode[index] = '';
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
        <div className="card w-full max-w-md bg-base-100 shadow-xl border-2 border-[#d0c5ad] rounded-[40px] p-6 sm:p-10 text-center">
            <div className="mb-4">
                <p className="text-base text-gray-600 mb-1">Please check your email for a verification code:</p>
                <strong className="text-lg font-semibold text-gray-800">{email}</strong>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 my-4" onPaste={handlePaste}>
                {code.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        className={`w-12 h-12 rounded-xl border-2 text-center text-lg font-semibold caret-transparent focus:outline-none transition-colors ${
                            digit 
                                ? 'bg-[#4a5a3a] text-[#e4ddd0] border-[#4a5a3a] focus:ring-2 focus:ring-[#4a5a3a]' 
                                : 'border-[#d0c5ad] text-gray-800 focus:bg-gray-100 focus:ring-2 focus:ring-[#d0c5ad]'
                        }`}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                    />
                ))}
            </div>

            {message && <span className="text-error text-sm min-h-[20px] block">{message}</span>}

            <div className="flex flex-col items-center mt-4 gap-2 text-sm text-gray-500">
                <span>Didn't receive a code?</span>
                <button className="btn btn-sm bg-[#4a5a3a] text-[#e4ddd0] hover:bg-[#2e3d28] border-none rounded-xl px-8" onClick={handleResend}>
                    Re-send
                </button>
                {resendMessage && <span className="text-success text-sm mt-1">{resendMessage}</span>}
            </div>

            <hr className="border-t border-[#d0c5ad] my-6" />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-500">
                <span>Wrong address? Sign up with a different email.</span>
                <button className="btn btn-sm bg-gray-500 text-white hover:bg-gray-600 border-none rounded-xl px-8" onClick={onReturn}>
                    Return
                </button>
            </div>
        </div>
    );
}