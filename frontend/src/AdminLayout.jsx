import React, { useState } from 'react';
import UserManagement from './UserManagement';
import {
    BookOpen,
    LayoutDashboard,
    Users,
    GraduationCap,
    FileSpreadsheet,
    LogOut,
    Search,
    Bell,
    ShieldCheck,
    ChevronRight
} from 'lucide-react';

const AdminLayout = ({ user, onLogout }) => {
    // Quản lý tab đang được chọn: 'dashboard' | 'users' | 'courses' | 'exams'
    const [activeTab, setActiveTab] = useState('dashboard');

    const menuItems = [
        { id: 'dashboard', label: 'Bảng điều khiển', icon: LayoutDashboard, desc: 'Tổng quan hệ thống' },
        { id: 'users', label: 'Quản lý người dùng', icon: Users, desc: 'Tài khoản & Phân quyền' },
        { id: 'courses', label: 'Quản lý khóa học', icon: GraduationCap, desc: 'Sơ cấp 1 & Sơ cấp 2' },
        { id: 'exams', label: 'Quản lý đề thi TOPIK', icon: FileSpreadsheet, desc: 'TOPIK I, II & Barem chấm' },
    ];

    return (
        <div className="min-h-screen bg-[#FDF7F8] flex font-sans">
            {/* 1. SIDEBAR BÊN TRÁI */}
            <aside className="w-72 bg-white border-r border-pink-100 flex flex-col justify-between shadow-[2px_0_15px_rgba(0,0,0,0.02)] fixed h-full z-20">
                <div>
                    {/* Logo Brand */}
                    <div className="h-20 flex items-center gap-3 px-6 border-b border-pink-50">
                        <div className="bg-gradient-to-br from-[#F48FB1] to-[#F06292] p-2.5 rounded-2xl shadow-sm">
                            <BookOpen className="text-white w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-[#373A4D] tracking-tight">Korean With Me</h1>
                            <span className="text-[11px] font-bold text-[#F06292] bg-pink-50 px-2 py-0.5 rounded-full">
                                ADMIN PORTAL
                            </span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="p-4 space-y-1.5 mt-2">
                        <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Chức năng quản trị</p>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all text-left ${isActive
                                        ? 'bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white shadow-[0_4px_12px_rgba(240,98,146,0.3)]'
                                        : 'text-[#373A4D] hover:bg-pink-50 hover:text-[#F06292]'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        <div>
                                            <div className="text-sm font-bold">{item.label}</div>
                                            <div className={`text-[11px] ${isActive ? 'text-pink-100' : 'text-gray-400'}`}>
                                                {item.desc}
                                            </div>
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight size={16} />}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Thông tin Admin & Nút Đăng xuất ở cuối Sidebar */}
                <div className="p-4 border-t border-pink-50">
                    <div className="bg-[#FFF5F7] p-3.5 rounded-2xl flex items-center gap-3 mb-3 border border-pink-100">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F06292] to-[#F8BBD0] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-xs font-bold text-[#373A4D] truncate">{user?.fullName || 'Quản trị viên'}</p>
                            <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                        <LogOut size={16} /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* 2. KHU VỰC NỘI DUNG CHÍNH (BÊN PHẢI) */}
            <div className="flex-1 ml-72 flex flex-col min-h-screen">
                {/* Header trên cùng */}
                <header className="h-20 bg-white border-b border-pink-100 px-8 flex items-center justify-between sticky top-0 z-10">
                    {/* Thanh tìm kiếm */}
                    <div className="relative w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dữ liệu quản trị..."
                            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#F06292] focus:bg-white transition"
                        />
                    </div>

                    {/* Icon thông báo & Badge trạng thái */}
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-400 hover:text-[#F06292] hover:bg-pink-50 rounded-xl transition">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F06292] rounded-full"></span>
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                            <ShieldCheck size={16} /> Hệ thống Online
                        </div>
                    </div>
                </header>

                {/* Nội dung thay đổi theo Tab */}
                <main className="flex-1 p-8">
                    {activeTab === 'dashboard' && <AdminDashboard />}
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'courses' && <PlaceholderView title="Quản lý khóa học" subtitle="Quản lý Từ vựng & Ngữ pháp cho khóa Sơ cấp 1 và Sơ cấp 2" />}
                    {activeTab === 'exams' && <PlaceholderView title="Quản lý đề thi TOPIK" subtitle="Nhập đề thi Topik I, Topik II, upload file nghe & cài đặt tiêu chí chấm" />}
                </main>
            </div>
        </div>
    );
};

// Component con: Bảng điều khiển Tổng quan (Dashboard)
const AdminDashboard = () => {
    const stats = [
        { title: 'Tổng học viên', value: '128', change: '+12% tuần này', color: 'from-pink-500 to-rose-400' },
        { title: 'Bài học sơ cấp', value: '30 bài', change: '15 bài / khóa', color: 'from-purple-500 to-indigo-400' },
        { title: 'Đề thi TOPIK', value: '12 đề', change: 'Topik I & Topik II', color: 'from-blue-500 to-cyan-400' },
        { title: 'Lượt luyện thi', value: '1,420', change: 'Điểm TB: 145/200', color: 'from-amber-500 to-orange-400' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-extrabold text-[#373A4D]">Tổng quan hệ thống</h2>
                <p className="text-xs text-gray-500 font-medium mt-1">Chào mừng quay trở lại trang quản trị Korean With Me.</p>
            </div>

            {/* 4 Thẻ thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((s, index) => (
                    <div key={index} className="bg-white p-5 rounded-3xl border border-pink-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                        <div className="text-xs font-bold text-gray-400 mb-1">{s.title}</div>
                        <div className="text-2xl font-extrabold text-[#373A4D] mb-2">{s.value}</div>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            {s.change}
                        </span>
                    </div>
                ))}
            </div>

            {/* Khung hướng dẫn các bước tiếp theo */}
            <div className="bg-white rounded-3xl p-6 border border-pink-50">
                <h3 className="text-base font-bold text-[#373A4D] mb-4">Các tác vụ ưu tiên tiếp theo</h3>
                <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-[#FFF9FA] border border-pink-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-[#373A4D]">1. Quản lý người dùng</p>
                            <p className="text-xs text-gray-500">Xem bảng dữ liệu tài khoản từ MySQL, tính năng tìm kiếm, khóa/kích hoạt tài khoản.</p>
                        </div>
                        <span className="text-xs font-bold text-[#F06292]">Sắp triển khai &rarr;</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-gray-600">2. Quản lý khóa học (Từ vựng & Ngữ pháp)</p>
                            <p className="text-xs text-gray-400">CRUD từ vựng và cấu trúc ngữ pháp phục vụ tính năng Flashcard, Luyện gõ, Luyện nghe.</p>
                        </div>
                        <span className="text-xs text-gray-400">Chờ</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Component hiển thị Placeholder cho các tab đang chuẩn bị làm
const PlaceholderView = ({ title, subtitle }) => (
    <div className="bg-white rounded-3xl p-10 border border-pink-50 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-pink-50 flex items-center justify-center text-[#F06292] mb-4">
            <GraduationCap size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-[#373A4D] mb-2">{title}</h3>
        <p className="text-xs text-gray-500 max-w-md mb-6">{subtitle}</p>
        <div className="text-xs font-bold text-gray-400 bg-gray-100 px-4 py-2 rounded-xl">
            Bộ khung đã sẵn sàng. Bạn có thể bắt đầu code chi tiết chức năng này.
        </div>
    </div>
);

export default AdminLayout;