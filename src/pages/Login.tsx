import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const handleLogin = () => {
    navigate("/quote_dashboard");
  };
  return (
    <div>
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};
export default Login;
