import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const app_name = 'inkboard.xyz';

function buildPath(route:string) : string
{
  if (import.meta.env.MODE != 'development')
  {
    return 'http://' + app_name + ':5000/' + route;
  }
  else
  {
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
      const response = await fetch(buildPath('api/login'), {
        method: 'POST',
        body: js,
        headers: { 'Content-Type': 'application/json' }
      });

      const res = await response.json();

      if (res.id <= 0 || res.error) {
        setMessage('User/Password combination incorrect');
      } else {
        const user = { firstName: res.firstName, lastName: res.lastName, id: res.id };
        localStorage.setItem('user_data', JSON.stringify(user));
        setMessage('');
        navigate('/cards'); // Modern client-side routing
      }
    } catch (error: any) {
      alert(error.toString());
    }
  };

  return (
    <div className="card w-96 bg-base-100 shadow-xl mx-auto mt-10">
      <div className="card-body">
        <h2 className="card-title justify-center mb-4">PLEASE LOG IN</h2>
        <div className="form-control w-full">
          <input
            type="text"
            placeholder="Username"
            className="input input-bordered w-full mb-4"
            onChange={handleSetLoginName}
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full mb-6"
            onChange={handleSetPassword}
          />
          <button
            className="btn btn-primary w-full"
            onClick={doLogin}
          >
            Do It
          </button>
        </div>
        {message && (
          <div className="text-error text-center mt-4 text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}