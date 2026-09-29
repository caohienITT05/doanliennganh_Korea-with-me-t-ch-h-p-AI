import React, { useState, useEffect, useRef } from 'react';
import axios from './axios';
import {
    Award, Plus, Trash2, Edit3, FileText, Music,
    Play, Pause, Clock, Layers, X, Save, Sparkles,
    FileSpreadsheet, Download, PenTool, CheckCircle2,
    Users, Search, Filter, Calendar, BookOpen, UserCheck
} from 'lucide-react';

const TopikManagement = () => {
    // Tab chính: 'EXAMS' (Quản lý đề) | 'SUBMISSIONS' (Kết quả học viên)
    const [adminTab, setAdminTab] = useState('EXAMS');

    // =================== STATE QUẢN LÝ ĐỀ THI ===================
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Modal 1: Thông tin đề thi
    const [showExamModal, setShowExamModal] = useState(false);
    const [isEditingExam, setIsEditingExam] = useState(false);
    const [examFormData, setExamFormData] = useState({
        id: null,
        title: '',
        level: 'TOPIK_I',
        durationMinutes: 100,
        totalScore: 200.0,
        status: 'DRAFT'
    });

    // Modal 2: Quản lý câu hỏi
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [currentExam, setCurrentExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [isExtractingPdf, setIsExtractingPdf] = useState(false);
    const [isUploadingAudios, setIsUploadingAudios] = useState(false);
    const [isSavingQuestions, setIsSavingQuestions] = useState(false);
    const [isImportingExcel, setIsImportingExcel] = useState(false);
    const [extractSection, setExtractSection] = useState('ALL');

    const excelInputRef = useRef(null);
    const pdfInputRef = useRef(null);
    const audioFilesInputRef = useRef(null);

    // Audio preview
    const [playingAudio, setPlayingAudio] = useState(null);
    const audioPlayerRef = useRef(new Audio());

    // =================== STATE KẾT QUẢ HỌC VIÊN ===================
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('ALL');

    // Modal 3: Chi tiết bài làm của học viên
    const [showSubmissionModal, setShowSubmissionModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [loadingSubmissionDetail, setLoadingSubmissionDetail] = useState(false);
    const [subReviewFilter, setSubReviewFilter] = useState('ALL'); // 'ALL' | 'WRONG' | 'CORRECT'

    // Fetch danh sách đề thi
    const fetchExams = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/admin/topik/exams');
            setExams(res.data);
        } catch {
            setMessage({ text: 'Không thể tải danh sách đề thi TOPIK!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Fetch danh sách kết quả bài thi của học viên
    const fetchSubmissions = async () => {
        try {
            setLoadingSubmissions(true);
            const res = await axios.get('/api/admin/topik/submissions');
            setSubmissions(res.data);
        } catch {
            setMessage({ text: 'Không thể tải danh sách kết quả bài thi!', type: 'error' });
        } finally {
            setLoadingSubmissions(false);
        }
    };

    useEffect(() => {
        if (adminTab === 'EXAMS') {
            fetchExams();
        } else {
            fetchSubmissions();
        }
        return () => {
            audioPlayerRef.current.pause();
        };
    }, [adminTab]);

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

    const handleOpenCreateExam = () => {
        setIsEditingExam(false);
        setExamFormData({
            id: null,
            title: '',
            level: 'TOPIK_I',
            durationMinutes: 100,
            totalScore: 200.0,
            status: 'DRAFT'
        });
        setShowExamModal(true);
    };

    const handleOpenEditExam = (exam) => {
        setIsEditingExam(true);
        setExamFormData({
            id: exam.id,
            title: exam.title,
            level: exam.level,
            durationMinutes: exam.durationMinutes,
            totalScore: exam.totalScore,
            status: exam.status
        });
        setShowExamModal(true);
    };

    const handleSaveExam = async (e) => {
        e.preventDefault();
        try {
            if (isEditingExam) {
                const res = await axios.put(`/api/admin/topik/exams/${examFormData.id}`, examFormData);
                setExams(exams.map(ex => ex.id === res.data.id ? res.data : ex));
                setMessage({ text: 'Cập nhật đề thi thành công!', type: 'success' });
            } else {
                const res = await axios.post('/api/admin/topik/exams', examFormData);
                setExams([res.data, ...exams]);
                setMessage({ text: 'Tạo đề thi mới thành công!', type: 'success' });
            }
            setShowExamModal(false);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Lỗi khi lưu thông tin đề!', type: 'error' });
        }
    };

    const handleDeleteExam = async (examId, title) => {
        if (!window.confirm(`Bạn có chắc muốn xóa đề thi "${title}"?`)) return;
        try {
            await axios.delete(`/api/admin/topik/exams/${examId}`);
            setExams(exams.filter(ex => ex.id !== examId));
            setMessage({ text: 'Đã xóa đề thi thành công!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Xóa đề thi thất bại!', type: 'error' });
        }
    };

    const handleOpenQuestionsEditor = async (exam) => {
        setCurrentExam(exam);
        setExtractSection('ALL');
        try {
            const res = await axios.get(`/api/admin/topik/exams/${exam.id}`);
            setQuestions(res.data.questions || []);
            setShowQuestionModal(true);
        } catch {
            alert('Không thể tải chi tiết câu hỏi của đề này!');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const level = currentExam ? currentExam.level : 'TOPIK_I';
            const response = await axios.get(`/api/admin/topik/exams/download-excel-template?level=${level}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `topik_${level.toLowerCase()}_template.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            alert('Không thể tải file mẫu Excel!');
        }
    };

    const handleExcelUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsImportingExcel(true);
            const res = await axios.post('/api/admin/topik/exams/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setQuestions(res.data);
            setMessage({ text: `Đã nạp thành công ${res.data.length} câu hỏi từ file Excel!`, type: 'success' });
        } catch (err) {
            alert(err.response?.data?.error || 'Lỗi đọc file Excel!');
        } finally {
            setIsImportingExcel(false);
            e.target.value = '';
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('level', currentExam.level);
        formData.append('section', extractSection);

        try {
            setIsExtractingPdf(true);
            const res = await axios.post('/api/admin/topik/exams/extract-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (extractSection === 'ALL') {
                setQuestions(res.data);
            } else {
                const remaining = questions.filter(q => q.section !== extractSection);
                setQuestions([...remaining, ...res.data].sort((a, b) => a.questionNum - b.questionNum));
            }

            setMessage({ text: `Đã trích xuất thành công ${res.data.length} câu hỏi từ PDF!`, type: 'success' });
        } catch (err) {
            alert(err.response?.data?.error || 'Lỗi bóc tách PDF bằng Gemini AI!');
        } finally {
            setIsExtractingPdf(false);
            e.target.value = '';
        }
    };

    const handleAudioFilesUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            setIsUploadingAudios(true);
            const res = await axios.post(`/api/admin/topik/exams/${currentExam.id}/upload-audios`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const mappings = res.data;
            let mappedCount = 0;

            const updatedQuestions = questions.map(q => {
                const found = mappings.find(m => m.mappedQuestionNums && m.mappedQuestionNums.includes(q.questionNum));
                if (found) {
                    mappedCount++;
                    return { ...q, audioUrl: found.audioUrl };
                }
                return q;
            });

            setQuestions(updatedQuestions);
            setMessage({ text: `Đã gắn file nghe vào ${mappedCount} câu hỏi thành công!`, type: 'success' });
        } catch (err) {
            alert(err.response?.data?.error || 'Lỗi khi tải bộ file âm thanh!');
        } finally {
            setIsUploadingAudios(false);
            e.target.value = '';
        }
    };

    const handleSaveQuestionsToDb = async () => {
        if (questions.length === 0) {
            alert('Chưa có câu hỏi nào để lưu!');
            return;
        }

        try {
            setIsSavingQuestions(true);
            await axios.post(`/api/admin/topik/exams/${currentExam.id}/questions`, questions);
            setMessage({ text: `Đã lưu thành công ${questions.length} câu hỏi vào Database!`, type: 'success' });
            fetchExams();
            setShowQuestionModal(false);
        } catch (err) {
            alert(err.response?.data?.error || 'Lỗi lưu câu hỏi vào cơ sở dữ liệu!');
        } finally {
            setIsSavingQuestions(false);
        }
    };

    // Mở modal xem chi tiết bài thi của học viên
    const handleViewSubmissionDetail = async (submissionId) => {
        try {
            setLoadingSubmissionDetail(true);
            const res = await axios.get(`/api/admin/topik/submissions/${submissionId}`);
            setSelectedSubmission(res.data);
            setSubReviewFilter('ALL');
            setShowSubmissionModal(true);
        } catch {
            alert('Không thể tải chi tiết bài làm của học viên này!');
        } finally {
            setLoadingSubmissionDetail(false);
        }
    };

    // Lọc danh sách bài nộp theo từ khóa và cấp độ
    const filteredSubmissions = submissions.filter(item => {
        const matchSearch =
            (item.userFullName && item.userFullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.userEmail && item.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.examTitle && item.examTitle.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchLevel = filterLevel === 'ALL' || item.examLevel === filterLevel;
        return matchSearch && matchLevel;
    });

    return (
        <div className="space-y-6 font-sans">

            {/* THANH ĐIỀU HƯỚNG TAB CHÍNH */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#373A4D] flex items-center gap-2">
                        <Award className="text-[#F06292]" size={28} /> Quản trị Kỳ thi TOPIK
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Soạn thảo đề thi TOPIK I & II và theo dõi kết quả, bài làm của học viên.
                    </p>
                </div>

                {/* 2 TAB CHUYỂN ĐỔI */}
                <div className="flex bg-white p-1 rounded-2xl border border-pink-100 shadow-2xs self-start">
                    <button
                        onClick={() => setAdminTab('EXAMS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${adminTab === 'EXAMS' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                            }`}
                    >
                        <BookOpen size={14} /> Quản lý Đề thi
                    </button>
                    <button
                        onClick={() => setAdminTab('SUBMISSIONS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition ${adminTab === 'SUBMISSIONS' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                            }`}
                    >
                        <Users size={14} /> Kết quả thi Học viên ({submissions.length})
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`p-3.5 rounded-2xl text-xs font-black flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 1: QUẢN LÝ ĐỀ THI                                                    */}
            {/* ========================================================================= */}
            {adminTab === 'EXAMS' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button
                            onClick={handleOpenCreateExam}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-sm transition"
                        >
                            <Plus size={16} /> Thêm đề thi mới
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="bg-[#FFF5F7] text-[#373A4D] font-black uppercase text-[11px] border-b border-pink-100">
                                <tr>
                                    <th className="py-4 px-6 w-16">ID</th>
                                    <th className="py-4 px-6">Tên đề thi</th>
                                    <th className="py-4 px-6 text-center w-28">Cấp độ</th>
                                    <th className="py-4 px-6 text-center w-28">Thời gian</th>
                                    <th className="py-4 px-6 text-center w-28">Số câu</th>
                                    <th className="py-4 px-6 text-center w-32">Trạng thái</th>
                                    <th className="py-4 px-6 text-center w-48">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pink-50">
                                {loading ? (
                                    <tr><td colSpan="7" className="py-12 text-center text-gray-400 font-bold">Đang tải danh sách đề thi...</td></tr>
                                ) : exams.length === 0 ? (
                                    <tr><td colSpan="7" className="py-12 text-center text-gray-400 font-bold">Chưa có đề thi nào.</td></tr>
                                ) : (
                                    exams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-[#FFFDFE] transition">
                                            <td className="py-4 px-6 font-bold text-gray-400">#{exam.id}</td>
                                            <td className="py-4 px-6">
                                                <p className="font-black text-[#373A4D] text-sm">{exam.title}</p>
                                                <span className="text-[10px] text-gray-400 font-bold">Thang điểm: {exam.totalScore}đ</span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${exam.level === 'TOPIK_I' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-purple-50 text-purple-600 border border-purple-200'
                                                    }`}>
                                                    {exam.level === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-gray-500">
                                                <span className="inline-flex items-center gap-1"><Clock size={13} /> {exam.durationMinutes}p</span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-black text-[#373A4D]">
                                                {exam.totalQuestions || 0} câu
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${exam.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                    }`}>
                                                    {exam.status === 'OPEN' ? 'Đang mở' : 'Bản nháp'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenQuestionsEditor(exam)}
                                                        className="px-3 py-1.5 bg-pink-50 hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-xl text-xs font-black transition flex items-center gap-1 shadow-2xs"
                                                    >
                                                        <Layers size={13} /> Soạn đề
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditExam(exam)}
                                                        className="p-1.5 text-gray-400 hover:text-[#F06292] rounded-xl hover:bg-pink-50 transition"
                                                    >
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                                                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: KẾT QUẢ THI CỦA HỌC VIÊN                                          */}
            {/* ========================================================================= */}
            {adminTab === 'SUBMISSIONS' && (
                <div className="space-y-4">

                    {/* THỐNG KÊ NHANH */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-pink-100 shadow-2xs">
                            <span className="text-gray-400 font-bold text-xs">Tổng số lượt nộp bài</span>
                            <p className="text-2xl font-black text-[#373A4D] mt-1">{submissions.length} lượt</p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-2xs">
                            <span className="text-gray-400 font-bold text-xs">Số lượt đạt chứng chỉ</span>
                            <p className="text-2xl font-black text-emerald-600 mt-1">
                                {submissions.filter(s => s.passedLevel && s.passedLevel.includes('Level')).length} lượt
                            </p>
                        </div>
                        <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-2xs">
                            <span className="text-gray-400 font-bold text-xs">Tỉ lệ đạt chứng chỉ</span>
                            <p className="text-2xl font-black text-purple-600 mt-1">
                                {submissions.length > 0
                                    ? Math.round((submissions.filter(s => s.passedLevel && s.passedLevel.includes('Level')).length / submissions.length) * 100)
                                    : 0}%
                            </p>
                        </div>
                    </div>

                    {/* BỘ LỌC VÀ TÌM KIẾM */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-3xl border border-pink-100 shadow-2xs">
                        <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-100 flex-1 max-w-md">
                            <Search size={16} className="text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm theo tên học viên, email hoặc tên đề..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent text-xs font-bold text-[#373A4D] focus:outline-none w-full"
                            />
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <Filter size={15} />
                            <span>Cấp độ:</span>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 border border-pink-100 rounded-xl font-bold text-[#373A4D] focus:outline-none"
                            >
                                <option value="ALL">Tất cả cấp độ</option>
                                <option value="TOPIK_I">TOPIK I</option>
                                <option value="TOPIK_II">TOPIK II</option>
                            </select>
                        </div>
                    </div>

                    {/* BẢNG KẾT QUẢ THI */}
                    <div className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="bg-[#FFF5F7] text-[#373A4D] font-black uppercase text-[11px] border-b border-pink-100">
                                <tr>
                                    <th className="py-4 px-6 w-16">ID</th>
                                    <th className="py-4 px-6">Học viên</th>
                                    <th className="py-4 px-6">Đề thi</th>
                                    <th className="py-4 px-6 text-center">Điểm chi tiết</th>
                                    <th className="py-4 px-6 text-center">Tổng điểm</th>
                                    <th className="py-4 px-6 text-center">Xếp loại</th>
                                    <th className="py-4 px-6 text-center">Thời gian nộp</th>
                                    <th className="py-4 px-6 text-center w-36">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pink-50">
                                {loadingSubmissions ? (
                                    <tr><td colSpan="8" className="py-12 text-center text-gray-400 font-bold">Đang tải kết quả thi của học viên...</td></tr>
                                ) : filteredSubmissions.length === 0 ? (
                                    <tr><td colSpan="8" className="py-12 text-center text-gray-400 font-bold">Không tìm thấy bài thi nào.</td></tr>
                                ) : (
                                    filteredSubmissions.map((sub) => (
                                        <tr key={sub.submissionId} className="hover:bg-[#FFFDFE] transition">
                                            <td className="py-4 px-6 font-bold text-gray-400">#{sub.submissionId}</td>
                                            <td className="py-4 px-6">
                                                <p className="font-black text-[#373A4D] text-sm">{sub.userFullName}</p>
                                                <span className="text-[10px] text-gray-400 font-bold">{sub.userEmail}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-black text-[#373A4D]">{sub.examTitle}</p>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase inline-block mt-0.5 ${sub.examLevel === 'TOPIK_I' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {sub.examLevel === 'TOPIK_I' ? 'TOPIK I' : 'TOPIK II'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-gray-600">
                                                Nghe: <strong className="text-[#F06292]">{sub.listeningScore}đ</strong> | Đọc: <strong className="text-emerald-600">{sub.readingScore}đ</strong>
                                                {sub.examLevel === 'TOPIK_II' && sub.writingScore !== null && (
                                                    <> | Viết: <strong className="text-purple-600">{sub.writingScore}đ</strong></>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center font-black text-sm text-[#F06292]">
                                                {sub.totalScore}đ
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${sub.passedLevel && sub.passedLevel.includes('Level')
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-rose-50 text-rose-600 border border-rose-200'
                                                    }`}>
                                                    {sub.passedLevel}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center font-bold text-gray-400">
                                                {sub.submittedAt ? sub.submittedAt.replace('T', ' ').substring(0, 16) : 'Vừa xong'}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleViewSubmissionDetail(sub.submissionId)}
                                                    className="px-3.5 py-1.5 bg-pink-50 hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-xl text-xs font-black transition shadow-2xs flex items-center gap-1 mx-auto"
                                                >
                                                    <BookOpen size={13} /> Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: TẠO / SỬA THÔNG TIN ĐỀ THI                                      */}
            {/* ========================================================================= */}
            {showExamModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-pink-50">
                            <h3 className="text-base font-black text-[#373A4D]">
                                {isEditingExam ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
                            </h3>
                            <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveExam} className="space-y-4 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Tên đề thi:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Đề thi thử TOPIK II - Kỳ 91"
                                    value={examFormData.title}
                                    onChange={(e) => setExamFormData({ ...examFormData, title: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block mb-1">Cấp độ thi:</label>
                                    <select
                                        value={examFormData.level}
                                        onChange={(e) => {
                                            const lvl = e.target.value;
                                            setExamFormData({
                                                ...examFormData,
                                                level: lvl,
                                                durationMinutes: lvl === 'TOPIK_I' ? 100 : 180,
                                                totalScore: lvl === 'TOPIK_I' ? 200.0 : 300.0
                                            });
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    >
                                        <option value="TOPIK_I">TOPIK I (Cấp 1 - 2, 200đ)</option>
                                        <option value="TOPIK_II">TOPIK II (Cấp 3 - 6, 300đ)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block mb-1">Trạng thái:</label>
                                    <select
                                        value={examFormData.status}
                                        onChange={(e) => setExamFormData({ ...examFormData, status: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    >
                                        <option value="DRAFT">Bản nháp</option>
                                        <option value="OPEN">Đang mở</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block mb-1">Thời gian làm bài (Phút):</label>
                                    <input
                                        type="number"
                                        min="10"
                                        value={examFormData.durationMinutes}
                                        onChange={(e) => setExamFormData({ ...examFormData, durationMinutes: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1">Tổng điểm chuẩn:</label>
                                    <input
                                        type="number"
                                        value={examFormData.totalScore}
                                        onChange={(e) => setExamFormData({ ...examFormData, totalScore: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-pink-50">
                                <button
                                    type="button"
                                    onClick={() => setShowExamModal(false)}
                                    className="px-4 py-2 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#F06292] hover:bg-[#e05584] text-white rounded-xl font-black shadow-sm"
                                >
                                    {isEditingExam ? 'Lưu thay đổi' : 'Tạo đề thi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: BẢNG SOẠN ĐỀ TOPIK                                              */}
            {/* ========================================================================= */}
            {showQuestionModal && currentExam && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-6xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">

                        <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                            <div>
                                <span className="text-[10px] font-black uppercase text-[#F06292]">
                                    Soạn thảo {currentExam.level === 'TOPIK_II' ? 'TOPIK II (Nghe, Đọc, Viết)' : 'TOPIK I (Nghe & Đọc)'}
                                </span>
                                <h3 className="text-lg font-black text-[#373A4D]">
                                    {currentExam.title} ({questions.length} câu)
                                </h3>
                            </div>
                            <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Thanh công cụ Import */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#FFF5F7] rounded-2xl border border-pink-100">
                            <div className="flex flex-wrap items-center gap-2">
                                <input
                                    type="file"
                                    ref={excelInputRef}
                                    onChange={handleExcelUpload}
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                />
                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-emerald-200 shadow-2xs">
                                    <button
                                        onClick={() => excelInputRef.current?.click()}
                                        disabled={isImportingExcel}
                                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <FileSpreadsheet size={15} className={isImportingExcel ? 'animate-spin' : ''} />
                                        {isImportingExcel ? 'Đang đọc Excel...' : '1. Nạp từ Excel (.xlsx)'}
                                    </button>

                                    <button
                                        onClick={handleDownloadTemplate}
                                        className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                                        title={`Tải file mẫu Excel ${currentExam.level}`}
                                    >
                                        <Download size={15} />
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    ref={pdfInputRef}
                                    onChange={handlePdfUpload}
                                    accept=".pdf"
                                    className="hidden"
                                />
                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-pink-200 shadow-2xs">
                                    <select
                                        value={extractSection}
                                        onChange={(e) => setExtractSection(e.target.value)}
                                        className="px-2 py-1.5 bg-gray-50 text-[#373A4D] text-xs font-bold rounded-lg border border-pink-100 focus:outline-none"
                                    >
                                        <option value="ALL">Cả đề</option>
                                        <option value="LISTENING">Phần Nghe</option>
                                        {currentExam.level === 'TOPIK_II' && (
                                            <option value="WRITING">Phần Viết (C51 - 54)</option>
                                        )}
                                        <option value="READING">Phần Đọc</option>
                                    </select>

                                    <button
                                        onClick={() => pdfInputRef.current?.click()}
                                        disabled={isExtractingPdf}
                                        className="px-3.5 py-2 bg-gradient-to-r from-purple-500 to-[#F06292] text-white text-xs font-black rounded-lg hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <Sparkles size={14} className={isExtractingPdf ? 'animate-spin' : ''} />
                                        {isExtractingPdf ? 'Gemini xử lý...' : 'Nạp từ PDF AI'}
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    ref={audioFilesInputRef}
                                    onChange={handleAudioFilesUpload}
                                    accept=".mp3,.m4a,.wav"
                                    multiple
                                    className="hidden"
                                />
                                <button
                                    onClick={() => audioFilesInputRef.current?.click()}
                                    disabled={isUploadingAudios}
                                    className="px-3.5 py-2.5 bg-white border border-pink-300 text-[#F06292] hover:bg-pink-50 text-xs font-black rounded-xl shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Music size={15} className={isUploadingAudios ? 'animate-bounce' : ''} />
                                    {isUploadingAudios ? 'Đang tải Audio...' : '2. Gắn bộ file MP3 (Ctrl + A)'}
                                </button>
                            </div>

                            <button
                                onClick={handleSaveQuestionsToDb}
                                disabled={isSavingQuestions || questions.length === 0}
                                className="px-5 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Save size={15} />
                                {isSavingQuestions ? 'Đang lưu vào MySQL...' : 'Lưu toàn bộ câu hỏi'}
                            </button>
                        </div>

                        {/* Danh sách Preview câu hỏi */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                            {questions.map((q, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 bg-white rounded-2xl border shadow-2xs space-y-2 transition ${q.section === 'WRITING' ? 'border-purple-200 bg-purple-50/20' : 'border-pink-100 hover:border-pink-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-7 h-7 font-black rounded-xl flex items-center justify-center text-xs ${q.section === 'WRITING' ? 'bg-purple-100 text-purple-700' : 'bg-[#FFF0F4] text-[#F06292]'
                                                }`}>
                                                {q.questionNum}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${q.section === 'LISTENING' ? 'bg-blue-50 text-blue-600' : q.section === 'READING' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {q.section}
                                            </span>
                                            <span className="text-[10px] font-bold text-gray-400">Điểm: {q.score}</span>
                                        </div>

                                        {q.audioUrl && (
                                            <div className="flex items-center gap-2 bg-pink-50/70 px-2.5 py-1 rounded-xl border border-pink-100">
                                                <button
                                                    onClick={() => togglePlayAudio(q.audioUrl)}
                                                    className="text-[#F06292] hover:scale-110 transition"
                                                >
                                                    {playingAudio === q.audioUrl ? <Pause size={14} /> : <Play size={14} />}
                                                </button>
                                                <span className="text-[10px] font-mono text-gray-500 truncate max-w-[120px]">
                                                    {q.audioUrl.split('/').pop()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {q.passage && (
                                        <div className="p-2.5 bg-gray-50 rounded-xl text-gray-700 text-[11px] leading-relaxed border border-gray-100 font-medium whitespace-pre-line">
                                            {q.passage}
                                        </div>
                                    )}

                                    <p className="font-bold text-[#373A4D] text-xs whitespace-pre-line">{q.questionText}</p>

                                    {q.questionType === 'MULTIPLE_CHOICE' && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            {[
                                                { key: '1', text: q.option1 },
                                                { key: '2', text: q.option2 },
                                                { key: '3', text: q.option3 },
                                                { key: '4', text: q.option4 },
                                            ].map(opt => (
                                                <div
                                                    key={opt.key}
                                                    className={`p-2 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 ${String(q.correctOption) === opt.key
                                                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                                            : 'bg-gray-50/50 border-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    <span className="font-black text-[10px]">{opt.key}.</span>
                                                    <span className="truncate">{opt.text || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {(q.questionType === 'SHORT_WRITING' || q.questionType === 'ESSAY') && (
                                        <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1.5 text-xs">
                                            <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px]">
                                                <PenTool size={13} /> Đáp án mẫu & Barem chuẩn:
                                            </div>
                                            <div className="p-2 bg-purple-50/50 rounded-lg text-gray-700 font-medium whitespace-pre-line text-[11px]">
                                                {q.correctOption || 'Chưa thiết lập bài mẫu.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 flex justify-between items-center border-t border-pink-50 text-xs">
                            <span className="text-gray-400 font-bold">
                                Tổng số: <strong className="text-[#373A4D]">{questions.length}</strong> câu hỏi
                            </span>
                            <button
                                onClick={() => setShowQuestionModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: ADMIN XEM CHI TIẾT BÀI LÀM CỦA HỌC VIÊN                         */}
            {/* ========================================================================= */}
            {showSubmissionModal && selectedSubmission && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-5xl rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">

                        {/* Header Modal */}
                        <div className="flex items-center justify-between pb-3 border-b border-pink-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#FFF0F4] text-[#F06292] flex items-center justify-center font-black">
                                    <UserCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-[#373A4D]">
                                        Bài làm của: {selectedSubmission.userFullName} ({selectedSubmission.userEmail})
                                    </h3>
                                    <p className="text-[11px] font-bold text-gray-400">
                                        Đề thi: <strong className="text-[#373A4D]">{selectedSubmission.examTitle}</strong> • Nộp lúc: {selectedSubmission.submittedAt ? selectedSubmission.submittedAt.replace('T', ' ').substring(0, 16) : ''}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowSubmissionModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Thống kê điểm số */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FFF5F7] p-4 rounded-2xl border border-pink-100">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Nghe (듣기)</span>
                                <p className="text-lg font-black text-[#F06292]">{selectedSubmission.listeningScore}đ</p>
                            </div>
                            {selectedSubmission.examLevel === 'TOPIK_II' && (
                                <div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Viết (쓰기)</span>
                                    <p className="text-lg font-black text-purple-600">{selectedSubmission.writingScore}đ</p>
                                </div>
                            )}
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Đọc (읽기)</span>
                                <p className="text-lg font-black text-emerald-600">{selectedSubmission.readingScore}đ</p>
                            </div>
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Tổng & Xếp loại</span>
                                <p className="text-lg font-black text-[#373A4D]">
                                    {selectedSubmission.totalScore}đ • <span className="text-purple-600">{selectedSubmission.passedLevel}</span>
                                </p>
                            </div>
                        </div>

                        {/* NHẬN XÉT CỦA GEMINI AI CHO BÀI VIẾT (NẾU CÓ) */}
                        {selectedSubmission.writingFeedback && selectedSubmission.writingFeedback !== '{}' && (
                            <div className="p-4 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-2 text-xs">
                                <h4 className="font-black text-purple-900 flex items-center gap-1.5">
                                    <Sparkles size={15} className="text-purple-600" />
                                    Đánh giá bài viết từ Giám khảo Gemini AI (C51 - C54):
                                </h4>
                                {(() => {
                                    try {
                                        const parsed = JSON.parse(selectedSubmission.writingFeedback);
                                        const feedbacks = parsed.feedback || [];
                                        return (
                                            <div className="space-y-2 mt-1">
                                                {feedbacks.map((item, idx) => (
                                                    <div key={idx} className="p-3 bg-white rounded-xl border border-purple-100">
                                                        <div className="flex justify-between font-bold text-purple-800">
                                                            <span>Câu {item.questionNum}</span>
                                                            <span className="text-[#F06292]">Điểm: {item.score}đ</span>
                                                        </div>
                                                        <p className="text-gray-600 mt-1 font-medium">{item.comment}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    } catch {
                                        return <p className="text-gray-500 font-medium">{selectedSubmission.writingFeedback}</p>;
                                    }
                                })()}
                            </div>
                        )}

                        {/* BỘ LỌC CÂU HỎI TRONG BÀI THI */}
                        <div className="flex items-center justify-between pt-1">
                            <h4 className="text-xs font-black text-[#373A4D] uppercase">
                                Chi tiết câu trả lời ({selectedSubmission.questions?.length || 0} câu)
                            </h4>

                            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl border border-pink-100 text-[11px] font-bold">
                                <button
                                    onClick={() => setSubReviewFilter('ALL')}
                                    className={`px-3 py-1 rounded-lg transition ${subReviewFilter === 'ALL' ? 'bg-[#F06292] text-white' : 'text-gray-500'}`}
                                >
                                    Tất cả
                                </button>
                                <button
                                    onClick={() => setSubReviewFilter('WRONG')}
                                    className={`px-3 py-1 rounded-lg transition ${subReviewFilter === 'WRONG' ? 'bg-rose-500 text-white' : 'text-rose-500'}`}
                                >
                                    Sai ({(selectedSubmission.questions || []).filter(q => !q.isCorrect).length})
                                </button>
                                <button
                                    onClick={() => setSubReviewFilter('CORRECT')}
                                    className={`px-3 py-1 rounded-lg transition ${subReviewFilter === 'CORRECT' ? 'bg-emerald-600 text-white' : 'text-emerald-600'}`}
                                >
                                    Đúng ({(selectedSubmission.questions || []).filter(q => q.isCorrect).length})
                                </button>
                            </div>
                        </div>

                        {/* DANH SÁCH CÂU HỎI ĐƯỢC CHẤM */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                            {(selectedSubmission.questions || [])
                                .filter(q => {
                                    if (subReviewFilter === 'WRONG') return !q.isCorrect;
                                    if (subReviewFilter === 'CORRECT') return q.isCorrect;
                                    return true;
                                })
                                .map((q) => (
                                    <div
                                        key={q.questionId}
                                        className={`p-4 rounded-2xl border space-y-2 transition ${q.isCorrect ? 'border-emerald-200 bg-white' : 'border-rose-200 bg-rose-50/10'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {q.questionNum}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase text-gray-500">{q.section}</span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${q.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                    }`}>
                                                    {q.isCorrect ? `Đúng (+${q.score}đ)` : 'Sai (0đ)'}
                                                </span>
                                            </div>
                                        </div>

                                        {q.passage && (
                                            <div className="p-2.5 bg-gray-50 rounded-xl text-gray-700 text-[11px] leading-relaxed border border-gray-100 font-medium whitespace-pre-line">
                                                {q.passage}
                                            </div>
                                        )}

                                        <p className="font-bold text-[#373A4D] text-xs">{q.questionText}</p>

                                        {/* Dạng trắc nghiệm */}
                                        {q.questionType === 'MULTIPLE_CHOICE' && (
                                            <div className="grid grid-cols-2 gap-2 pt-1">
                                                {[
                                                    { key: '1', text: q.option1 },
                                                    { key: '2', text: q.option2 },
                                                    { key: '3', text: q.option3 },
                                                    { key: '4', text: q.option4 },
                                                ].map(opt => {
                                                    const isCorrectAns = String(q.correctAnswer) === opt.key;
                                                    const isStudentPick = String(q.studentAnswer) === opt.key;

                                                    let style = 'bg-gray-50/60 border-gray-100 text-gray-600';
                                                    if (isCorrectAns) style = 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold';
                                                    else if (isStudentPick && !q.isCorrect) style = 'bg-rose-50 border-rose-300 text-rose-700 font-bold';

                                                    return (
                                                        <div key={opt.key} className={`p-2 rounded-xl border flex items-center justify-between text-[11px] ${style}`}>
                                                            <span>{opt.key}. {opt.text || '—'}</span>
                                                            {isCorrectAns && <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">Đáp án</span>}
                                                            {isStudentPick && !isCorrectAns && <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-black">Học viên chọn</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Dạng câu viết */}
                                        {(q.questionType === 'SHORT_WRITING' || q.questionType === 'ESSAY') && (
                                            <div className="space-y-1.5 pt-1">
                                                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                                    <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Bài làm của học viên:</span>
                                                    <p className="text-gray-800 font-medium whitespace-pre-line">{q.studentAnswer || '(Chưa làm câu này)'}</p>
                                                </div>
                                                <div className="p-2.5 bg-purple-50/40 rounded-xl border border-purple-100">
                                                    <span className="text-[10px] font-bold text-purple-700 block mb-0.5">Đáp án mẫu:</span>
                                                    <p className="text-gray-700 font-medium whitespace-pre-line">{q.correctAnswer}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>

                        <div className="pt-2 flex justify-end border-t border-pink-50">
                            <button
                                onClick={() => setShowSubmissionModal(false)}
                                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs"
                            >
                                Đóng
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
};

export default TopikManagement;