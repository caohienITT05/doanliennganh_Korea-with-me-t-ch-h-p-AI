import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Check } from 'lucide-react';
import axios from './axios';

const ResetPassword = ({ email, onSwitchToLogin }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const hasMinLength = newPassword.length >= 8;
    const hasUpperLower = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
    const hasNumberSpecial = /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);

    const handleReset = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (newPassword !== confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp!');
            return;
        }

        if (!hasMinLength || !hasUpperLower || !hasNumberSpecial) {
            setErrorMessage('Vui lòng đặt mật khẩu thỏa mãn các tiêu chí bảo mật.');
            return;
        }

        setLoading(true);

        try {
            await axios.post('/api/auth/reset-password', {
                email: email,
                newPassword: newPassword,
            });

            setSuccessMessage('🎉 Đổi mật khẩu thành công! Đang chuyển sang màn hình đăng nhập...');
            setTimeout(() => {
                onSwitchToLogin();
            }, 1500);

        } catch (error) {
            if (error.response && error.response.data) {
                setErrorMessage(error.response.data.message || 'Đổi mật khẩu thất bại!');
            } else {
                setErrorMessage('Không thể kết nối tới máy chủ!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7F8] font-sans p-4 relative overflow-hidden">
            {/* LOGO */}
            <div className="flex items-center gap-3 mb-6 z-10">
                <div className="bg-gradient-to-br from-[#F48FB1] to-[#F06292] p-2.5 rounded-2xl shadow-sm">
                    <BookOpen className="text-white w-7 h-7" strokeWidth={2.5} />
                </div>
                <h1 className="text-[22px] font-extrabold text-[#373A4D]">Korean With Me</h1>
            </div>

            {/* CARD */}
            <div className="bg-white rounded-[32px] w-full max-w-[440px] p-8 md:p-9 z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50">
                <div className="mb-6 text-center">
                    <p className="text-[#F06292] text-xs font-bold tracking-widest mb-1">비밀번호 재설정</p>
                    <h2 className="text-[28px] font-extrabold text-[#373A4D] tracking-tight mb-1">Đặt lại mật khẩu</h2>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Nhập mật khẩu mới cho tài khoản <span className="text-[#F06292] font-bold">{email}</span>
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium text-center">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium text-center animate-pulse">
                        {successMessage}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleReset}>
                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-1.5">Mật khẩu mới</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu mới"
                                disabled={loading || !!successMessage}
                                className="w-full pl-5 pr-12 py-3 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-1.5">Xác nhận mật khẩu mới</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Nhập lại mật khẩu mới"
                                disabled={loading || !!successMessage}
                                className="w-full pl-5 pr-12 py-3 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#FFF5F6] rounded-2xl p-3.5 space-y-1.5 text-xs">
                        <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-600' : 'text-gray-500'}`}>
                            <Check size={14} className={hasMinLength ? 'text-emerald-600' : 'text-gray-400'} strokeWidth={3} />
                            <span>Tối thiểu 8 ký tự</span>
                        </div>
                        <div className={`flex items-center gap-2 ${hasUpperLower ? 'text-emerald-600' : 'text-gray-500'}`}>
                            <Check size={14} className={hasUpperLower ? 'text-emerald-600' : 'text-gray-400'} strokeWidth={3} />
                            <span>Có chữ hoa, chữ thường</span>
                        </div>
                        <div className={`flex items-center gap-2 ${hasNumberSpecial ? 'text-emerald-600' : 'text-gray-500'}`}>
                            <Check size={14} className={hasNumberSpecial ? 'text-emerald-600' : 'text-gray-400'} strokeWidth={3} />
                            <span>Có số và ký tự đặc biệt</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !!successMessage}
                        className={`w-full bg-[#F48FB1] hover:bg-[#F06292] text-white font-bold text-[15px] py-3.5 rounded-[24px] shadow-[0_8px_20px_-6px_rgba(244,143,177,0.6)] transition-all uppercase tracking-wide ${loading || successMessage ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Đang cập nhật...' : 'ĐỔI MẬT KHẨU'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;