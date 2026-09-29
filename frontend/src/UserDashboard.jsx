import React, { useState, useEffect } from 'react';

import {
    LayoutGrid, Map, Search, BookA, FileText, RotateCw,
    ClipboardList, Crown, Trophy, Settings, ShieldCheck,
    LogIn, LogOut, ChevronDown, ChevronRight, BookOpen,
    Sparkles, Lock, Play, X, CheckCircle2, Award, ArrowRight,
    Heart, Layers
} from 'lucide-react';
import axios from './axios';

const UserDashboard = ({ user, onNavigateLogin, onNavigateRegister, onSelectLesson, onLogout, onNavigateAdmin, onNavigateTopikExam }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeMenu, setActiveMenu] = useState('home');

    // Preview Modal State
    const [previewCourseData, setPreviewCourseData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Auth Guard Modal State
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalTitle, setAuthModalTitle] = useState('');

    // 1. Fetch danh sách khóa học thực tế từ MySQL
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get('/api/public/courses');
                setCourses(res.data);
            } catch (err) {
                console.error("Lỗi tải khóa học:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // 2. Mở Modal xem trước lộ trình bài học
    const handleOpenPreview = async (courseId) => {
        setPreviewLoading(true);
        try {
            const res = await axios.get(`/api/public/courses/${courseId}/preview`);
            setPreviewCourseData(res.data);
            setShowPreviewModal(true);
        } catch {
            alert("Không thể tải danh sách bài học của khóa này!");
        } finally {
            setPreviewLoading(false);
        }
    };

    // 3. Xử lý khi bấm vào bài học / đề thi
    const handleActionClick = (type, data = null) => {
        if (!user) {
            setAuthModalTitle(type === 'TOPIK' ? 'Luyện đề thi TOPIK' : 'Vào học bài giảng');
            setShowAuthModal(true);
            return;
        }

        if (type === 'LESSON' && onSelectLesson) {
            setShowPreviewModal(false);
            onSelectLesson(data);
        } else if (type === 'TOPIK') {
            alert(`Đang mở phòng thi TOPIK cấp độ ${data}!`);
        }
    };

    // Mảng màu pastel cho các thẻ giáo trình
    const pastelThemes = [
        { bg: 'bg-[#FFF0F4]', border: 'border-[#FFD0DE]', text: 'text-[#F06292]', badge: 'bg-[#F06292]' },
        { bg: 'bg-[#FFF5ED]', border: 'border-[#FFE0CC]', text: 'text-[#FF8A65]', badge: 'bg-[#FF8A65]' },
        { bg: 'bg-[#FEFCE8]', border: 'border-[#FEF08A]', text: 'text-[#EAB308]', badge: 'bg-[#EAB308]' },
        { bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]', text: 'text-[#22C55E]', badge: 'bg-[#22C55E]' },
        { bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]', text: 'text-[#3B82F6]', badge: 'bg-[#3B82F6]' },
        { bg: 'bg-[#FAF5FF]', border: 'border-[#E9D5FF]', text: 'text-[#A855F7]', badge: 'bg-[#A855F7]' },
    ];

    return (
        <div className="flex min-h-screen bg-[#FFF5F7] text-[#373A4D] font-sans">

            {/* ========================================================================= */}
            {/* 1. THANH SIDEBAR BÊN TRÁI (CHIA MENU CHUẨN MẪU ẢNH) */}
            {/* ========================================================================= */}
            <aside className="w-64 bg-white border-r border-pink-100 flex flex-col justify-between shrink-0 p-5 select-none shadow-[4px_0_24px_rgba(240,98,146,0.03)]">
                <div>
                    {/* Logo Header */}
                    <div className="flex items-center gap-3 px-2 pb-6 border-b border-pink-50">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F06292] to-[#FF8BB1] flex items-center justify-center text-white shadow-md shadow-pink-200">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h1 className="text-base font-black text-[#373A4D] leading-tight">Korean With Me</h1>
                            <span className="text-[11px] font-bold text-[#F06292]">함께하는 한국어</span>
                        </div>
                    </div>

                    {/* Menu HỌC TẬP */}
                    <div className="mt-6 space-y-1">
                        <span className="px-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">HỌC TẬP</span>

                        {/* Trang chủ (Active) */}
                        <button
                            onClick={() => setActiveMenu('home')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition ${activeMenu === 'home'
                                ? 'bg-gradient-to-r from-[#F06292] to-[#FF7597] text-white shadow-md shadow-pink-200'
                                : 'text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292]'
                                }`}
                        >
                            <div className="flex items-center gap-2.5">
                                <LayoutGrid size={16} />
                                <span>Trang chủ</span>
                            </div>
                        </button>

                        {/* Lộ trình */}
                        <button
                            onClick={() => setActiveMenu('roadmap')}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <div className="flex items-center gap-2.5">
                                <Map size={16} />
                                <span>Lộ trình</span>
                            </div>
                            <span className="px-2 py-0.5 bg-[#FFD54F] text-[#6D4C41] text-[10px] font-extrabold rounded-full">
                                demo
                            </span>
                        </button>

                        {/* Tra từ điển */}
                        <button
                            onClick={() => setActiveMenu('dictionary')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <Search size={16} />
                            <span>Tra từ điển</span>
                        </button>

                        {/* Từ vựng */}
                        <button
                            onClick={() => setActiveMenu('vocab')}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <div className="flex items-center gap-2.5">
                                <BookA size={16} />
                                <span>Từ vựng</span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>

                        {/* Ngữ pháp */}
                        <button
                            onClick={() => setActiveMenu('grammar')}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <div className="flex items-center gap-2.5">
                                <FileText size={16} />
                                <span>Ngữ pháp</span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>

                        {/* Ôn tập */}
                        <button
                            onClick={() => setActiveMenu('review')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <RotateCw size={16} />
                            <span>Ôn tập</span>
                        </button>

                        {/* Luyện đề */}
                        <button
                            onClick={onNavigateTopikExam}
                            className="px-4 py-2 bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white text-xs font-black rounded-2xl shadow-xs hover:opacity-90 transition flex items-center gap-1.5"
                        >
                            <span>Luyện thi TOPIK</span>
                        </button>

                        {/* AI VIP */}
                        <button
                            onClick={() => setActiveMenu('ai-vip')}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <div className="flex items-center gap-2.5">
                                <Crown size={16} className="text-amber-500" />
                                <span>AI VIP</span>
                            </div>
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>

                        {/* Bảng xếp hạng */}
                        <button
                            onClick={() => setActiveMenu('ranking')}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-gray-600 hover:bg-pink-50/70 hover:text-[#F06292] transition"
                        >
                            <div className="flex items-center gap-2.5">
                                <Trophy size={16} className="text-rose-400" />
                                <span>Bảng xếp hạng</span>
                            </div>
                            <span className="text-amber-500 text-xs">✨</span>
                        </button>
                    </div>

                    {/* Menu phụ: Cài đặt & Điều khoản */}
                    <div className="mt-6 pt-4 border-t border-pink-50 space-y-1">
                        <button className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-gray-500 hover:text-[#F06292] transition">
                            <Settings size={15} />
                            <span>Cài đặt</span>
                        </button>
                        <button className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-gray-500 hover:text-[#F06292] transition">
                            <ShieldCheck size={15} />
                            <span>Điều khoản</span>
                        </button>
                    </div>
                </div>

                {/* Góc dưới Sidebar: Trạng thái tài khoản & Nút Đăng nhập */}
                <div className="pt-4 border-t border-pink-100 space-y-2">
                    {user ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 bg-pink-50/80 rounded-2xl border border-pink-100">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-[#F06292] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm">
                                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-[#373A4D] truncate">{user.fullName || 'Học viên'}</p>
                                        <span className="text-[10px] text-[#F06292] font-extrabold uppercase">{user.role || 'USER'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={onLogout}
                                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
                                    title="Đăng xuất"
                                >
                                    <LogOut size={15} />
                                </button>
                            </div>

                            {/* Nút vào trang Admin nếu tài khoản có quyền ADMIN */}
                            {user.role === 'ADMIN' && (
                                <button
                                    onClick={onNavigateAdmin}
                                    className="w-full py-2 bg-[#373A4D] hover:bg-[#252837] text-white text-[11px] font-black rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                                >
                                    <Crown size={13} className="text-amber-400" />
                                    Vào trang Quản trị
                                </button>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onNavigateLogin}
                            className="w-full py-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl transition shadow-md shadow-pink-200 flex items-center justify-center gap-2"
                        >
                            <LogIn size={15} />
                            Đăng nhập
                        </button>
                    )}
                </div>
            </aside>

            {/* ========================================================================= */}
            {/* 2. KHU VỰC NỘI DUNG CHÍNH (MAIN CONTENT AREA) */}
            {/* ========================================================================= */}
            <main className="flex-1 overflow-y-auto p-8 space-y-8">

                {/* HERO BANNER: THIẾT KẾ ĐÚNG HÌNH MẪU CUNG ĐIỆN & HOA ANH ĐÀO */}
                <div className="relative overflow-hidden bg-gradient-to-r from-[#FFF5F7] via-[#FFF0F4] to-[#FFE8EE] rounded-3xl p-8 border border-pink-100 shadow-[0_4px_24px_rgba(240,98,146,0.06)]">
                    {/* Họa tiết hoa anh đào / mây mờ góc phải */}
                    <div className="absolute right-0 top-0 bottom-0 w-80 opacity-20 pointer-events-none flex items-center justify-end pr-6">
                        <span className="text-[120px] select-none">🌸</span>
                    </div>

                    <div className="relative z-10 max-w-2xl space-y-3">
                        <h2 className="text-2xl sm:text-3xl font-black text-[#373A4D]">
                            Học tiếng Hàn cùng <span className="text-[#F06292]">Korean With Me</span> 💕
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                            Không chỉ là nghĩa của từ mà là cách dùng đúng của từ trong câu ví dụ.
                            Website này sẽ giúp bạn nắm được nghĩa từ vựng, cách phát âm, ngữ pháp và ghi nhớ lâu bằng flashcard (Spaced Repetition).
                        </p>
                    </div>
                </div>

                {/* ===================================================================== */}
                {/* HÀNG 1: LUYỆN THI TOPIK (5 CẤP ĐỘ KHUNG VIỀN HOA HỒNG PASTEL) */}
                {/* ===================================================================== */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#F06292] flex items-center justify-center shadow-xs">
                            <BookOpen size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#373A4D]">Luyện thi TOPIK chuẩn đề thực tế</h3>
                            <p className="text-[11px] font-bold text-gray-400">Dành cho người Việt</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((level) => (
                            <div
                                key={level}
                                onClick={() => handleActionClick('TOPIK', level)}
                                className="group cursor-pointer bg-gradient-to-b from-white to-[#FFF0F4] rounded-3xl border border-pink-200 p-4 shadow-sm hover:shadow-md hover:border-pink-400 hover:-translate-y-1 transition duration-200 flex flex-col items-center justify-between text-center min-h-[175px] relative overflow-hidden"
                            >
                                {/* Vòng hoa tròn mờ */}
                                <div className="w-20 h-20 rounded-full border-2 border-dashed border-pink-200 flex flex-col items-center justify-center p-2 mt-1 bg-white/70 group-hover:border-[#F06292] transition">
                                    <span className="text-xs font-black text-[#373A4D] group-hover:text-[#F06292] transition tracking-wide">
                                        TOPIK
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400">dành cho người Việt</span>
                                </div>

                                {/* Số cấp độ lớn ở góc */}
                                <div className="w-full flex items-end justify-between pt-3">
                                    <span className="text-[10px] font-black text-[#F06292] bg-pink-100/70 px-2 py-0.5 rounded-md">
                                        Cấp {level}
                                    </span>
                                    <span className="text-3xl font-black text-pink-200 group-hover:text-[#F06292] transition">
                                        {level}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ===================================================================== */}
                {/* HÀNG 2: BỘ GIÁO TRÌNH CÁC CẤP ĐỘ (ĐỘNG TỪ DATABASE MYSQL) */}
                {/* ===================================================================== */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-pink-100 text-[#F06292] flex items-center justify-center shadow-xs">
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-[#373A4D]">Bộ giáo trình tiếng Hàn các cấp độ</h3>
                            <p className="text-[11px] font-bold text-gray-400">Lộ trình bài giảng & Từ vựng Flashcard</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-pink-100">
                            Đang tải danh mục khóa học từ cơ sở dữ liệu...
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="py-12 text-center text-xs font-bold text-gray-400 bg-white rounded-3xl border border-pink-100">
                            Chưa có khóa học nào được mở. Vui lòng vào trang Admin để tạo khóa học!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {courses.map((c, index) => {
                                const theme = pastelThemes[index % pastelThemes.length];
                                return (
                                    <div
                                        key={c.id}
                                        className={`${theme.bg} rounded-3xl border ${theme.border} p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between`}
                                    >
                                        <div>
                                            {/* Huy hiệu nhỏ trên cùng */}
                                            <div className="flex items-center justify-between gap-2 mb-3">
                                                <span className="text-[10px] font-bold text-gray-500">Dành cho người Việt</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase text-white ${c.isFree ? 'bg-emerald-500' : 'bg-[#F06292]'
                                                    }`}>
                                                    {c.isFree ? 'Miễn phí' : `${new Intl.NumberFormat('vi-VN').format(c.price)} đ`}
                                                </span>
                                            </div>

                                            {/* Bìa sách & Tên khóa học */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-16 rounded-xl overflow-hidden bg-white border border-pink-100 shrink-0 shadow-xs">
                                                    {c.thumbnailUrl ? (
                                                        <img src={c.thumbnailUrl} alt={c.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[#F06292]">
                                                            <BookOpen size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-sm font-black text-[#373A4D] line-clamp-1">{c.name}</h4>
                                                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                                                        {c.description || 'Giáo trình chuẩn từ vựng và ngữ pháp thực hành.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nút xem lộ trình bài học */}
                                        <button
                                            onClick={() => handleOpenPreview(c.id)}
                                            className="w-full mt-4 py-2 bg-white hover:bg-pink-50 text-[#F06292] text-xs font-black rounded-xl border border-pink-200 transition flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                            <Layers size={13} />
                                            Xem lộ trình bài học
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </main>

            {/* ========================================================================= */}
            {/* MODAL 1: XEM TRƯỚC LỘ TRÌNH BÀI HỌC (PREVIEW SYLLABUS) */}
            {/* ========================================================================= */}
            {showPreviewModal && previewCourseData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                            <div>
                                <span className="text-[10px] font-extrabold text-[#F06292] uppercase">Lộ trình bài giảng</span>
                                <h3 className="text-base font-black text-[#373A4D]">{previewCourseData.course.name}</h3>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            {previewCourseData.course.description || 'Danh sách toàn bộ các bài học trong giáo trình.'}
                        </p>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {previewCourseData.lessons.length === 0 ? (
                                <div className="text-center py-8 text-xs text-gray-400 font-bold">
                                    Khóa học này đang được chuẩn bị bài giảng.
                                </div>
                            ) : (
                                previewCourseData.lessons.map((lesson, idx) => {
                                    const isLocked = !previewCourseData.course.isFree && idx > 0;
                                    return (
                                        <div
                                            key={lesson.id}
                                            className="p-3 bg-[#FFF9FA] hover:bg-pink-50/60 rounded-2xl border border-pink-100 flex items-center justify-between transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-xl bg-white border border-pink-200 text-[#F06292] font-black text-xs flex items-center justify-center shadow-2xs">
                                                    {lesson.orderIndex}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-[#373A4D]">{lesson.title}</p>
                                                    <span className="text-[10px] text-gray-400 font-medium">Flashcard, Quiz, Ngữ pháp</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleActionClick('LESSON', lesson)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${isLocked
                                                    ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                    : 'bg-[#F06292] hover:bg-[#e05584] text-white shadow-xs'
                                                    }`}
                                            >
                                                {isLocked ? (
                                                    <><Lock size={12} /> Mở khóa</>
                                                ) : (
                                                    <><Play size={12} /> Vào học</>
                                                )}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: BẮT BUỘC ĐĂNG NHẬP (AUTH INTERCEPTOR POPUP) */}
            {/* ========================================================================= */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 bg-pink-100 text-[#F06292] rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                            <Lock size={26} />
                        </div>

                        <div>
                            <h3 className="text-base font-black text-[#373A4D]">Yêu cầu đăng nhập</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                                Bạn cần đăng nhập để truy cập <strong className="text-[#F06292]">{authModalTitle}</strong> và lưu lại tiến trình học tập.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => { setShowAuthModal(false); onNavigateLogin(); }}
                                className="w-full py-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-md shadow-pink-200 transition"
                            >
                                Đăng nhập ngay
                            </button>
                            <button
                                onClick={() => { setShowAuthModal(false); onNavigateRegister(); }}
                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-extrabold rounded-2xl transition"
                            >
                                Tạo tài khoản mới
                            </button>
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 pt-1"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserDashboard;