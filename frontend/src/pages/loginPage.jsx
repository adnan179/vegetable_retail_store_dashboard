import React from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate} from "react-router-dom";
import axios from 'axios';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    userName:"",
    password:""
  });

  const { login, backendURL } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Submitting Credentials:", credentials); // Debugging
  
    try {
      const { data } = await axios.post(`${backendURL}/auth/login`, credentials, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" }, // Ensure proper request format
      });
  
      console.log("Login Response:", data);
      if (!data.role) {
        throw new Error("Role is missing in response!");
      }
      login({ token: data.token, userName: data.userName, role: data.role });
  
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err);
      alert("Invalid credentials: " + (err?.response?.data?.error || err.message));
    }
  };
  
  return (
    <section className="flex w-full min-h-screen justify-center items-center">
        <form onSubmit={handleLogin} className="flex flex-col gap-4 p-4 rounded-md justify-center items-center shadow-sm shadow-gray-600">
            <h1 className="text-2xl font-bold text-center">
              Login
            </h1>
            <input required 
              value={credentials.userName} 
              onChange={(e) => setCredentials({...credentials, userName:e.target.value})} 
              type="text" 
              placeholder="Username" 
              className="w-[300px] p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400" 
            />
            <input required 
              value={credentials.password} 
              onChange={(e) => setCredentials({...credentials,password:e.target.value})} 
              type="password" 
              placeholder="Password" 
              className="w-[300px] p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-400" 
            />
            <button onClick={handleLogin} type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-lg">
              Login
            </button>
        </form>
    </section>
  )
}

export default LoginPage;