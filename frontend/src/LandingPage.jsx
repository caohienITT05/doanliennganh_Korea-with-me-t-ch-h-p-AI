import React, { useState, useEffect } from 'react';
import {
    BookOpen, Sparkles, GraduationCap, Lock, Unlock,
    ArrowRight, Play, CheckCircle2, Award, Clock,
    ChevronRight, LogIn, UserPlus, X, HelpCircle, Layers
} from 'lucide-react';
import axios from './axios';

const LandingPage = ({ onNavigateLogin, onNavigateRegister, onSelectLesson }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [previewCourseData, setPreviewCourseData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
    const [selectedTarget, setSelectedTarget] = useState('');

    const isLoggedIn = Boolean(localStorage.getItem('token'));
    const userFullName = localStorage.getItem('userFullName') || 'Học viên';

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get('/api/public/courses');
                setCourses(res.data);
            } catch (err) {
                console.error("Không thể tải danh sách khóa học:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // Mở modal xem trước danh sách bài học
    const handleOpenPreview = async (courseId) => {
        try {
            const res = await axios.get(`/api/public/courses/${courseId}/preview`);
            setPreviewCourseData(res.data);
            setShowPreviewModal(true);
        } catch {
            alert("Không thể tải thông tin bài học của khóa này!");
        }
    };

    // Bộ chặn quyền (Auth Guard): Chưa đăng nhập -> Hiện popup yêu cầu Login
    const handleAccessAction = (actionType, data = null) => {
        if (!isLoggedIn) {
            setSelectedTarget(actionType);
            setShowAuthRequiredModal(true);
            return;
        }

        // Đã đăng nhập: Điều hướng sang màn hình học tương ứng
        if (actionType === 'LESSON' && onSelectLesson) {
            setShowPreviewModal(false);
            onSelectLesson(data);
        } else if (actionType === 'TOPIK') {
            alert("Chuyển sang module phòng thi TOPIK!");
        }
    };

    return (
        <div className="min-h-screen bg-[#FFF9FA] text-[#373A4D] font-sans selection:bg-[#F06292] selection:text-white">

            {/* 1. NAVBAR HIỆU ỨNG FROSTED GLASS */}
            <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 py-4 transition">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F06292] to-[#ff8bb1] flex items-center justify-center text-white shadow-md shadow-pink-200">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <span className="text-lg font-black tracking-tight text-[#373A4D] block leading-none">
                                Korean With Me
                            </span>
                            <span className="text-[10px] font-extrabold text-[#F06292] uppercase tracking-wider">
                                한국어 공부
                            </span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold text-gray-600">
                        <a href="#courses" className="hover:text-[#F06292] transition">Khóa học & Giáo trình</a>
                        <a href="#features" className="hover:text-[#F06292] transition">Phương pháp học</a>
                        <a href="#topik" className="hover:text-[#F06292] transition">Luyện thi TOPIK</a>
                    </nav>

                    <div className="flex items-center gap-3">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-3 bg-pink-50/80 px-3.5 py-1.5 rounded-2xl border border-pink-100">
                                <div className="w-7 h-7 rounded-xl bg-[#F06292] text-white flex items-center justify-center text-xs font-bold">
                                    {userFullName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-bold text-[#373A4D]">{userFullName}</span>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={onNavigateLogin}
                                    className="px-4 py-2 text-xs font-extrabold text-gray-600 hover:text-[#F06292] transition flex items-center gap-1.5"
                                >
                                    <LogIn size={15} /> Đăng nhập
                                </button>
                                <button
                                    onClick={onNavigateRegister}
                                    className="px-5 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-extrabold rounded-2xl transition shadow-md shadow-pink-200 flex items-center gap-1.5"
                                >
                                    <UserPlus size={15} /> Bắt đầu ngay
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* 2. HERO SECTION NỔI BẬT */}
            <section className="relative overflow-hidden pt-12 pb-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/60 border border-pink-200 text-[#F06292] text-xs font-black">
                            <Sparkles size={14} className="animate-pulse" />
                            Nền tảng học tiếng Hàn thông minh & Luyện thi TOPIK
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black text-[#373A4D] leading-tight tracking-tight">
                            Chinh phục tiếng Hàn từ <span className="text-[#F06292]">Sơ cấp</span> tới chuẩn <span className="underline decoration-pink-300 decoration-wavy">TOPIK II</span>
                        </h1>

                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Học từ vựng qua Flashcard 3D, làm chủ cấu trúc ngữ pháp với ví dụ thực tế và trải nghiệm phòng thi bấm giờ trực quan.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                            <a
                                href="#courses"
                                className="w-full sm:w-auto px-7 py-3.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-lg shadow-pink-200 transition flex items-center justify-center gap-2 group"
                            >
                                Khám phá khóa học
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                            </a>
                            <a
                                href="#topik"
                                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-pink-200 text-[#F06292] hover:bg-pink-50 text-xs font-extrabold rounded-2xl transition flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Award size={16} /> Thi thử TOPIK miễn phí
                            </a>
                        </div>

                        {/* Thống kê nhanh */}
                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-pink-100 max-w-md mx-auto lg:mx-0">
                            <div>
                                <p className="text-xl font-black text-[#F06292]">100%</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase">Lộ trình chuẩn</p>
                            </div>
                            <div>
                                <p className="text-xl font-black text-[#373A4D]">Flashcard</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase">Phát âm AI TTS</p>
                            </div>
                            <div>
                                <p className="text-xl font-black text-[#373A4D]">TOPIK I & II</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase">Bấm giờ chuẩn</p>
                            </div>
                        </div>
                    </div>

                    {/* Card nổi bên phải */}
                    <div className="lg:col-span-5 relative flex justify-center">
                        <div className="w-full max-w-sm bg-white rounded-3xl p-6 border border-pink-100 shadow-[0_20px_50px_rgba(240,98,146,0.12)] relative z-10 space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                                <span className="text-xs font-black text-[#373A4D]">Xem trước thẻ Flashcard</span>
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-full">Sơ cấp 1</span>
                            </div>
                            <div className="h-44 bg-gradient-to-tr from-[#FFF5F7] to-pink-50 rounded-2xl border border-pink-100 flex flex-col items-center justify-center p-4 text-center">
                                <span className="text-2xl font-black text-[#373A4D] tracking-wide mb-1">안녕하세요</span>
                                <span className="text-xs font-bold text-[#F06292]">/an-nyeong-ha-se-yo/</span>
                                <p className="text-xs font-medium text-gray-500 mt-2">Xin chào! (Lời chào chuẩn mực)</p>
                            </div>
                            <div className="p-3 bg-pink-50/50 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-600">
                                <span>Ngữ pháp: N + 은/는</span>
                                <span className="text-[11px] text-[#F06292]">Trợ từ chủ đề</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. DANH MỤC KHÓA HỌC (COURSE CATALOG) */}
            <section id="courses" className="py-16 px-6 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
                    <span className="text-xs font-black text-[#F06292] uppercase tracking-wider">Danh mục khóa học</span>
                    <h2 className="text-3xl font-black text-[#373A4D]">Lộ trình từ cơ bản tới nâng cao</h2>
                    <p className="text-xs text-gray-500 font-medium">
                        Chọn khóa học phù hợp với trình độ hiện tại. Mọi khóa học đều hỗ trợ xem trước danh sách bài học.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-xs font-bold text-gray-400">Đang tải danh sách khóa học...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white rounded-3xl border border-pink-100 p-5 shadow-sm hover:shadow-md hover:border-pink-300 transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 mb-4">
                                        {course.thumbnailUrl ? (
                                            <img src={course.thumbnailUrl} alt={course.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-[#F06292]">
                                                <BookOpen size={36} />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${course.isFree
                                                    ? 'bg-emerald-500 text-white'
                                                    : 'bg-[#F06292] text-white'
                                                }`}>
                                                {course.isFree ? 'MIỄN PHÍ' : 'TÍNH PHÍ'}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-[#373A4D] line-clamp-1">{course.name}</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                                        {course.description || 'Khóa học cung cấp vốn từ vựng nền tảng và các dạng bài tập thực hành toàn diện.'}
                                    </p>

                                    <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">Học phí:</span>
                                            <p className="text-base font-black text-[#F06292]">
                                                {course.isFree ? 'Miễn phí 100%' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-5">
                                    <button
                                        onClick={() => handleOpenPreview(course.id)}
                                        className="py-2.5 px-3 bg-[#FFF5F7] hover:bg-pink-100 text-[#F06292] text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1"
                                    >
                                        <Layers size={14} /> Xem bài học
                                    </button>
                                    <button
                                        onClick={() => handleOpenPreview(course.id)}
                                        className="py-2.5 px-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-extrabold rounded-xl shadow-sm transition flex items-center justify-center gap-1"
                                    >
                                        <Play size={14} /> Học ngay
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 4. KHU VỰC GIỚI THIỆU PHÒNG THI TOPIK */}
            <section id="topik" className="py-16 px-6 max-w-7xl mx-auto">
                <div className="bg-gradient-to-tr from-[#373A4D] to-[#4c5067] rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <span className="px-3 py-1 bg-pink-500/30 text-pink-300 text-[11px] font-extrabold rounded-full border border-pink-400/20 uppercase tracking-wider">
                            Phòng thi mô phỏng
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                            Luyện thi TOPIK I & II với đề thi thực tế
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                            Trải nghiệm môi trường bấm giờ y như thi thật: Phần Đọc hiểu chuẩn cấu trúc và phần Nghe tích hợp file Audio chuẩn giọng đọc người Hàn.
                        </p>

                        <div className="pt-2 flex flex-wrap gap-3">
                            <button
                                onClick={() => handleAccessAction('TOPIK')}
                                className="px-6 py-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-lg transition flex items-center gap-2"
                            >
                                <Award size={16} /> Vào phòng thi thử ngay
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ========================================================================= */}
            {/* MODAL 1: XEM TRƯỚC DANH SÁCH BÀI HỌC (PREVIEW LỘ TRÌNH) */}
            {/* ========================================================================= */}
            {showPreviewModal && previewCourseData && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                            <div>
                                <span className="text-[10px] font-extrabold text-[#F06292] uppercase">Lộ trình bài giảng</span>
                                <h3 className="text-lg font-black text-[#373A4D]">{previewCourseData.course.name}</h3>
                            </div>
                            <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            {previewCourseData.course.description || 'Khóa học bao gồm đầy đủ bài giảng từ vựng và ngữ pháp.'}
                        </p>

                        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
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
                                            className="p-3.5 bg-[#FFF9FA] hover:bg-pink-50/50 rounded-2xl border border-pink-100 flex items-center justify-between transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white border border-pink-200 text-[#F06292] font-black text-xs flex items-center justify-center shadow-xs">
                                                    {lesson.orderIndex}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-[#373A4D]">{lesson.title}</p>
                                                    <span className="text-[10px] text-gray-400 font-medium">Flashcard, Quiz, Ngữ pháp</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleAccessAction('LESSON', lesson)}
                                                className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition ${isLocked
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
            {/* MODAL 2: BẮT BUỘC ĐĂNG NHẬP (AUTH INTERCEPTION POPUP) */}
            {/* ========================================================================= */}
            {showAuthRequiredModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
                        <div className="w-14 h-14 bg-pink-100 text-[#F06292] rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                            <Lock size={28} />
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-[#373A4D]">Yêu cầu đăng nhập</h3>
                            <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                                Vui lòng đăng nhập hoặc tạo tài khoản miễn phí để lưu lại tiến trình học tập và bảng điểm làm bài của bạn.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => { setShowAuthRequiredModal(false); onNavigateLogin(); }}
                                className="w-full py-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-md shadow-pink-200 transition"
                            >
                                Đăng nhập tài khoản
                            </button>
                            <button
                                onClick={() => { setShowAuthRequiredModal(false); onNavigateRegister(); }}
                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-extrabold rounded-2xl transition"
                            >
                                Tạo tài khoản mới
                            </button>
                            <button
                                onClick={() => setShowAuthRequiredModal(false)}
                                className="text-[11px] font-bold text-gray-400 hover:text-gray-600 pt-1"
                            >
                                Để sau
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. FOOTER */}
            <footer className="bg-white border-t border-pink-100 py-8 px-6 mt-16 text-center text-xs font-bold text-gray-400">
                <p>© 2026 Korean With Me. Học tiếng Hàn giao tiếp & Luyện thi TOPIK thông minh.</p>
            </footer>

        </div>
    );
};

export default LandingPage;