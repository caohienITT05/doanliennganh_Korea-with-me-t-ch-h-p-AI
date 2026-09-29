import React, { useState, useEffect, useRef } from 'react';
import axios from './axios';
import {
    Award, Plus, Trash2, Edit3, FileText, Music,
    Play, Pause, Clock, Layers, X, Save, Sparkles,
    FileSpreadsheet, Download, PenTool, CheckCircle2
} from 'lucide-react';

const TopikManagement = () => {
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

    useEffect(() => {
        fetchExams();
        return () => {
            audioPlayerRef.current.pause();
        };
    }, []);

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

    // Tải file mẫu Excel tương ứng theo cấp độ đề thi
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

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-[#373A4D] flex items-center gap-2">
                        <Award className="text-[#F06292]" size={26} /> Quản lý Đề thi TOPIK I & II
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Hỗ trợ trọn vẹn cả TOPIK I (Nghe & Đọc) và TOPIK II (Nghe, Đọc và phần Viết câu 51–54).
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateExam}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-sm transition self-start"
                >
                    <Plus size={16} /> Thêm đề thi mới
                </button>
            </div>

            {message.text && (
                <div className={`p-3.5 rounded-2xl text-xs font-black flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
            )}

            {/* Bảng danh sách đề thi */}
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

            {/* MODAL 1: TẠO / SỬA THÔNG TIN ĐỀ THI */}
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

            {/* MODAL 2: BẢNG SOẠN ĐỀ TOPIK I & II */}
            {showQuestionModal && currentExam && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-6xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">

                        {/* Header Modal */}
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

                                {/* 1. NẠP TỪ EXCEL */}
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

                                {/* 2. NẠP TỪ PDF BẰNG GEMINI */}
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

                                {/* 3. NÚT CHỌN NHIỀU FILE MP3 */}
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

                            {/* 4. NÚT LƯU VÀO DATABASE */}
                            <button
                                onClick={handleSaveQuestionsToDb}
                                disabled={isSavingQuestions || questions.length === 0}
                                className="px-5 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <Save size={15} />
                                {isSavingQuestions ? 'Đang lưu vào MySQL...' : 'Lưu toàn bộ câu hỏi'}
                            </button>
                        </div>

                        {/* Bảng danh sách câu hỏi Preview */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                            {questions.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 font-bold bg-[#FFF9FA] rounded-2xl border border-dashed border-pink-200">
                                    <FileText className="w-10 h-10 mx-auto text-pink-300 mb-2" />
                                    <p>Chưa có câu hỏi nào.</p>
                                    <p className="text-[11px] font-medium text-gray-400 mt-1">
                                        Bấm biểu tượng Tải về để lấy file mẫu Excel ({currentExam.level}) hoặc bấm "Nạp từ PDF AI"!
                                    </p>
                                </div>
                            ) : (
                                questions.map((q, idx) => (
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
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {q.questionType === 'SHORT_WRITING' ? 'Điền từ (10đ)' : q.questionType === 'ESSAY' ? (q.questionNum === 53 ? 'Viết biểu đồ 200-300 chữ (30đ)' : 'Viết luận 600-700 chữ (50đ)') : `Điểm: ${q.score}`}
                                                </span>
                                            </div>

                                            {q.audioUrl && (
                                                <div className="flex items-center gap-2 bg-pink-50/70 px-2.5 py-1 rounded-xl border border-pink-100">
                                                    <button
                                                        onClick={() => togglePlayAudio(q.audioUrl)}
                                                        className="text-[#F06292] hover:scale-110 transition"
                                                        title="Nghe thử"
                                                    >
                                                        {playingAudio === q.audioUrl ? <Pause size={14} /> : <Play size={14} />}
                                                    </button>
                                                    <span className="text-[10px] font-mono text-gray-500 truncate max-w-[120px]">
                                                        {q.audioUrl.split('/').pop()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Đoạn văn đọc hiểu chung */}
                                        {q.passage && (
                                            <div className="p-2.5 bg-gray-50 rounded-xl text-gray-700 text-[11px] leading-relaxed border border-gray-100 font-medium whitespace-pre-line">
                                                {q.passage}
                                            </div>
                                        )}

                                        {/* Nội dung câu hỏi */}
                                        <p className="font-bold text-[#373A4D] text-xs whitespace-pre-line">{q.questionText}</p>

                                        {/* 1. HIỂN THỊ CÂU TRẮC NGHIỆM */}
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

                                        {/* 2. HIỂN THỊ CÂU VIẾT TOPIK II (C51 - C54) */}
                                        {(q.questionType === 'SHORT_WRITING' || q.questionType === 'ESSAY') && (
                                            <div className="p-3 bg-white rounded-xl border border-purple-100 space-y-1.5 text-xs">
                                                <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px]">
                                                    <PenTool size={13} /> Đáp án mẫu & Barem chuẩn để AI chấm:
                                                </div>
                                                <div className="p-2 bg-purple-50/50 rounded-lg text-gray-700 font-medium whitespace-pre-line text-[11px]">
                                                    {q.correctOption || 'Chưa thiết lập bài mẫu.'}
                                                </div>
                                            </div>
                                        )}

                                        {/* Lời giải */}
                                        {q.explanation && (
                                            <p className="text-[10px] text-gray-400 font-medium pt-1 italic">
                                                Tiêu chí / Giải thích: {q.explanation}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Modal */}
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

        </div>
    );
};

export default TopikManagement;