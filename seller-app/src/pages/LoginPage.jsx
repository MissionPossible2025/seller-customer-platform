import { useState } from "react";
import axios from "axios";

export default function LoginPage({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.post(`${baseUrl}/api/users/login`, { email, password });
      
      // Save token (optional)
      localStorage.setItem("token", res.data.token);

      alert("Login successful!");
      setLoggedIn(res.data.user);
    } catch (err) {
      alert("Login failed: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      width: "100%",
      maxWidth: "400px",
      margin: "0 auto",
      padding: "2rem"
    }}>
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: "2rem",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        width: "100%"
      }}>
        <h1 style={{ marginBottom: "2rem", fontSize: "2rem" }}>Seller Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ 
            width: "100%",
            display: "block", 
            marginBottom: "1rem", 
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ 
            width: "100%",
            display: "block", 
            marginBottom: "1.5rem", 
            padding: "0.75rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            fontSize: "1rem"
          }}
        />
        <button 
          onClick={handleLogin} 
          style={{ 
            width: "100%",
            padding: "0.75rem 1rem",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease"
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = "#535bf2"}
          onMouseOut={(e) => e.target.style.backgroundColor = "#646cff"}
        >
          Login
        </button>
      </div>
    </div>
  );
}

