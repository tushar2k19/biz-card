import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        organizationName: '',
        organizationSlug: ''
    });
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userData = await register(formData);
            navigate(userData?.role === 'SUPER_ADMIN' ? '/admin' : '/');
        } catch (err) {
            setError('Registration failed. Slug might be taken.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6">Register Organization</h2>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        name="fullName"
                        placeholder="Full Name"
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email"
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        required
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        required
                    />
                    <input
                        name="organizationName"
                        placeholder="Organization Name"
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        required
                    />
                    <input
                        name="organizationSlug"
                        placeholder="Organization Slug (e.g. acme)"
                        onChange={handleChange}
                        className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                        required
                    />
                    <button type="submit" className="w-full bg-green-600 py-2 rounded hover:bg-green-500 transition">
                        Register
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}
