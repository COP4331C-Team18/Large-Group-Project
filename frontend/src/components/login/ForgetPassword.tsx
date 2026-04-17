import { useState } from 'react';
import { authService } from '@/api/services/authService';
import { useParams, useNavigate } from 'react-router-dom';

export default function ForgetPassword() {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [error, setError] = useState('');
  const [message] = useState('');

  const handleSubmit = async () => {
    if (!id || !token) {
        return setError("Invalid reset link parameters.");
    }

    if (!passwords.new || !passwords.confirm) {
        setError('Please fill in all fields');
        return;
    }

    if (passwords.new !== passwords.confirm) return setError("Passwords do not match");

    try {
        await authService.resetPassword(id, token, passwords.new, passwords.confirm);
        alert("Success! Password updated.");
        navigate('/login');
    } catch (err: any) {
        setError(err.response?.data?.error || "Link invalid or expired.");
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex justify-center items-center min-h-screen p-5">
      <div className="card w-full max-w-md bg-base-300  border-primary border-t-[3px] rounded-[3px] p-6 sm:p-10 transition-all duration-300">
        <div className="text-center mb-6">
            <h1 className="font-serif text-2xl font-bold leading-[0.95] mb-2 ">Set Your New <em className="text-primary italic-600">Password</em>{' '}</h1>
        </div>
        <input 
          type="password" 
          placeholder="New Password" 
            className="w-full px-4 py-[0.7rem]
            font-sans text-[0.93rem] text-base-content
            bg-base-100 border border-primary/70 rounded-[3px]
            placeholder:text-base-content/60        
            outline-none
            focus:border-primary focus:ring-2 focus:ring-primary/30
            transition-all duration-150"
          onChange={(e) => setPasswords({...passwords, new: e.target.value})}
        />
        <div className="text-error text-sm min-h-[16px] my-2 text-center p-[2px]">
            {message}
        </div>
        <input 
          type="password" 
          placeholder="Confirm New Password" 
            className="w-full px-4 py-[0.7rem]
            font-sans text-[0.93rem] text-base-content
            bg-base-100 border border-primary/70 rounded-[3px]
            placeholder:text-base-content/60        
            outline-none
            focus:border-primary focus:ring-2 focus:ring-primary/30
            transition-all duration-150"
          onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
        />
        <div className="text-error text-sm min-h-[16px] my-2 text-center p-[2px]">
            {error}
        </div>
        <button onClick={handleSubmit} className="btn btn-primary w-full">Update Password</button>
      </div>
    </div>
  );
}