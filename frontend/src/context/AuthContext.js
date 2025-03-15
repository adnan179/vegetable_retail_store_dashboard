import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user,setUser] = useState(() => {
        return JSON.parse(localStorage.getItem("user")) || null;
    });
    const backendURL = `https://vegetable-retail-store-server.onrender.com/api`;
    // const backendURL = `http://localhost:5000/api`;
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if(storedUser) setUser(JSON.parse(storedUser))
    },[]);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{user,login, logout, backendURL}}>
            {children}
        </AuthContext.Provider>
    )
};

export const useAuth = () => {
    return useContext(AuthContext)
}