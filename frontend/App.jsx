import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth, onAuthStateChanged } from './firebase';

export default function App() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            const isMock = localStorage.getItem("gt_auth_token") === "mock";
            setUser(currentUser || (isMock ? { displayName: 'Mock User' } : null));
            setLoading(false);

            if (!currentUser && !isMock) {
                if (location.pathname !== '/login') {
                    navigate('/login');
                }
            } else if (location.pathname === '/login') {
                navigate('/');
            }
        });

        // Fallback timer just in case auth is blocking
        const t = setTimeout(() => {
            if (loading) setLoading(false);
        }, 2000);

        return () => {
            unsubscribe();
            clearTimeout(t);
        };
    }, [navigate, location.pathname, loading]);

    if (loading) {
        return <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Loading GT Assistant...</div>;
    }

    return (
        <Outlet />
    );
}
