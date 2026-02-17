import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import BusinessCardScanner from './BusinessCardScanner';

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#05070d]/90 backdrop-blur border-b border-white/10 flex justify-end items-center gap-4 px-4 py-2">
        <span className="text-white/70 text-sm">{user?.email}</span>
        {user?.role === 'SUPER_ADMIN' && (
          <Link to="/admin" className="text-[#00f5a0] hover:underline text-sm">Admin</Link>
        )}
        <button onClick={logout} className="text-white/70 hover:text-white text-sm">Logout</button>
      </div>
      <div className="pt-12">
        <BusinessCardScanner />
      </div>
    </>
  );
}
