import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen, Check } from 'lucide-react';
import axios from './axios';

const Register = ({ onSwitchToLogin, onRegisterSuccess }) => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const hasMinLength = password.length >= 8;
    const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasNumberSpecial = /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Mật khẩu xác nhận không khớp!');
            return;
        }

        if (!hasMinLength || !hasUpperLower || !hasNumberSpecial) {
            setErrorMessage('Vui lòng đặt mật khẩu thỏa mãn tất cả tiêu chí bên dưới.');
            return;
        }

        setLoading(true);
        const normalizedEmail = email.trim().toLowerCase();

        try {
            await axios.post('/api/auth/register', {
                fullName: fullName.trim(),
                email: normalizedEmail,
                password: password,
            });

            setSuccessMessage('Đăng ký thành công! Đang chuyển sang xác thực OTP...');

            // Chuyển sang màn hình xác thực OTP sau 1 giây
            setTimeout(() => {
                if (onRegisterSuccess) {
                    onRegisterSuccess(normalizedEmail);
                }
            }, 1000);

        } catch (error) {
            if (error.response && error.response.data) {
                setErrorMessage(error.response.data.message || 'Đăng ký thất bại. Email có thể đã tồn tại!');
            } else {
                setErrorMessage('Không thể kết nối đến máy chủ Backend!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF7F8] font-sans p-4 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6 z-10">
                <div className="bg-gradient-to-br from-[#F48FB1] to-[#F06292] p-2.5 rounded-2xl shadow-sm">
                    <BookOpen className="text-white w-7 h-7" strokeWidth={2.5} />
                </div>
                <h1 className="text-[22px] font-extrabold text-[#373A4D]">Korean With Me</h1>
            </div>

            <div className="bg-white rounded-[32px] w-full max-w-[440px] p-8 md:p-9 z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50">
                <div className="mb-6">
                    <p className="text-[#F06292] text-xs font-bold tracking-widest mb-1">새로운 시작</p>
                    <h2 className="text-[30px] font-extrabold text-[#373A4D] tracking-tight mb-1">Tạo tài khoản mới</h2>
                    <p className="text-gray-500 text-xs font-medium leading-relaxed">
                        Cùng nhau học tiếng Hàn và chinh phục những mục tiêu của bạn!
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium text-center">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium text-center">
                        {successMessage}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleRegister}>
                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-1.5">Họ và tên</label>
                        <input
                            type="text"
                            placeholder="Nhập họ và tên"
                            disabled={loading || !!successMessage}
                            className="w-full px-5 py-3 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400 disabled:bg-gray-50"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-1.5">Email</label>
                        <input
                            type="email"
                            placeholder="Nhập email của bạn"
                            disabled={loading || !!successMessage}
                            className="w-full px-5 py-3 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400 disabled:bg-gray-50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-1.5">Mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                disabled={loading || !!successMessage}
                                className="w-full pl-5 pr-12 py-3 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400 disabled:bg-gray-50"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-1.5">Xác nhận mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Nhập lại mật khẩu"
                                disabled={loading || !!successMessage}
                                className="w-full pl-5 pr-12 py-3 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400 disabled:bg-gray-50"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <Eye size={18} strokeWidth={2} /> : <EyeOff size={18} strokeWidth={2} />}
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
                        className={`w-full bg-[#F48FB1] hover:bg-[#F06292] text-white font-bold text-[15px] py-3.5 rounded-[24px] mt-2 shadow-[0_8px_20px_-6px_rgba(244,143,177,0.6)] transition-all uppercase tracking-wide ${loading || successMessage ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Đang khởi tạo...' : successMessage ? 'Chuyển xác thực...' : 'ĐĂNG KÝ'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500 font-medium">
                    Đã có tài khoản?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-[#F06292] font-bold hover:underline"
                    >
                        Đăng nhập ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;