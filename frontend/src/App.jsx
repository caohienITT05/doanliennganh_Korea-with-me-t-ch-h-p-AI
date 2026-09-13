import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import VerifyOtp from './VerifyOtp';
import ResetPassword from './ResetPassword';
import AdminLayout from './AdminLayout';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [otpFlow, setOtpFlow] = useState('register');

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        if (parsedUser.role === 'ADMIN') {
          setCurrentPage('admin');
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    if (userData.role === 'ADMIN') {
      setCurrentPage('admin');
    } else {
      alert(`Đăng nhập thành công với vai trò Học viên: ${userData.fullName}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  return (
    <div>
      {/* 1. MÀN HÌNH QUẢN TRỊ ADMIN */}
      {currentPage === 'admin' && (
        <AdminLayout user={currentUser} onLogout={handleLogout} />
      )}

      {/* 2. MÀN HÌNH ĐĂNG NHẬP */}
      {currentPage === 'login' && (
        <Login
          onSwitchToRegister={() => setCurrentPage('register')}
          onSwitchToForgotPassword={() => setCurrentPage('forgot-password')}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* 3. MÀN HÌNH ĐĂNG KÝ */}
      {currentPage === 'register' && (
        <Register
          onSwitchToLogin={() => setCurrentPage('login')}
          onRegisterSuccess={(email) => {
            setTargetEmail(email);
            setOtpFlow('register');
            setCurrentPage('verify-otp');
          }}
        />
      )}

      {/* 4. MÀN HÌNH QUÊN MẬT KHẨU */}
      {currentPage === 'forgot-password' && (
        <ForgotPassword
          onSwitchToLogin={() => setCurrentPage('login')}
          onOtpSent={(email) => {
            setTargetEmail(email);
            setOtpFlow('forgot-password');
            setCurrentPage('verify-otp');
          }}
        />
      )}

      {/* 5. MÀN HÌNH XÁC THỰC OTP */}
      {currentPage === 'verify-otp' && (
        <VerifyOtp
          email={targetEmail}
          flow={otpFlow}
          onSwitchToLogin={() => setCurrentPage('login')}
          onSwitchToResetPassword={() => setCurrentPage('reset-password')}
        />
      )}

      {/* 6. MÀN HÌNH ĐẶT LẠI MẬT KHẨU */}
      {currentPage === 'reset-password' && (
        <ResetPassword
          email={targetEmail}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}
    </div>
  );
}

export default App;