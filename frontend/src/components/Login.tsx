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
    <div id="loginDiv">
      <span id="inner-title">PLEASE LOG IN</span><br />
      <input type="text" id="loginName" placeholder="Username" onChange={handleSetLoginName} /><br />
      <input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword} /><br />
      <button id="loginButton" className="buttons" onClick={doLogin}>Do It</button>
      <span id="loginResult">{message}</span>
    </div>
  );
}