import React, { useState } from 'react';
import { BookOpen, Send, ArrowLeft } from 'lucide-react';
import axios from './axios';

const ForgotPassword = ({ onSwitchToLogin, onOtpSent }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setLoading(true);

        try {
            // Gửi yêu cầu sinh và gửi OTP qua mail tới Backend
            await axios.post('/api/auth/forgot-password', { email });
            onOtpSent(email); // Chuyển sang màn hình xác thực OTP và truyền email
        } catch (error) {
            if (error.response && error.response.data) {
                setErrorMessage(error.response.data.message || 'Không tìm thấy tài khoản với email này!');
            } else {
                setErrorMessage('Không thể kết nối đến máy chủ Backend!');
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

            {/* CARD CHÍNH */}
            <div className="bg-white rounded-[32px] w-full max-w-[420px] p-8 md:p-10 z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50 text-center">
                {/* Minh họa phong thư */}
                <div className="relative w-28 h-24 mx-auto mb-6 flex items-center justify-center">
                    <div className="w-24 h-16 bg-[#FFF0F4] border-2 border-[#F48FB1] rounded-xl relative shadow-inner flex items-center justify-center">
                        {/* Nắp phong thư */}
                        <div className="absolute -top-3 w-0 h-0 border-l-[46px] border-l-transparent border-r-[46px] border-r-transparent border-t-[28px] border-t-[#F8BBD0]"></div>
                        {/* Huy hiệu tim */}
                        <div className="absolute -top-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-pink-100 z-10">
                            <span className="text-[#F06292] text-xs">♥</span>
                        </div>
                        <span className="text-[#F06292] text-[10px] font-medium absolute -bottom-4 right-0">편지</span>
                    </div>
                </div>

                {/* Tiêu đề */}
                <p className="text-[#F06292] text-xs font-bold tracking-widest mb-1">다시 시작해요</p>
                <h2 className="text-[28px] font-extrabold text-[#373A4D] mb-2 tracking-tight">Quên mật khẩu?</h2>
                <p className="text-gray-500 text-xs leading-relaxed mb-6 px-2">
                    Nhập email của bạn, chúng tôi sẽ gửi mã xác thực để bạn đặt lại mật khẩu.
                </p>

                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 text-left">
                    <div>
                        <label className="block text-sm font-bold text-[#373A4D] mb-2">Email</label>
                        <input
                            type="email"
                            placeholder="Nhập email đã đăng ký"
                            className="w-full px-5 py-3.5 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-[#F48FB1] hover:bg-[#F06292] text-white font-bold text-[15px] py-4 rounded-[24px] shadow-[0_8px_20px_-6px_rgba(244,143,177,0.6)] transition-all uppercase tracking-wide flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                    >
                        <Send size={16} />
                        {loading ? 'Đang gửi...' : 'GỬI MÃ XÁC THỰC'}
                    </button>
                </form>

                <div className="mt-7">
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-xs font-bold text-[#F06292] hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                        <ArrowLeft size={14} /> Quay lại đăng nhập
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;