import React, { createContext, useState, useContext, useEffect } from 'react';
import { clearStoredAuth, getStoredToken, getStoredUser, setStoredAuth } from '../utils/authStorage';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = getStoredUser();
        const token = getStoredToken();

        if (storedUser && token) {
            setUser(storedUser);
        } else {
            clearStoredAuth();
        }

        setLoading(false);
    }, []);

    const login = (userData) => {
        setStoredAuth(userData);
        setUser(userData);
    };

    const logout = () => {
        clearStoredAuth();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
