import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, firebaseEnabled } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
    const [view, setView] = useState('login'); // 'login' | 'signup'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');

        if (!firebaseEnabled) {
            handleMockLogin();
            return;
        }

        try {
            if (view === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleMockLogin = () => {
        console.log("Using Mock Login");
        localStorage.setItem("gt_auth_token", "mock");
        navigate('/');
    };

    const handleGoogle = async () => {
        if (!firebaseEnabled) {
            handleMockLogin();
            return;
        }
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="auth-overlay" style={{ display: 'flex' }}>
            <div className="auth-card">
                {view === 'login' ? (
                    <div>
                        <div className="auth-header">
                            <div className="auth-logo">GT</div>
                            <h2 className="auth-title">Welcome back</h2>
                            <p className="auth-subtitle">Sign in to your AI chat experience</p>
                        </div>
                        <form className="auth-form" onSubmit={handleAuth}>
                            {error && <div style={{ color: '#ff4d4f', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}
                            {!firebaseEnabled && (
                                <div style={{ color: '#faad14', background: 'rgba(250, 173, 20, 0.1)', padding: '8px', borderRadius: '4px', fontSize: '12px', marginBottom: '10px', border: '1px solid rgba(250, 173, 20, 0.2)' }}>
                                    ⚠️ Firebase not configured. Please add valid credentials to your <code>.env</code> file. Using <b>Mock Login</b> instead.
                                </div>
                            )}
                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <input type="email" className="auth-input" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input type="password" className="auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="auth-btn">Sign In</button>
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', margin: '4px 0' }}>or</div>
                            <button type="button" onClick={handleGoogle} className="auth-btn google-btn" style={{ background: 'white', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.26498 9.76453A8.95909 8.95909 0 0 0 5.09695 12c0 .77382.10018 1.52345.28913 2.23547l-4.13054 3.20364C.45036 15.6583 0 13.8856 0 12c0-1.8856.45036-3.6583 1.25554-5.43911l4.00944 3.20364Z" /><path fill="#34A853" d="M12 24c3.24 0 5.9508-1.08 7.9333-2.9092l-4.2272-3.2774C14.6293 18.5303 13.4187 19 12 19c-3.1417 0-5.8078-2.1268-6.7594-4.991l-4.1352 3.2081C3.1539 21.3653 7.1585 24 12 24Z" /><path fill="#4A90E2" d="M23.6358 12.2727c0-.8182-.0732-1.6046-.2106-2.3636H12v4.4727h6.525c-.2822 1.4429-1.0766 2.664-2.2963 3.4912l4.2272 3.2774C22.9272 18.8682 23.6358 15.8236 23.6358 12.2727Z" /><path fill="#FBBC05" d="M12 5c1.7618 0 3.3444.606 4.5885 1.791l3.4398-3.4398C17.942.3927 15.2345 0 12 0 7.1585 0 3.1539 2.6347 1.0555 6.5609l4.0094 3.2036C6.0145 6.9419 8.8052 5 12 5Z" /></svg>
                                Continue with Google
                            </button>
                        </form>
                        <div className="auth-footer">
                            New to GT? <button className="auth-link" style={{ background: 'none', border: 'none', color: 'white', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setView('signup')}>Create an account</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="auth-header">
                            <div className="auth-logo">GT</div>
                            <h2 className="auth-title">Create Account</h2>
                            <p className="auth-subtitle">Start your journey with GT Assistant</p>
                        </div>
                        <form className="auth-form" onSubmit={handleAuth}>
                            {error && <div style={{ color: '#ff4d4f', fontSize: '13px', marginBottom: '10px' }}>{error}</div>}
                            {!firebaseEnabled && (
                                <div style={{ color: '#faad14', background: 'rgba(250, 173, 20, 0.1)', padding: '8px', borderRadius: '4px', fontSize: '12px', marginBottom: '10px', border: '1px solid rgba(250, 173, 20, 0.2)' }}>
                                    ⚠️ Firebase not configured. Please add valid credentials to your <code>.env</code> file. Using <b>Mock Login</b> instead.
                                </div>
                            )}
                            <div className="form-group">
                                <label>Name</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <input type="text" className="auth-input" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                        <polyline points="22,6 12,13 2,6" />
                                    </svg>
                                    <input type="email" className="auth-input" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-with-icon">
                                    <svg viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <input type="password" className="auth-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                                </div>
                            </div>
                            <button type="submit" className="auth-btn">Sign Up</button>
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', margin: '4px 0' }}>or</div>
                            <button type="button" onClick={handleGoogle} className="auth-btn google-btn" style={{ background: 'white', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#EA4335" d="M5.26498 9.76453A8.95909 8.95909 0 0 0 5.09695 12c0 .77382.10018 1.52345.28913 2.23547l-4.13054 3.20364C.45036 15.6583 0 13.8856 0 12c0-1.8856.45036-3.6583 1.25554-5.43911l4.00944 3.20364Z" /><path fill="#34A853" d="M12 24c3.24 0 5.9508-1.08 7.9333-2.9092l-4.2272-3.2774C14.6293 18.5303 13.4187 19 12 19c-3.1417 0-5.8078-2.1268-6.7594-4.991l-4.1352 3.2081C3.1539 21.3653 7.1585 24 12 24Z" /><path fill="#4A90E2" d="M23.6358 12.2727c0-.8182-.0732-1.6046-.2106-2.3636H12v4.4727h6.525c-.2822 1.4429-1.0766 2.664-2.2963 3.4912l4.2272 3.2774C22.9272 18.8682 23.6358 15.8236 23.6358 12.2727Z" /><path fill="#FBBC05" d="M12 5c1.7618 0 3.3444.606 4.5885 1.791l3.4398-3.4398C17.942.3927 15.2345 0 12 0 7.1585 0 3.1539 2.6347 1.0555 6.5609l4.0094 3.2036C6.0145 6.9419 8.8052 5 12 5Z" /></svg>
                                Continue with Google
                            </button>
                        </form>
                        <div className="auth-footer">
                            Already have an account? <button className="auth-link" style={{ background: 'none', border: 'none', color: 'white', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setView('login')}>Sign In</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
