import { useNavigate } from 'react-router-dom';

export default function LoggedInName() {
  const navigate = useNavigate();
  
  // Safely get user data
  const ud = localStorage.getItem('user_data');
  const user = ud ? JSON.parse(ud) : { firstName: '', lastName: '' };

  const doLogout = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    localStorage.removeItem("user_data");
    navigate('/'); 
  };

  return (
    <div id="loggedInDiv">
      <span id="userName">Logged In As {user.firstName} {user.lastName}</span><br />
      <button type="button" id="logoutButton" className="buttons" onClick={doLogout}> Log Out </button>
    </div>
  );
}