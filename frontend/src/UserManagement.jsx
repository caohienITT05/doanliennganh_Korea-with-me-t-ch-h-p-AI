import React, { useState, useEffect } from 'react';
import { Search, Shield, UserX, UserCheck, RefreshCw, Lock, Unlock, Mail, Calendar } from 'lucide-react';
import axios from './axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            setMessage({ text: 'Không thể tải danh sách người dùng!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (user) => {
        const action = user.status === 'LOCKED' ? 'mở khóa' : 'khóa';
        if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${user.email}?`)) return;

        try {
            const res = await axios.patch(`/api/admin/users/${user.id}/toggle-status`);
            setUsers(users.map((u) => (u.id === user.id ? res.data : u)));
            setMessage({ text: `Đã ${action} tài khoản thành công!`, type: 'success' });
        } catch {
            setMessage({ text: `Thao tác thất bại!`, type: 'error' });
        }
    };

    const handleToggleRole = async (user) => {
        const targetRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        if (!window.confirm(`Chuyển quyền tài khoản ${user.email} thành ${targetRole}?`)) return;

        try {
            const res = await axios.patch(`/api/admin/users/${user.id}/toggle-role`);
            setUsers(users.map((u) => (u.id === user.id ? res.data : u)));
            setMessage({ text: `Đã cập nhật quyền thành ${targetRole}!`, type: 'success' });
        } catch {
            setMessage({ text: `Cập nhật quyền thất bại!`, type: 'error' });
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchSearch =
            u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#373A4D]">Quản lý người dùng</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Theo dõi, phân quyền và kiểm soát trạng thái hoạt động của tài khoản trong hệ thống.
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-pink-200 text-[#F06292] text-xs font-bold rounded-2xl hover:bg-pink-50 transition shadow-sm self-start"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Làm mới danh sách
                </button>
            </div>

            {message.text && (
                <div
                    className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}
                >
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })} className="hover:opacity-75">
                        ✕
                    </button>
                </div>
            )}

            <div className="bg-white p-5 rounded-3xl border border-pink-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Tìm theo họ tên hoặc email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs text-gray-700 focus:outline-none focus:border-[#F06292] transition"
                    />
                </div>

                <div className="flex gap-3">
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs font-bold text-[#373A4D] focus:outline-none focus:border-[#F06292]"
                    >
                        <option value="ALL">Tất cả vai trò</option>
                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                        <option value="USER">Học viên (USER)</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs font-bold text-[#373A4D] focus:outline-none focus:border-[#F06292]"
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                        <option value="UNVERIFIED">Chưa kích hoạt (UNVERIFIED)</option>
                        <option value="LOCKED">Đã bị khóa (LOCKED)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-pink-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-600">
                        <thead className="bg-[#FFF5F7] text-[#373A4D] font-extrabold uppercase text-[11px] border-b border-pink-100">
                            <tr>
                                <th className="py-4 px-6">ID</th>
                                <th className="py-4 px-6">Người dùng</th>
                                <th className="py-4 px-6">Vai trò</th>
                                <th className="py-4 px-6">Trạng thái</th>
                                <th className="py-4 px-6">Ngày tham gia</th>
                                <th className="py-4 px-6 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-pink-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-gray-400 font-medium">
                                        {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy người dùng nào phù hợp.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-[#FFFDFE] transition">
                                        <td className="py-4 px-6 font-bold text-gray-400">#{u.id}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F06292] to-[#F8BBD0] flex items-center justify-center text-white font-extrabold text-xs">
                                                    {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#373A4D] text-xs">{u.fullName || 'Chưa đặt tên'}</p>
                                                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                                        <Mail size={12} /> {u.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${u.role === 'ADMIN'
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    }`}
                                            >
                                                <Shield size={12} />
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${u.status === 'ACTIVE'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        : u.status === 'LOCKED'
                                                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                                                    }`}
                                            >
                                                {u.status === 'ACTIVE' && <UserCheck size={12} />}
                                                {u.status === 'LOCKED' && <UserX size={12} />}
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-gray-400 text-[11px]">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(u)}
                                                    title={u.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                                                    className={`p-2 rounded-xl border transition ${u.status === 'LOCKED'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                                        }`}
                                                >
                                                    {u.status === 'LOCKED' ? <Unlock size={14} /> : <Lock size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleRole(u)}
                                                    title="Chuyển quyền Admin/User"
                                                    className="p-2 bg-pink-50 text-[#F06292] border border-pink-200 rounded-xl hover:bg-pink-100 transition"
                                                >
                                                    <Shield size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;