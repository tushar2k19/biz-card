import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Building2, UserPlus, CreditCard, Users } from 'lucide-react';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [allCards, setAllCards] = useState([]);
  const [orgUsers, setOrgUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOrg, setCreateOrg] = useState({ name: '', slug: '' });
  const [addUser, setAddUser] = useState({
    organizationId: '',
    email: '',
    password: '',
    fullName: '',
    role: 'MEMBER',
  });
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const showMsg = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [orgsRes, cardsRes] = await Promise.all([
        api.get('/organizations'),
        api.get('/business-cards/admin/all'),
      ]);
      setOrganizations(orgsRes.data || []);
      setAllCards(cardsRes.data || []);
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to load data', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedOrgId) {
      setOrgUsers([]);
      return;
    }
    api.get('/users', { params: { organizationId: selectedOrgId } })
      .then((res) => setOrgUsers(res.data || []))
      .catch(() => setOrgUsers([]));
  }, [selectedOrgId]);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!createOrg.name.trim() || !createOrg.slug.trim()) {
      showMsg('Name and slug required', true);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/organizations', createOrg);
      setCreateOrg({ name: '', slug: '' });
      await load();
      showMsg('Company created');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to create company', true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!addUser.organizationId || !addUser.email.trim() || !addUser.password || !addUser.fullName.trim()) {
      showMsg('All fields required', true);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', addUser);
      setAddUser({ organizationId: addUser.organizationId, email: '', password: '', fullName: '', role: 'MEMBER' });
      if (selectedOrgId === addUser.organizationId) {
        const res = await api.get('/users', { params: { organizationId: addUser.organizationId } });
        setOrgUsers(res.data || []);
      }
      showMsg('User added');
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed to add user', true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070d] text-white p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-[#00f5a0]" />
            Admin – Global View
          </h1>
          <div className="flex gap-3 items-center">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <Link to="/" className="text-[#00f5a0] hover:underline text-sm">Dashboard</Link>
            <button onClick={logout} className="bg-red-600/80 px-4 py-2 rounded-lg hover:bg-red-500 text-sm">
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg ${message.isError ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-10">
            {/* Companies */}
            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#00f5a0]" />
                Companies ({organizations.length})
              </h2>
              <form onSubmit={handleCreateOrg} className="flex flex-wrap gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Company name"
                  value={createOrg.name}
                  onChange={(e) => setCreateOrg((o) => ({ ...o, name: e.target.value }))}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Slug (e.g. acme)"
                  value={createOrg.slug}
                  onChange={(e) => setCreateOrg((o) => ({ ...o, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))}
                  className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
                />
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-[#00f5a0] text-[#031013] font-medium hover:opacity-90 disabled:opacity-50">
                  Create Company
                </button>
              </form>
              <ul className="space-y-2">
                {organizations.map((org) => (
                  <li key={org.id} className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-gray-400 text-sm">{org.slug}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Add User */}
            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#00f5a0]" />
                Add User to Company
              </h2>
              <form onSubmit={handleAddUser} className="space-y-3 max-w-md">
                <select
                  required
                  value={addUser.organizationId}
                  onChange={(e) => setAddUser((u) => ({ ...u, organizationId: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="">Select company</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Full name"
                  value={addUser.fullName}
                  onChange={(e) => setAddUser((u) => ({ ...u, fullName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={addUser.email}
                  onChange={(e) => setAddUser((u) => ({ ...u, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={addUser.password}
                  onChange={(e) => setAddUser((u) => ({ ...u, password: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400"
                  required
                />
                <select
                  value={addUser.role}
                  onChange={(e) => setAddUser((u) => ({ ...u, role: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white"
                >
                  <option value="MEMBER">Member</option>
                  <option value="ORG_ADMIN">Org Admin</option>
                </select>
                <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-[#00f5a0] text-[#031013] font-medium hover:opacity-90 disabled:opacity-50">
                  Add User
                </button>
              </form>
            </section>

            {/* Users by company */}
            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00f5a0]" />
                Users by Company
              </h2>
              <select
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
                className="w-full max-w-xs px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white mb-4"
              >
                <option value="">Select company</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              <ul className="space-y-2">
                {orgUsers.map((u) => (
                  <li key={u.id} className="flex justify-between items-center py-2 border-b border-white/10">
                    <span>{u.fullName}</span>
                    <span className="text-gray-400 text-sm">{u.email} · {u.role}</span>
                  </li>
                ))}
                {selectedOrgId && orgUsers.length === 0 && <li className="text-gray-400">No users</li>}
              </ul>
            </section>

            {/* All Business Cards */}
            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#00f5a0]" />
                All Business Cards ({allCards.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Uploaded by</th>
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCards.map((card) => (
                      <tr key={card.id} className="border-b border-white/10">
                        <td className="py-2 pr-4 text-gray-300">{card.organization?.name ?? '—'}</td>
                        <td className="py-2 pr-4 text-gray-300">{card.user?.fullName ?? card.user?.email ?? '—'}</td>
                        <td className="py-2 pr-4">{card.name ?? '—'}</td>
                        <td className="py-2 pr-4 text-gray-300">{card.email ?? card.phone ?? '—'}</td>
                      </tr>
                    ))}
                    {allCards.length === 0 && (
                      <tr><td colSpan={4} className="py-4 text-gray-400">No cards</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
