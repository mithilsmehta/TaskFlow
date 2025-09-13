import React, { createContext, useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchUser = async () => {
            try {
                const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // normalize user object
                const userData = {
                    ...response.data,
                    token,
                    role: response.data.role,
                };

                setUser(userData);

                // keep role synced in localStorage
                if (userData.role) {
                    localStorage.setItem("role", userData.role);
                }
            } catch (error) {
                console.error("User not authenticated", error);
                clearUser();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const updateUser = (data) => {
        // backend usually returns { token, user: {...} }
        const token = data.token || localStorage.getItem("token");
        const role = data.user?.role || data.role || localStorage.getItem("role");

        const userData = data.user ? { ...data.user, token, role } : { ...data, token, role };

        setUser(userData);

        if (token) localStorage.setItem("token", token);
        if (role) localStorage.setItem("role", role);

        setLoading(false);
    };

    const clearUser = () => {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
    };

    return (
        <UserContext.Provider value={{ user, loading, updateUser, clearUser }}>
            {children}
        </UserContext.Provider>
    );
};

export default UserProvider;