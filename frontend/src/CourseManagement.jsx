import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen, Plus, Trash2, Edit3, Volume2, ArrowLeft,
    Layers, BookMarked, Save, X, FileSpreadsheet, Download, Upload, FileCode
} from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from './axios';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [activeTab, setActiveTab] = useState('vocab');

    const [vocabularies, setVocabularies] = useState([]);
    const [grammars, setGrammars] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Single Modal State
    const [showEditCourseModal, setShowEditCourseModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showAddLessonModal, setShowAddLessonModal] = useState(false);
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonOrder, setNewLessonOrder] = useState(1);
    const [showAddVocabModal, setShowAddVocabModal] = useState(false);
    const [newWordKr, setNewWordKr] = useState('');
    const [newMeaningVn, setNewMeaningVn] = useState('');
    const [showAddGrammarModal, setShowAddGrammarModal] = useState(false);
    const [newStructure, setNewStructure] = useState('');
    const [newUsageDesc, setNewUsageDesc] = useState('');
    const [newExampleKr, setNewExampleKr] = useState('');
    const [newExampleVn, setNewExampleVn] = useState('');

    // Bulk Import State
    const [showBatchVocabModal, setShowBatchVocabModal] = useState(false);
    const [batchVocabText, setBatchVocabText] = useState('');
    const [parsedVocabList, setParsedVocabList] = useState([]);
    const vocabFileInputRef = useRef(null);

    const [showBatchGrammarModal, setShowBatchGrammarModal] = useState(false);
    const [batchGrammarText, setBatchGrammarText] = useState('');
    const [parsedGrammarList, setParsedGrammarList] = useState([]);
    const grammarFileInputRef = useRef(null);

    // ================= 1. FETCH DATA =================
    const fetchCourses = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/courses');
            setCourses(res.data);
        } catch {
            setMessage({ text: 'Không thể tải danh sách khóa học!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchLessons = async (courseId) => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/admin/lessons?courseId=${courseId}`);
            setLessons(res.data);
        } catch {
            setMessage({ text: 'Không thể tải danh sách bài học!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectCourse = (course) => {
        setSelectedCourse(course);
        setSelectedLesson(null);
        fetchLessons(course.id);
    };

    const fetchLessonDetails = async (lessonId) => {
        setLoading(true);
        try {
            const [vocabRes, grammarRes] = await Promise.all([
                axios.get(`/api/admin/vocabularies?lessonId=${lessonId}`),
                axios.get(`/api/admin/grammars?lessonId=${lessonId}`)
            ]);
            setVocabularies(vocabRes.data);
            setGrammars(grammarRes.data);
        } catch {
            setMessage({ text: 'Không thể tải nội dung bài học!', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLesson = (lesson) => {
        setSelectedLesson(lesson);
        fetchLessonDetails(lesson.id);
    };

    const speakKorean = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    };

    // ================= 2. IMPORT FILE (EXCEL / JSON) - TỪ VỰNG =================
    const handleVocabFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    if (!Array.isArray(json)) throw new Error('Dữ liệu JSON phải là mảng []');
                    const result = json.map(item => ({
                        lessonId: selectedLesson.id,
                        wordKr: item.wordKr || item.word || item['Từ tiếng Hàn'] || '',
                        meaningVn: item.meaningVn || item.meaning || item['Nghĩa tiếng Việt'] || '',
                        audioUrl: item.audioUrl || null
                    })).filter(item => item.wordKr && item.meaningVn);
                    setParsedVocabList(result);
                } catch {
                    alert('File JSON không hợp lệ hoặc sai cấu trúc!');
                }
            };
            reader.readAsText(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const workbook = XLSX.read(event.target.result, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    const result = [];
                    // Bỏ qua dòng tiêu đề nếu dòng đầu tiên chứa chữ "Từ" hoặc "Word"
                    const startIndex = (rows[0] && (String(rows[0][0]).toLowerCase().includes('từ') || String(rows[0][0]).toLowerCase().includes('word'))) ? 1 : 0;

                    for (let i = startIndex; i < rows.length; i++) {
                        const row = rows[i];
                        if (row && row[0] && row[1]) {
                            result.push({
                                lessonId: selectedLesson.id,
                                wordKr: String(row[0]).trim(),
                                meaningVn: String(row[1]).trim(),
                                audioUrl: null
                            });
                        }
                    }
                    setParsedVocabList(result);
                } catch {
                    alert('Không thể đọc file Excel!');
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    const handleParseVocabText = (text) => {
        setBatchVocabText(text);
        const lines = text.split('\n');
        const result = [];

        lines.forEach((line) => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            let parts = cleanLine.split('\t');
            if (parts.length < 2) parts = cleanLine.split(' - ');
            if (parts.length < 2) parts = cleanLine.split(':');
            if (parts.length < 2) parts = cleanLine.split(',');

            if (parts.length >= 2) {
                result.push({
                    lessonId: selectedLesson.id,
                    wordKr: parts[0].trim(),
                    meaningVn: parts.slice(1).join(' - ').trim(),
                    audioUrl: null
                });
            }
        });
        setParsedVocabList(result);
    };

    const downloadVocabExcelTemplate = () => {
        const wsData = [
            ['Từ tiếng Hàn', 'Nghĩa tiếng Việt'],
            ['사과', 'Quả táo'],
            ['학교', 'Trường học'],
            ['선생님', 'Giáo viên'],
            ['학생', 'Học sinh']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'TuVung');
        XLSX.writeFile(wb, 'Mau_Import_Tu_Vung.xlsx');
    };

    const downloadVocabJsonTemplate = () => {
        const data = [
            { wordKr: "사과", meaningVn: "Quả táo" },
            { wordKr: "학교", meaningVn: "Trường học" },
            { wordKr: "선생님", meaningVn: "Giáo viên" }
        ];
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Mau_Import_Tu_Vung.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveBatchVocab = async () => {
        if (parsedVocabList.length === 0) return;
        try {
            const res = await axios.post('/api/admin/vocabularies/batch', parsedVocabList);
            setVocabularies([...vocabularies, ...res.data]);
            setShowBatchVocabModal(false);
            setBatchVocabText('');
            setParsedVocabList([]);
            setMessage({ text: `Đã import thành công ${res.data.length} từ vựng!`, type: 'success' });
        } catch {
            setMessage({ text: 'Lỗi khi lưu danh sách từ vựng!', type: 'error' });
        }
    };

    // ================= 3. IMPORT FILE (EXCEL / JSON) - NGỮ PHÁP =================
    const handleGrammarFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    if (!Array.isArray(json)) throw new Error('Dữ liệu JSON phải là mảng []');
                    const result = json.map(item => ({
                        lessonId: selectedLesson.id,
                        structure: item.structure || item['Cấu trúc'] || '',
                        usageDesc: item.usageDesc || item['Cách dùng'] || '',
                        exampleKr: item.exampleKr || item['Ví dụ tiếng Hàn'] || '',
                        exampleVn: item.exampleVn || item['Nghĩa ví dụ'] || ''
                    })).filter(item => item.structure);
                    setParsedGrammarList(result);
                } catch {
                    alert('File JSON ngữ pháp không hợp lệ!');
                }
            };
            reader.readAsText(file);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const workbook = XLSX.read(event.target.result, { type: 'binary' });
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                    const result = [];
                    const startIndex = (rows[0] && String(rows[0][0]).toLowerCase().includes('cấu trúc')) ? 1 : 0;

                    for (let i = startIndex; i < rows.length; i++) {
                        const row = rows[i];
                        if (row && row[0]) {
                            result.push({
                                lessonId: selectedLesson.id,
                                structure: String(row[0] || '').trim(),
                                usageDesc: String(row[1] || '').trim(),
                                exampleKr: String(row[2] || '').trim(),
                                exampleVn: String(row[3] || '').trim()
                            });
                        }
                    }
                    setParsedGrammarList(result);
                } catch {
                    alert('Không thể đọc file Excel!');
                }
            };
            reader.readAsBinaryString(file);
        }
    };

    const handleParseGrammarText = (text) => {
        setBatchGrammarText(text);
        const clean = text.trim();
        if (!clean) {
            setParsedGrammarList([]);
            return;
        }

        // 1. Kiểm tra nếu người dùng dán trực tiếp đoạn mã JSON vào ô
        if (clean.startsWith('[') || clean.startsWith('{')) {
            try {
                const parsed = JSON.parse(clean);
                const array = Array.isArray(parsed) ? parsed : [parsed];
                const result = array.map(item => ({
                    lessonId: selectedLesson.id,
                    structure: item.structure || item['Cấu trúc'] || '',
                    usageDesc: item.usageDesc || item['Cách dùng'] || '',
                    exampleKr: item.exampleKr || item['Ví dụ tiếng Hàn'] || item['Ví dụ'] || '',
                    exampleVn: item.exampleVn || item['Nghĩa ví dụ'] || item['Dịch'] || ''
                })).filter(item => item.structure);

                setParsedGrammarList(result);
                return;
            } catch {
                // Nếu người dùng đang gõ dở JSON thì tiếp tục rơi xuống parse dòng thông thường
            }
        }

        // 2. Parse theo định dạng dòng truyền thống (Phân cách bằng Tab hoặc dấu |)
        const lines = text.split('\n');
        const result = [];

        lines.forEach((line) => {
            const cleanLine = line.trim();
            if (!cleanLine) return;

            let parts = cleanLine.split('\t');
            if (parts.length < 2) parts = cleanLine.split('|');

            if (parts.length >= 1 && parts[0].trim()) {
                result.push({
                    lessonId: selectedLesson.id,
                    structure: parts[0]?.trim() || '',
                    usageDesc: parts[1]?.trim() || '',
                    exampleKr: parts[2]?.trim() || '',
                    exampleVn: parts[3]?.trim() || ''
                });
            }
        });
        setParsedGrammarList(result);
    };

    const downloadGrammarExcelTemplate = () => {
        const wsData = [
            ['Cấu trúc', 'Cách dùng', 'Ví dụ tiếng Hàn', 'Nghĩa ví dụ'],
            ['N + 은/는', 'Trợ từ chủ đề gắn sau danh từ', '저는 학생입니다', 'Tôi là học sinh'],
            ['N + 이/가', 'Trợ từ biểu thị chủ ngữ', '비가 와요', 'Trời đang mưa']
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'NguPhap');
        XLSX.writeFile(wb, 'Mau_Import_Ngu_Phap.xlsx');
    };
    const downloadGrammarJsonTemplate = () => {
        const data = [
            {
                structure: "N + 은/는",
                usageDesc: "Trợ từ chủ đề gắn sau danh từ. 은 khi có patchim, 는 khi không có patchim.",
                exampleKr: "저는 학생입니다.",
                exampleVn: "Tôi là học sinh."
            },
            {
                structure: "N + 이/가",
                usageDesc: "Trợ từ biểu thị chủ ngữ trong câu.",
                exampleKr: "비가 와요.",
                exampleVn: "Trời đang mưa."
            },
            {
                structure: "V/A + -아요/어요",
                usageDesc: "Đuôi câu thân mật lịch sự thì hiện tại.",
                exampleKr: "사과를 먹어요.",
                exampleVn: "Tôi ăn táo."
            }
        ];
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Mau_Import_Ngu_Phap.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleSaveBatchGrammar = async () => {
        if (parsedGrammarList.length === 0) return;
        try {
            const res = await axios.post('/api/admin/grammars/batch', parsedGrammarList);
            setGrammars([...grammars, ...res.data]);
            setShowBatchGrammarModal(false);
            setBatchGrammarText('');
            setParsedGrammarList([]);
            setMessage({ text: `Đã import thành công ${res.data.length} ngữ pháp!`, type: 'success' });
        } catch {
            setMessage({ text: 'Lỗi khi lưu ngữ pháp hàng loạt!', type: 'error' });
        }
    };

    // ================= 4. SINGLE CRUD THÔNG THƯỜNG =================
    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`/api/admin/courses/${editingCourse.id}`, editingCourse);
            setCourses(courses.map(c => c.id === res.data.id ? res.data : c));
            if (selectedCourse?.id === res.data.id) setSelectedCourse(res.data);
            setShowEditCourseModal(false);
            setMessage({ text: 'Cập nhật thành công!', type: 'success' });
        } catch {
            setMessage({ text: 'Cập nhật thất bại!', type: 'error' });
        }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/lessons', {
                courseId: selectedCourse.id,
                title: newLessonTitle,
                orderIndex: Number(newLessonOrder)
            });
            setLessons([...lessons, res.data]);
            setNewLessonTitle('');
            setShowAddLessonModal(false);
            setMessage({ text: 'Tạo bài học thành công!', type: 'success' });
        } catch {
            setMessage({ text: 'Tạo bài học thất bại!', type: 'error' });
        }
    };

    const handleDeleteLesson = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;
        try {
            await axios.delete(`/api/admin/lessons/${id}`);
            setLessons(lessons.filter(l => l.id !== id));
            setMessage({ text: 'Đã xóa bài học!', type: 'success' });
        } catch {
            setMessage({ text: 'Xóa thất bại!', type: 'error' });
        }
    };

    const handleAddVocabulary = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/vocabularies', {
                lessonId: selectedLesson.id,
                wordKr: newWordKr,
                meaningVn: newMeaningVn
            });
            setVocabularies([...vocabularies, res.data]);
            setNewWordKr('');
            setNewMeaningVn('');
            setShowAddVocabModal(false);
            setMessage({ text: 'Đã thêm từ vựng mới!', type: 'success' });
        } catch {
            setMessage({ text: 'Thêm thất bại!', type: 'error' });
        }
    };

    const handleDeleteVocab = async (id) => {
        if (!window.confirm('Xóa từ vựng này?')) return;
        try {
            await axios.delete(`/api/admin/vocabularies/${id}`);
            setVocabularies(vocabularies.filter(v => v.id !== id));
            setMessage({ text: 'Đã xóa từ vựng!', type: 'success' });
        } catch {
            setMessage({ text: 'Xóa thất bại!', type: 'error' });
        }
    };

    const handleAddGrammar = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/api/admin/grammars', {
                lessonId: selectedLesson.id,
                structure: newStructure,
                usageDesc: newUsageDesc,
                exampleKr: newExampleKr,
                exampleVn: newExampleVn
            });
            setGrammars([...grammars, res.data]);
            setNewStructure('');
            setNewUsageDesc('');
            setNewExampleKr('');
            setNewExampleVn('');
            setShowAddGrammarModal(false);
            setMessage({ text: 'Đã thêm ngữ pháp!', type: 'success' });
        } catch {
            setMessage({ text: 'Thêm thất bại!', type: 'error' });
        }
    };

    const handleDeleteGrammar = async (id) => {
        if (!window.confirm('Xóa ngữ pháp này?')) return;
        try {
            await axios.delete(`/api/admin/grammars/${id}`);
            setGrammars(grammars.filter(g => g.id !== id));
            setMessage({ text: 'Đã xóa ngữ pháp!', type: 'success' });
        } catch {
            setMessage({ text: 'Xóa thất bại!', type: 'error' });
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* BREADCRUMB */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                    <button
                        onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}
                        className={`hover:text-[#F06292] transition ${!selectedCourse ? 'text-[#F06292]' : ''}`}
                    >
                        Quản lý khóa học
                    </button>
                    {selectedCourse && (
                        <>
                            <span>/</span>
                            <button
                                onClick={() => setSelectedLesson(null)}
                                className={`hover:text-[#F06292] transition ${!selectedLesson ? 'text-[#F06292]' : ''}`}
                            >
                                {selectedCourse.name}
                            </button>
                        </>
                    )}
                    {selectedLesson && (
                        <>
                            <span>/</span>
                            <span className="text-[#373A4D]">{selectedLesson.title}</span>
                        </>
                    )}
                </div>

                {(selectedLesson || selectedCourse) && (
                    <button
                        onClick={() => {
                            if (selectedLesson) setSelectedLesson(null);
                            else setSelectedCourse(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-pink-200 text-[#F06292] text-xs font-bold rounded-xl hover:bg-pink-50 transition shadow-sm"
                    >
                        <ArrowLeft size={14} /> Quay lại
                    </button>
                )}
            </div>

            {message.text && (
                <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
                </div>
            )}

            {/* TẦNG 1: KHÓA HỌC */}
            {!selectedCourse && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-[#373A4D]">Khóa học & Cấp độ</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Quản lý định giá thương mại và nội dung theo từng cấp độ tiếng Hàn.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.map((c) => (
                            <div key={c.id} className="bg-white rounded-3xl border border-pink-100 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-pink-300 transition flex flex-col justify-between">
                                <div>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F06292] to-[#F8BBD0] flex items-center justify-center text-white shadow-sm">
                                            <BookOpen size={24} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${c.isFree
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-pink-50 text-[#F06292] border border-pink-200'
                                                }`}>
                                                {c.isFree ? 'MIỄN PHÍ' : 'TÍNH PHÍ'}
                                            </span>
                                            <button
                                                onClick={() => { setEditingCourse({ ...c }); setShowEditCourseModal(true); }}
                                                className="p-1.5 text-gray-400 hover:text-[#F06292] rounded-xl hover:bg-pink-50 transition"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-extrabold text-[#373A4D] mt-4">{c.name}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.description || 'Chưa có mô tả.'}</p>

                                    <div className="mt-4 pt-4 border-t border-pink-50 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] font-bold text-gray-400 uppercase">Giá bán niêm yết:</span>
                                            <p className="text-base font-extrabold text-[#F06292]">
                                                {c.isFree ? '0 VNĐ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSelectCourse(c)}
                                    className="w-full mt-6 py-3 bg-[#FFF5F7] hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2"
                                >
                                    <Layers size={14} /> Quản lý danh sách bài học
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TẦNG 2: BÀI HỌC */}
            {selectedCourse && !selectedLesson && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#373A4D]">{selectedCourse.name}</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                Danh sách bài học. Nhấp vào để soạn Từ vựng và Ngữ pháp.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAddLessonModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm self-start"
                        >
                            <Plus size={16} /> Thêm bài học mới
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-pink-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="bg-[#FFF5F7] text-[#373A4D] font-extrabold uppercase text-[11px] border-b border-pink-100">
                                <tr>
                                    <th className="py-4 px-6 w-20">Thứ tự</th>
                                    <th className="py-4 px-6">Tên bài học</th>
                                    <th className="py-4 px-6 text-center w-48">Nội dung</th>
                                    <th className="py-4 px-6 text-center w-24">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pink-50">
                                {lessons.map((lesson) => (
                                    <tr key={lesson.id} className="hover:bg-[#FFFDFE] transition">
                                        <td className="py-4 px-6 font-bold text-gray-400">#{lesson.orderIndex}</td>
                                        <td className="py-4 px-6 font-bold text-[#373A4D]">{lesson.title}</td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleSelectLesson(lesson)}
                                                className="px-3.5 py-1.5 bg-pink-50 text-[#F06292] border border-pink-200 rounded-xl hover:bg-[#F06292] hover:text-white transition font-bold text-xs inline-flex items-center gap-1.5"
                                            >
                                                <BookMarked size={14} /> Soạn nội dung
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleDeleteLesson(lesson.id)}
                                                className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TẦNG 3: SOẠN TỪ VỰNG & NGỮ PHÁP */}
            {selectedLesson && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold text-[#F06292] uppercase tracking-wide">
                                {selectedCourse.name} • Bài #{selectedLesson.orderIndex}
                            </span>
                            <h2 className="text-2xl font-extrabold text-[#373A4D]">{selectedLesson.title}</h2>
                        </div>

                        <div className="flex bg-[#FFF5F7] p-1.5 rounded-2xl border border-pink-100 self-start">
                            <button
                                onClick={() => setActiveTab('vocab')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'vocab' ? 'bg-white text-[#F06292] shadow-sm' : 'text-gray-500'
                                    }`}
                            >
                                Từ vựng ({vocabularies.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('grammar')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'grammar' ? 'bg-white text-[#F06292] shadow-sm' : 'text-gray-500'
                                    }`}
                            >
                                Ngữ pháp ({grammars.length})
                            </button>
                        </div>
                    </div>

                    {/* TAB TỪ VỰNG */}
                    {activeTab === 'vocab' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <p className="text-xs text-gray-500 font-medium">
                                    Hỗ trợ thêm bằng file Excel (`.xlsx`), JSON (`.json`) hoặc dán trực tiếp.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setParsedVocabList([]);
                                            setBatchVocabText('');
                                            setShowBatchVocabModal(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <FileSpreadsheet size={15} /> Import Excel / JSON
                                    </button>
                                    <button
                                        onClick={() => setShowAddVocabModal(true)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <Plus size={15} /> Thêm lẻ từng từ
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-pink-50 shadow-[0_4px_20px_rgb(0,0,0,0.02)] overflow-hidden">
                                <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-[#FFF5F7] text-[#373A4D] font-extrabold uppercase text-[11px] border-b border-pink-100">
                                        <tr>
                                            <th className="py-4 px-6 w-16">ID</th>
                                            <th className="py-4 px-6">Từ tiếng Hàn</th>
                                            <th className="py-4 px-6">Nghĩa tiếng Việt</th>
                                            <th className="py-4 px-6 text-center w-28">Nghe thử (TTS)</th>
                                            <th className="py-4 px-6 text-center w-20">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pink-50">
                                        {vocabularies.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-8 text-center text-gray-400 font-medium">
                                                    Bài học chưa có từ vựng. Hãy bấm "Import Excel / JSON" để nạp nhanh!
                                                </td>
                                            </tr>
                                        ) : (
                                            vocabularies.map((v) => (
                                                <tr key={v.id} className="hover:bg-[#FFFDFE] transition">
                                                    <td className="py-4 px-6 font-bold text-gray-400">#{v.id}</td>
                                                    <td className="py-4 px-6 font-extrabold text-[#373A4D] text-sm">{v.wordKr}</td>
                                                    <td className="py-4 px-6 font-medium text-gray-600">{v.meaningVn}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            onClick={() => speakKorean(v.wordKr)}
                                                            className="p-2 text-[#F06292] bg-pink-50 hover:bg-pink-100 rounded-xl transition"
                                                        >
                                                            <Volume2 size={16} />
                                                        </button>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            onClick={() => handleDeleteVocab(v.id)}
                                                            className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                                                        >
                                                            <Trash2 size={15} />
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

                    {/* TAB NGỮ PHÁP */}
                    {activeTab === 'grammar' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <p className="text-xs text-gray-500 font-medium">
                                    Cấu trúc ngữ pháp, hướng dẫn cách sử dụng và câu ví dụ minh họa.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            setParsedGrammarList([]);
                                            setBatchGrammarText('');
                                            setShowBatchGrammarModal(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <FileSpreadsheet size={15} /> Import Excel / JSON
                                    </button>
                                    <button
                                        onClick={() => setShowAddGrammarModal(true)}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <Plus size={15} /> Thêm ngữ pháp
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {grammars.map((g) => (
                                    <div key={g.id} className="bg-white rounded-3xl border border-pink-100 p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                                        <div className="flex items-start justify-between">
                                            <span className="px-3 py-1 bg-pink-50 text-[#F06292] font-extrabold text-xs rounded-xl border border-pink-100">
                                                {g.structure}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteGrammar(g.id)}
                                                className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            <div>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Cách dùng:</span>
                                                <p className="text-xs text-gray-700 mt-0.5">{g.usageDesc || '—'}</p>
                                            </div>
                                            {(g.exampleKr || g.exampleVn) && (
                                                <div className="p-3 bg-[#FFF9FA] rounded-2xl border border-pink-50 text-xs">
                                                    <span className="text-[10px] font-bold text-[#F06292] uppercase">Ví dụ:</span>
                                                    {g.exampleKr && <p className="font-bold text-[#373A4D] mt-1">{g.exampleKr}</p>}
                                                    {g.exampleVn && <p className="text-gray-500 text-[11px] mt-0.5">{g.exampleVn}</p>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL IMPORT TỪ VỰNG (EXCEL / JSON / DÁN TEXT) */}
            {/* ========================================================================= */}
            {showBatchVocabModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-[#373A4D]">Import từ vựng (Excel / JSON)</h3>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                    Tải tệp tin lên hoặc dán trực tiếp danh sách từ vào ô bên dưới.
                                </p>
                            </div>
                            <button onClick={() => setShowBatchVocabModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Nút thao tác tải file & download mẫu */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={vocabFileInputRef}
                                    onChange={handleVocabFileUpload}
                                    accept=".xlsx, .xls, .csv, .json"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => vocabFileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-xl shadow-sm transition"
                                >
                                    <Upload size={14} /> Chọn tệp Excel / JSON
                                </button>
                                <span className="text-[11px] text-gray-400 font-medium">Hỗ trợ .xlsx, .csv, .json</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={downloadVocabExcelTemplate}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition"
                                >
                                    <Download size={13} /> Mẫu Excel
                                </button>
                                <button
                                    onClick={downloadVocabJsonTemplate}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition"
                                >
                                    <FileCode size={13} /> Mẫu JSON
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-600 mb-1">Hoặc dán văn bản trực tiếp:</label>
                                <textarea
                                    rows="10"
                                    value={batchVocabText}
                                    onChange={(e) => handleParseVocabText(e.target.value)}
                                    placeholder={`Dán theo dạng:
사과 - Quả táo
바나나 - Quả chuối`}
                                    className="w-full flex-1 p-3 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs font-mono focus:outline-none focus:border-[#F06292] resize-none"
                                />
                            </div>

                            <div className="flex flex-col overflow-hidden">
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold text-gray-600">Xem trước ({parsedVocabList.length} từ nhận diện được):</label>
                                </div>
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 overflow-y-auto space-y-2 text-xs">
                                    {parsedVocabList.length === 0 ? (
                                        <p className="text-gray-400 text-center py-10">Chưa có dữ liệu nào được nạp</p>
                                    ) : (
                                        parsedVocabList.map((item, idx) => (
                                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <span className="font-extrabold text-[#373A4D]">{item.wordKr}</span>
                                                    <span className="text-gray-400 mx-2">:</span>
                                                    <span className="text-gray-600 font-medium">{item.meaningVn}</span>
                                                </div>
                                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Sẵn sàng</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                            <button
                                type="button"
                                onClick={() => setShowBatchVocabModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={parsedVocabList.length === 0}
                                onClick={handleSaveBatchVocab}
                                className="px-5 py-2 bg-[#F06292] hover:bg-[#e05584] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                                <Save size={14} /> Lưu tất cả {parsedVocabList.length} từ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: IMPORT NGỮ PHÁP (EXCEL / JSON / DÁN TEXT) */}
            {/* ========================================================================= */}
            {showBatchGrammarModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-extrabold text-[#373A4D]">Import ngữ pháp (Excel / JSON)</h3>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">
                                    Tải file `.xlsx`, `.json` hoặc dán trực tiếp đoạn mã JSON / văn bản vào ô dưới.
                                </p>
                            </div>
                            <button onClick={() => setShowBatchGrammarModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Thanh công cụ: Chọn file & Tải mẫu */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    ref={grammarFileInputRef}
                                    onChange={handleGrammarFileUpload}
                                    accept=".xlsx, .xls, .csv, .json"
                                    className="hidden"
                                />
                                <button
                                    onClick={() => grammarFileInputRef.current?.click()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-xl shadow-sm transition"
                                >
                                    <Upload size={14} /> Chọn tệp Excel / JSON
                                </button>
                                <span className="text-[11px] text-gray-400 font-medium">Hỗ trợ .xlsx, .csv, .json</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={downloadGrammarExcelTemplate}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold transition"
                                >
                                    <Download size={13} /> Mẫu Excel 4 cột
                                </button>
                                <button
                                    onClick={downloadGrammarJsonTemplate}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition"
                                >
                                    <FileCode size={13} /> Mẫu JSON
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
                            <div className="flex flex-col">
                                <label className="text-xs font-bold text-gray-600 mb-1">
                                    Dán chuỗi JSON hoặc dòng `Cấu trúc | Cách dùng | Ví dụ | Dịch`:
                                </label>
                                <textarea
                                    rows="10"
                                    value={batchGrammarText}
                                    onChange={(e) => handleParseGrammarText(e.target.value)}
                                    placeholder={`Cách 1 - Dán mảng JSON:
[
  {
    "structure": "N + 은/는",
    "usageDesc": "Trợ từ chủ đề",
    "exampleKr": "저는 학생입니다",
    "exampleVn": "Tôi là học sinh"
  }
]

Cách 2 - Dán dạng dòng:
N + 이/가 | Trợ từ chủ ngữ | 비가 와요 | Trời mưa`}
                                    className="w-full flex-1 p-3 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs font-mono focus:outline-none focus:border-[#F06292] resize-none"
                                />
                            </div>

                            <div className="flex flex-col overflow-hidden">
                                <label className="text-xs font-bold text-gray-600 mb-1">
                                    Xem trước ({parsedGrammarList.length} cấu trúc nhận diện được):
                                </label>
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 overflow-y-auto space-y-2 text-xs">
                                    {parsedGrammarList.length === 0 ? (
                                        <p className="text-gray-400 text-center py-10">Chưa có dữ liệu nào</p>
                                    ) : (
                                        parsedGrammarList.map((item, idx) => (
                                            <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-extrabold text-[#F06292] bg-pink-50 px-2 py-0.5 rounded-md text-xs">
                                                        {item.structure}
                                                    </span>
                                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                                                        Hợp lệ
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-[11px] line-clamp-2">
                                                    {item.usageDesc || 'Chưa có mô tả'}
                                                </p>
                                                {(item.exampleKr || item.exampleVn) && (
                                                    <div className="text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                                                        <span className="font-bold text-[#373A4D]">{item.exampleKr}</span>
                                                        {item.exampleVn && <span className="block text-gray-400">→ {item.exampleVn}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                            <button
                                type="button"
                                onClick={() => setShowBatchGrammarModal(false)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={parsedGrammarList.length === 0}
                                onClick={handleSaveBatchGrammar}
                                className="px-5 py-2 bg-[#F06292] hover:bg-[#e05584] disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                            >
                                <Save size={14} /> Lưu tất cả {parsedGrammarList.length} ngữ pháp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CÁC MODAL THÊM LẺ (GIỮ NGUYÊN) */}
            {showEditCourseModal && editingCourse && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl space-y-4">
                        <h3 className="text-base font-extrabold text-[#373A4D]">Thiết lập khóa học</h3>
                        <form onSubmit={handleUpdateCourse} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Tên khóa học:</label>
                                <input
                                    type="text"
                                    value={editingCourse.name}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none"
                                    required
                                />
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                                <input
                                    type="checkbox"
                                    id="isFreeCheckbox"
                                    checked={editingCourse.isFree}
                                    onChange={(e) => setEditingCourse({ ...editingCourse, isFree: e.target.checked, price: e.target.checked ? 0 : editingCourse.price })}
                                    className="w-4 h-4 text-[#F06292]"
                                />
                                <label htmlFor="isFreeCheckbox">Khóa học miễn phí (Không cần thanh toán)</label>
                            </div>
                            {!editingCourse.isFree && (
                                <div>
                                    <label className="block mb-1">Giá bán niêm yết (VNĐ):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={editingCourse.price}
                                        onChange={(e) => setEditingCourse({ ...editingCourse, price: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none"
                                        required
                                    />
                                </div>
                            )}
                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowEditCourseModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddLessonModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
                        <h3 className="text-base font-extrabold text-[#373A4D]">Thêm bài học mới</h3>
                        <form onSubmit={handleAddLesson} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Số thứ tự:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newLessonOrder}
                                    onChange={(e) => setNewLessonOrder(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Tên bài học:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Bài 4: Ngày & Giờ"
                                    value={newLessonTitle}
                                    onChange={(e) => setNewLessonTitle(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddLessonModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl">Tạo bài học</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddVocabModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
                        <h3 className="text-base font-extrabold text-[#373A4D]">Thêm lẻ từ vựng</h3>
                        <form onSubmit={handleAddVocabulary} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Từ tiếng Hàn:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: 사과"
                                    value={newWordKr}
                                    onChange={(e) => setNewWordKr(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Nghĩa tiếng Việt:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Quả táo"
                                    value={newMeaningVn}
                                    onChange={(e) => setNewMeaningVn(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddVocabModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl">Thêm từ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAddGrammarModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl space-y-4">
                        <h3 className="text-base font-extrabold text-[#373A4D]">Thêm lẻ ngữ pháp</h3>
                        <form onSubmit={handleAddGrammar} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Cấu trúc:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: V/A + -아요/어요"
                                    value={newStructure}
                                    onChange={(e) => setNewStructure(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Cách dùng:</label>
                                <textarea
                                    rows="2"
                                    value={newUsageDesc}
                                    onChange={(e) => setNewUsageDesc(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Ví dụ tiếng Hàn:</label>
                                <input
                                    type="text"
                                    value={newExampleKr}
                                    onChange={(e) => setNewExampleKr(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Dịch nghĩa ví dụ:</label>
                                <input
                                    type="text"
                                    value={newExampleVn}
                                    onChange={(e) => setNewExampleVn(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowAddGrammarModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl">Thêm ngữ pháp</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;