import React, { useState, useEffect } from 'react';
import UserDashboard from './UserDashboard';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import VerifyOtp from './VerifyOtp';
import ResetPassword from './ResetPassword';
import AdminLayout from './AdminLayout';
import StudyLesson from './StudyLesson';
import TopikExamRoom from './TopikExamRoom';
import ChatbotWidget from './ChatbotWidget';

function App() {
  // 'user-dashboard' | 'admin' | 'login' | 'register' | 'study' | 'topik-exam'
  const [currentPage, setCurrentPage] = useState('user-dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [otpFlow, setOtpFlow] = useState('register');
  const [selectedLessonForStudy, setSelectedLessonForStudy] = useState(null);

  // Tự động khôi phục phiên đăng nhập từ localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  // Xử lý sau khi đăng nhập thành công
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    if (userData.role === 'ADMIN') {
      setCurrentPage('admin');
    } else {
      if (selectedLessonForStudy) {
        setCurrentPage('study');
      } else {
        setCurrentPage('user-dashboard');
      }
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentPage('user-dashboard');
  };

  // Điều hướng vào học bài giảng
  const handleSelectLesson = (lesson) => {
    setSelectedLessonForStudy(lesson);
    setCurrentPage('study');
  };

  return (
    <div>
      {/* 1. MÀN HÌNH DASHBOARD HỌC VIÊN & KHÁCH */}
      {currentPage === 'user-dashboard' && (
        <UserDashboard
          user={currentUser}
          onNavigateLogin={() => setCurrentPage('login')}
          onNavigateRegister={() => setCurrentPage('register')}
          onSelectLesson={handleSelectLesson}
          onLogout={handleLogout}
          onNavigateAdmin={() => setCurrentPage('admin')}
          onNavigateTopikExam={() => setCurrentPage('topik-exam')} // ĐIỀU HƯỚNG VÀO THI TOPIK
        />
      )}

      {/* 2. MÀN HÌNH LUYỆN THI MÔ PHỎNG TOPIK */}
      {currentPage === 'topik-exam' && (
        <div className="min-h-screen bg-[#FDF7F8]">
          {/* Thanh bar điều hướng quay về Dashboard */}
          <div className="bg-white border-b border-pink-100 px-6 py-2.5 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('user-dashboard')}
              className="text-xs font-bold text-gray-500 hover:text-[#F06292] flex items-center gap-1 transition"
            >
              ← Quay lại Trang chủ
            </button>
            <span className="text-[11px] font-black uppercase text-[#F06292] bg-pink-50 px-2.5 py-1 rounded-full">
              Hệ thống thi thử TOPIK
            </span>
          </div>

          <TopikExamRoom />
        </div>
      )}

      {/* 3. MÀN HÌNH QUẢN TRỊ ADMIN */}
      {currentPage === 'admin' && (
        <AdminLayout
          user={currentUser}
          onLogout={handleLogout}
          onBackToUser={() => setCurrentPage('user-dashboard')}
        />
      )}

      {/* 4. MÀN HÌNH ĐĂNG NHẬP */}
      {currentPage === 'login' && (
        <Login
          onSwitchToRegister={() => setCurrentPage('register')}
          onSwitchToForgotPassword={() => setCurrentPage('forgot-password')}
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => setCurrentPage('user-dashboard')}
        />
      )}

      {/* 5. MÀN HÌNH ĐĂNG KÝ */}
      {currentPage === 'register' && (
        <Register
          onSwitchToLogin={() => setCurrentPage('login')}
          onRegisterSuccess={(email) => {
            setTargetEmail(email);
            setOtpFlow('register');
            setCurrentPage('verify-otp');
          }}
          onBackToHome={() => setCurrentPage('user-dashboard')}
        />
      )}

      {/* 6. QUÊN MẬT KHẨU */}
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

      {/* 7. XÁC THỰC OTP */}
      {currentPage === 'verify-otp' && (
        <VerifyOtp
          email={targetEmail}
          flow={otpFlow}
          onSwitchToLogin={() => setCurrentPage('login')}
          onSwitchToResetPassword={() => setCurrentPage('reset-password')}
        />
      )}

      {/* 8. ĐẶT LẠI MẬT KHẨU */}
      {currentPage === 'reset-password' && (
        <ResetPassword
          email={targetEmail}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}

      {/* 9. PHÒNG HỌC BÀI GIẢNG */}
      {currentPage === 'study' && (
        <StudyLesson
          lesson={selectedLessonForStudy}
          onBack={() => setCurrentPage('user-dashboard')}
        />
      )}
      {/* 9. PHÒNG HỌC BÀI GIẢNG */}
      {currentPage === 'study' && (
        <StudyLesson
          lesson={selectedLessonForStudy}
          onBack={() => setCurrentPage('user-dashboard')}
        />
      )}

      {/* CHATBOT AI HỖ TRỢ TRA TỪ, NGỮ PHÁP & LỘ TRÌNH (LUÔN HIỆN NỔI GÓC PHẢI) */}
      <ChatbotWidget />

    </div>
  );
}

export default App;