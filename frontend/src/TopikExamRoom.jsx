import React, { useState, useEffect, useRef } from 'react';
import axios from './axios';
import {
  Award, Clock, Play, Pause, CheckCircle2,
  Send, RotateCcw, ArrowRight, ArrowLeft, PenTool, Sparkles,
  BookOpen, History, Calendar, CheckCircle
} from 'lucide-react';

const TopikExamRoom = () => {
  // Trạng thái màn hình chính: 'EXAMS_LIST' (Danh sách đề) | 'HISTORY_LIST' (Lịch sử) | 'EXAM' (Đang thi) | 'RESULT' (Xem kết quả/Review)
  const [activeTab, setActiveTab] = useState('EXAMS'); // 'EXAMS' | 'HISTORY'
  const [viewState, setViewState] = useState('MAIN'); // 'MAIN' | 'EXAM' | 'RESULT'

  // Dữ liệu đề thi & Lịch sử
  const [exams, setExams] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentExamDetail, setCurrentExamDetail] = useState(null);

  // Làm bài thi
  const [answers, setAnswers] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [currentSectionFilter, setCurrentSectionFilter] = useState('ALL');
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Audio nghe câu hỏi
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioPlayerRef = useRef(new Audio());

  // Kết quả & Review
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [aiExplanations, setAiExplanations] = useState({});
  const [loadingAiId, setLoadingAiId] = useState(null);

  // 1. Tải danh sách đề thi
  const fetchAvailableExams = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/exams');
      setExams(res.data);
    } catch {
      alert('Không thể tải danh sách đề thi!');
    } finally {
      setLoading(false);
    }
  };

  // 2. Tải lịch sử làm bài của học viên
  const fetchExamHistory = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/exams/my-history');
      setHistoryList(res.data);
    } catch {
      alert('Không thể tải lịch sử làm bài!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'EXAMS') {
      fetchAvailableExams();
    } else {
      fetchExamHistory();
    }
    return () => {
      clearInterval(timerRef.current);
      audioPlayerRef.current.pause();
    };
  }, [activeTab]);

  // Bắt đầu làm bài thi mới
  const handleStartExam = async (examId) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/exams/${examId}/take`);
      setCurrentExamDetail(res.data);
      setAnswers({});
      setActiveQuestionIndex(0);
      setCurrentSectionFilter('ALL');
      setAiExplanations({});

      const totalSeconds = (res.data.exam.durationMinutes || 100) * 60;
      setTimeLeft(totalSeconds);
      setViewState('EXAM');

      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit(res.data.exam.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tải đề thi!');
    } finally {
      setLoading(false);
    }
  };

  // Xem lại một bài thi cũ trong lịch sử
  const handleReviewPastSubmission = async (item) => {
    try {
      setLoading(true);
      const [resExam, resSub] = await Promise.all([
        axios.get(`/api/exams/${item.examId}/take`),
        axios.get(`/api/exams/my-history/${item.submissionId}`)
      ]);
      setCurrentExamDetail(resExam.data);
      setSubmissionResult(resSub.data);
      setAiExplanations({});
      setReviewFilter('ALL');
      setViewState('RESULT');
    } catch {
      alert('Không thể tải lại chi tiết bài làm cũ này!');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const togglePlayAudio = (url) => {
    if (!url) return;
    const backendBase = axios.defaults.baseURL
      ? axios.defaults.baseURL.replace(/\/api\/?$/, '')
      : 'http://localhost:8088';

    const fullUrl = url.startsWith('http') ? url : `${backendBase}${url}`;

    if (playingAudio === url) {
      audioPlayerRef.current.pause();
      setPlayingAudio(null);
    } else {
      audioPlayerRef.current.src = fullUrl;
      audioPlayerRef.current.play().catch(() => alert('Không thể phát file âm thanh!'));
      setPlayingAudio(url);
      audioPlayerRef.current.onended = () => setPlayingAudio(null);
    }
  };

  const handleSelectAnswer = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmitExam = async () => {
    const totalQ = currentExamDetail?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < totalQ) {
      if (!window.confirm(`Bạn mới hoàn thành ${answeredCount}/${totalQ} câu hỏi. Bạn có chắc chắn muốn nộp bài sớm không?`)) {
        return;
      }
    } else {
      if (!window.confirm('Bạn có chắc chắn muốn nộp bài để xem điểm số?')) return;
    }

    executeSubmission(currentExamDetail.exam.id);
  };

  const handleAutoSubmit = (examId) => {
    alert('Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn.');
    executeSubmission(examId);
  };

  const executeSubmission = async (examId) => {
    clearInterval(timerRef.current);
    audioPlayerRef.current.pause();
    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/exams/submit', {
        examId: examId,
        answers: answers
      });
      setSubmissionResult(res.data);
      setViewState('RESULT');
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài thi!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskGemini = async (qId, studentAns) => {
    try {
      setLoadingAiId(qId);
      const res = await axios.post('/api/exams/explain-question', {
        questionId: qId,
        studentAnswer: studentAns
      });
      setAiExplanations(prev => ({
        ...prev,
        [qId]: res.data.explanation
      }));
    } catch {
      alert('Không thể kết nối tới trợ lý AI Gemini lúc này!');
    } finally {
      setLoadingAiId(null);
    }
  };

  const getFilteredQuestions = () => {
    if (!currentExamDetail?.questions) return [];
    if (currentSectionFilter === 'ALL') return currentExamDetail.questions;
    return currentExamDetail.questions.filter(q => q.section === currentSectionFilter);
  };

  // =========================================================================
  // VIEW 1: TRANG CHÍNH (GỒM TAB ĐỀ THI & TAB LỊCH SỬ)
  // =========================================================================
  if (viewState === 'MAIN') {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#373A4D] flex items-center gap-2">
              <Award className="text-[#F06292]" size={28} /> Hệ thống Luyện thi TOPIK
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Phòng thi trực tuyến mô phỏng chuẩn NIIED, chấm điểm tự động và AI giải thích chi tiết.
            </p>
          </div>

          {/* THANH TAB CHUYỂN ĐỔI */}
          <div className="flex bg-white p-1 rounded-2xl border border-pink-100 shadow-2xs self-start">
            <button
              onClick={() => setActiveTab('EXAMS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'EXAMS' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                }`}
            >
              <Award size={14} /> Danh sách đề thi
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${activeTab === 'HISTORY' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                }`}
            >
              <History size={14} /> Lịch sử làm bài
            </button>
          </div>
        </div>

        {/* TAB 1: DANH SÁCH ĐỀ THI ĐANG MỞ */}
        {activeTab === 'EXAMS' && (
          <div>
            {loading ? (
              <div className="py-20 text-center text-gray-400 font-bold">Đang tải danh sách đề thi...</div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-pink-100 shadow-sm text-gray-400 font-bold">
                Hiện tại chưa có đề thi nào mở. Vui lòng quay lại sau!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs hover:border-[#F06292] hover:shadow-md transition space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${exam.level === 'TOPIK_I' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-purple-50 text-purple-600 border border-purple-200'
                          }`}>
                          {exam.level === 'TOPIK_I' ? 'TOPIK I (Cấp 1 - 2)' : 'TOPIK II (Cấp 3 - 6)'}
                        </span>
                        <span className="text-[11px] text-gray-400 font-bold flex items-center gap-1">
                          <Clock size={13} /> {exam.durationMinutes} phút
                        </span>
                      </div>

                      <h3 className="text-base font-black text-[#373A4D] leading-snug line-clamp-2">
                        {exam.title}
                      </h3>

                      <div className="flex items-center gap-4 text-xs font-bold text-gray-500 pt-1">
                        <span>Thang điểm: <strong className="text-[#F06292]">{exam.totalScore}đ</strong></span>
                        <span>Số câu: <strong>{exam.totalQuestions || 0} câu</strong></span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartExam(exam.id)}
                      className="w-full py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
                    >
                      <span>Bắt đầu làm bài</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LỊCH SỬ LÀM BÀI CỦA HỌC VIÊN */}
        {activeTab === 'HISTORY' && (
          <div>
            {loading ? (
              <div className="py-20 text-center text-gray-400 font-bold">Đang tải lịch sử bài thi...</div>
            ) : historyList.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-pink-100 shadow-sm text-gray-400 font-bold space-y-3">
                <History className="w-10 h-10 mx-auto text-pink-300" />
                <p>Bạn chưa hoàn thành bài thi thử nào.</p>
                <button
                  onClick={() => setActiveTab('EXAMS')}
                  className="px-5 py-2 bg-[#F06292] text-white text-xs font-black rounded-xl hover:bg-[#e05584] transition"
                >
                  Luyện thi ngay
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-[#FFF5F7] text-[#373A4D] font-black uppercase text-[11px] border-b border-pink-100">
                    <tr>
                      <th className="py-4 px-6">Tên đề thi</th>
                      <th className="py-4 px-6 text-center">Thời gian nộp</th>
                      <th className="py-4 px-6 text-center">Điểm chi tiết</th>
                      <th className="py-4 px-6 text-center">Tổng điểm</th>
                      <th className="py-4 px-6 text-center">Xếp loại</th>
                      <th className="py-4 px-6 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50">
                    {historyList.map((item) => (
                      <tr key={item.submissionId} className="hover:bg-[#FFFDFE] transition">
                        <td className="py-4 px-6">
                          <p className="font-black text-[#373A4D] text-sm">{item.examTitle}</p>
                          <span className="text-[10px] text-gray-400 font-bold">
                            Cấp độ: {item.examLevel === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} /> {item.submittedAt ? item.submittedAt.replace('T', ' ').substring(0, 16) : 'Vừa xong'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-bold text-gray-600">
                          Nghe: <strong className="text-[#F06292]">{item.listeningScore}đ</strong> | Đọc: <strong className="text-emerald-600">{item.readingScore}đ</strong>
                          {item.writingScore !== null && item.examLevel === 'TOPIK_II' && (
                            <> | Viết: <strong className="text-purple-600">{item.writingScore}đ</strong></>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center font-black text-sm text-[#F06292]">
                          {item.totalScore}đ
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${item.passedLevel.includes('Level')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                            {item.passedLevel}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleReviewPastSubmission(item)}
                            className="px-3.5 py-1.5 bg-pink-50 hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-xl text-xs font-black transition shadow-2xs flex items-center gap-1 mx-auto"
                          >
                            <BookOpen size={13} /> Xem lại bài thi & AI
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PHÒNG THI MÔ PHỎNG (LÀM BÀI)
  // =========================================================================
  if (viewState === 'EXAM' && currentExamDetail) {
    const questions = currentExamDetail.questions || [];
    const currentQ = questions[activeQuestionIndex];

    return (
      <div className="min-h-screen bg-[#FDF7F8] flex flex-col font-sans">
        <header className="h-16 bg-white border-b border-pink-100 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-pink-50 text-[#F06292] font-black text-xs flex items-center justify-center">
              {currentExamDetail.exam.level === 'TOPIK_I' ? 'T1' : 'T2'}
            </span>
            <div>
              <h1 className="text-sm font-black text-[#373A4D] truncate max-w-md">
                {currentExamDetail.exam.title}
              </h1>
              <span className="text-[10px] text-gray-400 font-bold">
                Đã làm: {Object.keys(answers).length}/{questions.length} câu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border font-mono font-black text-sm shadow-2xs ${timeLeft < 300
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
              : 'bg-[#FFF5F7] border-pink-200 text-[#F06292]'
              }`}>
              <Clock size={16} />
              <span>{formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={handleSubmitExam}
              disabled={isSubmitting}
              className="px-5 py-2 bg-gradient-to-r from-[#F48FB1] to-[#F06292] hover:opacity-90 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send size={14} />
              {isSubmitting ? 'Đang nộp...' : 'Nộp bài thi'}
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-3xl p-6 border border-pink-100 shadow-sm flex flex-col justify-between space-y-6">
            {currentQ ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#FFF0F4] text-[#F06292] font-black text-sm flex items-center justify-center">
                      {currentQ.questionNum}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${currentQ.section === 'LISTENING' ? 'bg-blue-50 text-blue-600' : currentQ.section === 'READING' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-100 text-purple-700'
                      }`}>
                      {currentQ.section}
                    </span>
                    <span className="text-xs font-bold text-gray-400">
                      Điểm: {currentQ.score}đ
                    </span>
                  </div>

                  {currentQ.audioUrl && (
                    <button
                      onClick={() => togglePlayAudio(currentQ.audioUrl)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#FFF0F4] hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-xl text-xs font-black transition"
                    >
                      {playingAudio === currentQ.audioUrl ? <Pause size={14} /> : <Play size={14} />}
                      <span>{playingAudio === currentQ.audioUrl ? 'Tạm dừng' : 'Nghe audio'}</span>
                    </button>
                  )}
                </div>

                {currentQ.passage && (
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-[#373A4D] text-xs leading-relaxed font-medium whitespace-pre-line">
                    {currentQ.passage}
                  </div>
                )}

                <p className="text-sm font-bold text-[#373A4D] whitespace-pre-line leading-relaxed">
                  {currentQ.questionText}
                </p>

                {currentQ.questionType === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2.5 pt-2">
                    {[
                      { key: '1', text: currentQ.option1 },
                      { key: '2', text: currentQ.option2 },
                      { key: '3', text: currentQ.option3 },
                      { key: '4', text: currentQ.option4 },
                    ].map(opt => {
                      const isSelected = String(answers[currentQ.id]) === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => handleSelectAnswer(currentQ.id, opt.key)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-xs font-bold transition flex items-center gap-3 ${isSelected
                            ? 'bg-pink-50 border-[#F06292] text-[#F06292] shadow-2xs'
                            : 'bg-white border-gray-100 hover:border-pink-200 text-[#373A4D]'
                            }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${isSelected ? 'bg-[#F06292] text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                            {opt.key}
                          </span>
                          <span className="flex-1">{opt.text || '—'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {(currentQ.questionType === 'SHORT_WRITING' || currentQ.questionType === 'ESSAY') && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                      <span className="flex items-center gap-1.5 text-purple-700">
                        <PenTool size={14} /> Bài làm của bạn:
                      </span>
                      <span className="font-mono">
                        Số ký tự: <strong className="text-[#373A4D]">{(answers[currentQ.id] || '').length}</strong>
                        {currentQ.questionNum === 53 && ' / 200~300 ký tự'}
                        {currentQ.questionNum === 54 && ' / 600~700 ký tự'}
                      </span>
                    </div>

                    <textarea
                      rows={currentQ.questionType === 'SHORT_WRITING' ? 4 : 12}
                      placeholder={
                        currentQ.questionType === 'SHORT_WRITING'
                          ? "Điền câu trả lời cho ( ㉠ ) và ( ㉡ ) vào đây..."
                          : "Viết bài luận của bạn vào đây (Sử dụng đuôi văn viết: -ㄴ/는다, chia thành các đoạn văn rõ ràng)..."
                      }
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                      className="w-full p-4 bg-[#FFFDFE] border border-pink-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-[#F06292] leading-relaxed resize-y"
                    />
                  </div>
                )}
              </div>
            ) : null}

            <div className="pt-4 border-t border-pink-50 flex items-center justify-between">
              <button
                onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={activeQuestionIndex === 0}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 disabled:opacity-30"
              >
                <ArrowLeft size={14} /> Câu trước
              </button>

              <span className="text-xs font-bold text-gray-400">
                Câu {activeQuestionIndex + 1} / {questions.length}
              </span>

              <button
                onClick={() => setActiveQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={activeQuestionIndex === questions.length - 1}
                className="px-4 py-2 bg-[#F06292] text-white rounded-xl text-xs font-bold hover:bg-[#e05584] transition flex items-center gap-1.5 disabled:opacity-30"
              >
                Câu tiếp <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-white rounded-3xl p-5 border border-pink-100 shadow-sm space-y-4 h-fit max-h-[82vh] flex flex-col">
            <div>
              <h3 className="text-xs font-black text-[#373A4D] uppercase">Phiếu trả lời OMR</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Nhấp vào số câu để chuyển nhanh</p>
            </div>

            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl text-[10px] font-black">
              {['ALL', 'LISTENING', ...(currentExamDetail.exam.level === 'TOPIK_II' ? ['WRITING'] : []), 'READING'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCurrentSectionFilter(tab)}
                  className={`flex-1 py-1 rounded-lg transition ${currentSectionFilter === tab ? 'bg-white text-[#F06292] shadow-2xs' : 'text-gray-400'
                    }`}
                >
                  {tab === 'ALL' ? 'Tất cả' : tab === 'LISTENING' ? 'Nghe' : tab === 'WRITING' ? 'Viết' : 'Đọc'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 pr-1">
              {getFilteredQuestions().map((q) => {
                const originalIndex = questions.findIndex(item => item.id === q.id);
                const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
                const isCurrent = activeQuestionIndex === originalIndex;

                return (
                  <button
                    key={q.id}
                    onClick={() => setActiveQuestionIndex(originalIndex)}
                    className={`h-9 rounded-xl text-xs font-black transition relative flex items-center justify-center ${isCurrent
                      ? 'border-2 border-[#F06292] text-[#F06292] bg-pink-50'
                      : isAnswered
                        ? 'bg-[#F06292] text-white shadow-2xs'
                        : 'bg-gray-50 text-gray-400 hover:bg-pink-50 hover:text-[#F06292]'
                      }`}
                  >
                    <span>{q.questionNum}</span>
                    {isAnswered && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-pink-50 flex items-center justify-around text-[10px] font-bold text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F06292]"></span> Đã làm
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-200"></span> Chưa làm
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: MÀN HÌNH BÁO CÁO KẾT QUẢ & REVIEW CÂU HỎI KÈM GEMINI AI
  // =========================================================================
  if (viewState === 'RESULT' && submissionResult) {
    let writingFeedbackParsed = [];
    try {
      if (submissionResult.writingFeedback) {
        const parsed = JSON.parse(submissionResult.writingFeedback);
        writingFeedbackParsed = parsed.feedback || [];
      }
    } catch (e) {
      console.error(e);
    }

    const detailedList = submissionResult.detailedResults || [];
    const filteredQuestions = detailedList.filter(q => {
      if (reviewFilter === 'WRONG') return !q.isCorrect;
      if (reviewFilter === 'CORRECT') return q.isCorrect;
      return true;
    });

    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 font-sans">
        {/* Banner Tổng kết kết quả */}
        <div className="bg-gradient-to-br from-[#F48FB1] to-[#F06292] rounded-3xl p-8 text-white shadow-lg space-y-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-4 py-1.5 rounded-full text-xs font-black uppercase">
            <CheckCircle2 size={16} /> Kết quả bài thi
          </div>

          <div>
            <h2 className="text-3xl font-black">{currentExamDetail?.exam?.title}</h2>
            <div className="mt-4 flex items-center justify-center gap-8">
              <div>
                <span className="text-xs uppercase font-bold opacity-80">Tổng điểm</span>
                <p className="text-5xl font-black mt-1">{submissionResult.totalScore}đ</p>
              </div>
              <div className="h-12 w-px bg-white/30"></div>
              <div>
                <span className="text-xs uppercase font-bold opacity-80">Xếp loại đạt được</span>
                <p className="text-3xl font-black mt-1 text-yellow-200">{submissionResult.passedLevel}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-md mx-auto pt-2">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <span className="text-[11px] font-bold opacity-80">Nghe (듣기)</span>
              <p className="text-lg font-black">{submissionResult.listeningScore}đ</p>
            </div>
            {currentExamDetail?.exam?.level === 'TOPIK_II' && (
              <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
                <span className="text-[11px] font-bold opacity-80">Viết (쓰기)</span>
                <p className="text-lg font-black">{submissionResult.writingScore}đ</p>
              </div>
            )}
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl">
              <span className="text-[11px] font-bold opacity-80">Đọc (읽기)</span>
              <p className="text-lg font-black">{submissionResult.readingScore}đ</p>
            </div>
          </div>
        </div>

        {/* NHẬN XÉT CỦA BÀI VIẾT (TOPIK II) */}
        {writingFeedbackParsed.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-sm space-y-4">
            <h3 className="text-base font-black text-[#373A4D] flex items-center gap-2">
              <Sparkles className="text-purple-600" size={20} />
              Đánh giá bài viết từ Giám khảo Gemini AI (C51 - C54)
            </h3>
            <div className="space-y-3">
              {writingFeedbackParsed.map((item, idx) => (
                <div key={idx} className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-black text-purple-900">
                    <span>Câu {item.questionNum}</span>
                    <span className="text-[#F06292] font-mono">Điểm: {item.score}đ</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">
                    {item.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BỘ LỌC XEM LẠI BÀI THI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <h3 className="text-lg font-black text-[#373A4D] flex items-center gap-2">
            <BookOpen size={20} className="text-[#F06292]" /> Xem lại chi tiết ({detailedList.length} câu)
          </h3>

          <div className="flex gap-1.5 p-1 bg-white rounded-2xl border border-pink-100 text-xs font-bold shadow-2xs self-start">
            <button
              onClick={() => setReviewFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl transition ${reviewFilter === 'ALL' ? 'bg-[#F06292] text-white' : 'text-gray-500'}`}
            >
              Tất cả ({detailedList.length})
            </button>
            <button
              onClick={() => setReviewFilter('WRONG')}
              className={`px-3 py-1.5 rounded-xl transition ${reviewFilter === 'WRONG' ? 'bg-rose-500 text-white' : 'text-rose-500'}`}
            >
              Câu sai ({detailedList.filter(q => !q.isCorrect).length})
            </button>
            <button
              onClick={() => setReviewFilter('CORRECT')}
              className={`px-3 py-1.5 rounded-xl transition ${reviewFilter === 'CORRECT' ? 'bg-emerald-600 text-white' : 'text-emerald-600'}`}
            >
              Câu đúng ({detailedList.filter(q => q.isCorrect).length})
            </button>
          </div>
        </div>

        {/* DANH SÁCH TỪNG CÂU HỎI KÈM NÚT GIẢI THÍCH GEMINI AI */}
        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const hasAiExplanation = aiExplanations[q.questionId];
            const isLoadingThisAi = loadingAiId === q.questionId;

            return (
              <div
                key={q.questionId}
                className={`p-5 rounded-3xl border shadow-2xs bg-white space-y-3 transition ${q.isCorrect ? 'border-emerald-200' : 'border-rose-200 bg-rose-50/10'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                      {q.questionNum}
                    </span>
                    <span className="text-xs font-bold text-gray-500 uppercase">
                      {q.section}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${q.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                      {q.isCorrect ? `Đúng (+${q.score}đ)` : 'Sai (0đ)'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAskGemini(q.questionId, q.studentAnswer)}
                    disabled={isLoadingThisAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-[#F06292] hover:opacity-90 text-white text-xs font-black rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    <Sparkles size={14} className={isLoadingThisAi ? 'animate-spin' : ''} />
                    <span>{isLoadingThisAi ? 'Gemini đang phân tích...' : '✨ Gemini AI Giải thích'}</span>
                  </button>
                </div>

                {q.passage && (
                  <div className="p-3 bg-gray-50 rounded-2xl text-xs text-gray-700 font-medium leading-relaxed border border-gray-100 whitespace-pre-line">
                    {q.passage}
                  </div>
                )}

                <p className="text-xs font-bold text-[#373A4D]">{q.questionText}</p>

                {q.questionType === 'MULTIPLE_CHOICE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                    {[
                      { key: '1', text: q.option1 },
                      { key: '2', text: q.option2 },
                      { key: '3', text: q.option3 },
                      { key: '4', text: q.option4 },
                    ].map(opt => {
                      const isCorrectAnswer = String(q.correctAnswer) === opt.key;
                      const isUserChoice = String(q.studentAnswer) === opt.key;

                      let boxStyle = 'bg-gray-50/60 border-gray-100 text-gray-600';
                      if (isCorrectAnswer) {
                        boxStyle = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                      } else if (isUserChoice && !q.isCorrect) {
                        boxStyle = 'bg-rose-50 border-rose-300 text-rose-700 font-bold';
                      }

                      return (
                        <div key={opt.key} className={`p-2.5 rounded-xl border flex items-center justify-between ${boxStyle}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-[11px]">{opt.key}.</span>
                            <span>{opt.text || '—'}</span>
                          </div>
                          {isCorrectAnswer && (
                            <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-black">
                              Đáp án đúng
                            </span>
                          )}
                          {isUserChoice && !isCorrectAnswer && (
                            <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-md font-black">
                              Bạn đã chọn
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {q.explanation && (
                  <div className="text-[11px] text-gray-500 italic pt-1">
                    Ghi chú đề thi: {q.explanation}
                  </div>
                )}

                {hasAiExplanation && (
                  <div className="mt-3 p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-purple-800 font-black">
                      <Sparkles size={15} /> Phân tích chi tiết từ Gemini AI:
                    </div>
                    <div className="text-gray-700 leading-relaxed font-medium whitespace-pre-line bg-white p-4 rounded-xl border border-purple-100 shadow-2xs">
                      {hasAiExplanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setViewState('MAIN')}
            className="px-6 py-3 bg-white border border-pink-200 text-[#373A4D] hover:bg-pink-50 rounded-2xl text-xs font-black shadow-xs transition flex items-center gap-2"
          >
            <RotateCcw size={16} /> Quay lại danh sách đề thi & Lịch sử
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TopikExamRoom;