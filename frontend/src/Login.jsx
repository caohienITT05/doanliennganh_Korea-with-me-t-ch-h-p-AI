import React, { useState } from 'react';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import axios from './axios';

const Login = ({ onSwitchToRegister, onSwitchToForgotPassword, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password: password,
      });

      const { token, role, fullName, email: userEmail } = response.data;

      // Lưu thông tin phiên đăng nhập vào bộ nhớ trình duyệt
      if (token) localStorage.setItem('token', token);
      localStorage.setItem(
        'user',
        JSON.stringify({ email: userEmail || email, fullName, role })
      );

      // Chuyển trang dựa theo quyền đã được phân bổ
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({
          token,
          role,
          fullName,
          email: userEmail || email,
        });
      }
    } catch (error) {
      if (error.response && error.response.data) {
        // Lỗi xác thực từ phía máy chủ Backend
        setErrorMessage(error.response.data.message || 'Email hoặc mật khẩu không chính xác!');
      } else if (error.request) {
        // Lỗi mạng hoặc bị trình duyệt chặn CORS
        setErrorMessage('Không thể kết nối tới máy chủ Backend (CORS hoặc mất mạng)!');
      } else {
        // Lỗi phát sinh trong quá trình chạy script giao diện
        setErrorMessage('Lỗi xử lý hệ thống: ' + error.message);
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

      {/* FORM CARD */}
      <div className="bg-white rounded-[32px] w-full max-w-[420px] p-8 md:p-10 z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-pink-50">
        <div className="mb-6">
          <p className="text-[#F06292] text-xs font-bold tracking-widest mb-1">어서 오세요</p>
          <h2 className="text-[32px] font-extrabold text-[#373A4D] tracking-tight mb-1">Đăng nhập</h2>
          <p className="text-gray-500 text-sm font-medium">Chào mừng bạn quay trở lại!</p>
        </div>

        {/* Thông báo lỗi */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium text-center">
            {errorMessage}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Ô nhập Email */}
          <div>
            <label className="block text-sm font-bold text-[#373A4D] mb-1.5">
              Email hoặc tên đăng nhập
            </label>
            <input
              type="text"
              placeholder="Nhập email hoặc tên đăng nhập"
              disabled={loading}
              className="w-full px-5 py-3.5 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Ô nhập Mật khẩu */}
          <div>
            <label className="block text-sm font-bold text-[#373A4D] mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu"
                disabled={loading}
                className="w-full pl-5 pr-12 py-3.5 rounded-[20px] border border-pink-200 focus:outline-none focus:border-[#F06292] text-sm text-gray-700 placeholder-gray-400"
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

          {/* Ghi nhớ & Quên mật khẩu */}
          <div className="flex justify-between items-center text-sm pt-1">
            <label
              className="flex items-center gap-2 text-gray-600 font-medium cursor-pointer select-none"
              onClick={() => setRememberMe(!rememberMe)}
            >
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  rememberMe ? 'border-[#F06292] bg-[#F06292]' : 'border-gray-300'
                }`}
              >
                {rememberMe && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
              Ghi nhớ đăng nhập
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-[#F06292] font-bold hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          {/* Nút Đăng nhập */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#F48FB1] hover:bg-[#F06292] text-white font-bold text-[15px] py-4 rounded-[24px] mt-2 shadow-[0_8px_20px_-6px_rgba(244,143,177,0.6)] transition-all uppercase tracking-wide ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Phân cách */}
        <div className="flex items-center justify-center mt-5 mb-5">
          <div className="border-t border-gray-200 flex-grow"></div>
          <span className="px-4 text-[13px] text-gray-400 font-medium bg-white">Hoặc đăng nhập với</span>
          <div className="border-t border-gray-200 flex-grow"></div>
        </div>

        {/* Nút Đăng nhập Mạng xã hội */}
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-[20px] py-3 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-[15px] font-bold text-[#373A4D]">Google</span>
          </button>

          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-[20px] py-3 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-[18px] h-[18px]" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-[15px] font-bold text-[#373A4D]">Facebook</span>
          </button>
        </div>

        {/* Chuyển trang Đăng ký */}
        <div className="mt-7 text-center text-[15px] text-gray-500 font-medium">
          Chưa có tài khoản?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-[#F06292] font-bold hover:underline"
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;