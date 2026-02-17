import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userData = await login(email, password);
            navigate(userData?.role === 'SUPER_ADMIN' ? '/admin' : '/');
        } catch (err) {
            const status = err.response?.status;
            const isNetwork = err.code === 'ERR_NETWORK' || !status;
            const msg = isNetwork
                ? 'Cannot reach server. Check console for URL.'
                : status === 404
                    ? 'Login endpoint not found (404). Check console for API baseURL.'
                    : status === 401
                        ? 'Invalid credentials'
                        : `Error ${status}: ${err.response?.data?.message || err.message}`;
            setError(msg);
            console.error('[Login]', status, err.response?.data, err.config?.baseURL + err.config?.url);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6">Login</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 py-2 rounded hover:bg-blue-500 transition">
                        Login
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400">
                    Don't have an account? <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
                </p>
            </div>
        </div>
    );
}
