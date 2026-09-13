import React, { useState, useRef, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import axios from './axios';

const VerifyOtp = ({ email, flow, onSwitchToLogin, onSwitchToResetPassword }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(60);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const inputRefs = useRef([]);

    // Tự động focus vào ô đầu tiên khi mở trang
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    // Đếm ngược gửi lại mã
    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    const maskEmail = (mail) => {
        if (!mail) return '';
        const [name, domain] = mail.split('@');
        if (!domain) return mail;
        const masked = name.length > 2 ? `${name[0]}******` : `${name}******`;
        return `${masked}@${domain}`;
    };

    // Xử lý nhập số: Ghi đè trực tiếp & nhảy ô mượt mà
    const handleChange = (index, e) => {
        const val = e.target.value;
        const numbersOnly = val.replace(/\D/g, ''); // Chỉ lấy ký tự số

        // Nếu người dùng paste cả 6 số vào bất kỳ ô nào
        if (numbersOnly.length === 6) {
            const digits = numbersOnly.split('');
            setOtp(digits);
            inputRefs.current[5]?.focus();
            return;
        }

        const newOtp = [...otp];

        if (!numbersOnly) {
            newOtp[index] = '';
            setOtp(newOtp);
            return;
        }

        // Lấy ký tự số mới nhất vừa gõ (ghi đè lên số 0 cũ)
        const lastChar = numbersOnly.slice(-1);
        newOtp[index] = lastChar;
        setOtp(newOtp);

        // Tự động nhảy sang ô tiếp theo
        if (index < 5 && lastChar) {
            inputRefs.current[index + 1]?.focus();
            inputRefs.current[index + 1]?.select();
        }
    };

    // Xử lý phím Backspace (xóa lùi) và phím mũi tên điều hướng
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // Nếu ô hiện tại đã trống -> lùi về ô trước và xóa ô đó
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1]?.focus();
            } else {
                // Xóa ô hiện tại
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
            inputRefs.current[index - 1]?.select();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
            inputRefs.current[index + 1]?.select();
        }
    };

    // Xử lý sự kiện dán chuỗi OTP (Paste)
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '');
        if (pastedData.length >= 6) {
            const digits = pastedData.slice(0, 6).split('');
            setOtp(digits);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const fullCode = otp.join('');

        if (fullCode.length < 6) {
            setErrorMessage('Vui lòng nhập đủ 6 chữ số OTP!');
            return;
        }

        setErrorMessage('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await axios.post('/api/auth/verify-otp', {
                email: email,
                otp: fullCode,
            });

            if (flow === 'register') {
                setSuccessMessage('🎉 Kích hoạt tài khoản thành công! Đang chuyển sang màn hình đăng nhập...');
                setTimeout(() => {
                    onSwitchToLogin();
                }, 1500);
            } else {
                onSwitchToResetPassword(fullCode);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setErrorMessage(error.response.data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn!');
            } else {
                setErrorMessage('Không thể kết nối tới máy chủ!');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timer > 0) return;
        try {
            await axios.post('/api/auth/forgot-password', { email });
            setTimer(60);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
            setErrorMessage('');
        } catch {
            setErrorMessage('Không thể gửi lại mã. Vui lòng thử lại sau!');
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
            <div className="bg-white rounded-[32px] w-full max-w-[420px] p-8 md:p-10 z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 text-center">
                {/* ICON PHONE */}
                <div className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <div className="w-16 h-20 bg-white border-2 border-[#F48FB1] rounded-2xl shadow-sm p-1 flex flex-col items-center justify-between">
                        <div className="w-8 h-1 bg-pink-200 rounded-full mt-1"></div>
                        <div className="bg-[#FFF0F4] w-full py-1.5 rounded-lg flex justify-center gap-0.5">
                            <span className="w-1.5 h-1.5 bg-[#F06292] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[#F06292] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[#F06292] rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-[#F06292] rounded-full"></span>
                        </div>
                        <div className="w-4 h-1 bg-pink-200 rounded-full mb-1"></div>
                    </div>
                    <span className="text-[#F06292] text-[10px] font-medium absolute bottom-0 right-1">인증</span>
                </div>

                <p className="text-[#F06292] text-xs font-bold tracking-widest mb-1">확인 코드</p>
                <h2 className="text-[28px] font-extrabold text-[#373A4D] mb-1 tracking-tight">Xác thực OTP</h2>
                <p className="text-gray-500 text-xs font-medium mb-1">Mã xác thực đã được gửi tới</p>
                <p className="text-[#F06292] text-xs font-bold mb-6">{maskEmail(email)}</p>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium animate-pulse">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleVerify}>
                    {/* 6 Ô NHẬP OTP */}
                    <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                value={digit}
                                onFocus={(e) => e.target.select()} // Tự bôi đen để gõ đè số mới
                                onChange={(e) => handleChange(index, e)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-xl font-bold text-[#373A4D] border-2 border-pink-200 rounded-2xl focus:outline-none focus:border-[#F06292] focus:ring-2 focus:ring-pink-100 bg-[#FFFBFD] transition select-all"
                            />
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 font-medium mb-6">
                        Gửi lại mã sau <span className="text-[#373A4D] font-bold">{`00:${timer < 10 ? `0${timer}` : timer}`}</span>
                    </p>

                    <button
                        type="submit"
                        disabled={loading || !!successMessage}
                        className={`w-full bg-[#F48FB1] hover:bg-[#F06292] text-white font-bold text-[15px] py-4 rounded-[24px] shadow-[0_8px_20px_-6px_rgba(244,143,177,0.6)] transition-all uppercase tracking-wide ${loading || successMessage ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Đang xác nhận...' : 'XÁC NHẬN'}
                    </button>

                    <div className="mt-4">
                        <button
                            type="button"
                            disabled={timer > 0}
                            onClick={handleResend}
                            className={`text-xs font-bold ${timer > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-[#F06292] hover:underline'}`}
                        >
                            Gửi lại mã
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VerifyOtp;