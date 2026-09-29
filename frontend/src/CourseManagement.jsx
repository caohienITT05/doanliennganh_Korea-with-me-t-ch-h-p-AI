import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen, Plus, Trash2, Edit3, Volume2, ArrowLeft,
    Layers, BookMarked, Save, X, FileSpreadsheet, Download, Upload, FileCode, CheckCircle, EyeOff
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
    const [message, setMessage] = useState({ text: '', type: '' });

    // 1. Course Modal State
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [isEditingCourse, setIsEditingCourse] = useState(false);
    const [courseFormData, setCourseFormData] = useState({
        id: null,
        name: '',
        description: '',
        thumbnailUrl: '',
        price: 0,
        isFree: true,
        status: 'OPEN'
    });

    // 2. Lesson Modal State
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [isEditingLesson, setIsEditingLesson] = useState(false);
    const [lessonFormData, setLessonFormData] = useState({
        id: null,
        title: '',
        orderIndex: 1
    });

    // 3. Vocab Modal State (Thêm & Sửa)
    const [showVocabModal, setShowVocabModal] = useState(false);
    const [isEditingVocab, setIsEditingVocab] = useState(false);
    const [vocabFormData, setVocabFormData] = useState({
        id: null,
        wordKr: '',
        meaningVn: ''
    });

    // 4. Grammar Modal State (Thêm & Sửa)
    const [showGrammarModal, setShowGrammarModal] = useState(false);
    const [isEditingGrammar, setIsEditingGrammar] = useState(false);
    const [grammarFormData, setGrammarFormData] = useState({
        id: null,
        structure: '',
        usageDesc: '',
        exampleKr: '',
        exampleVn: ''
    });

    // 5. Bulk Import State
    const [showBatchVocabModal, setShowBatchVocabModal] = useState(false);
    const [batchVocabText, setBatchVocabText] = useState('');
    const [parsedVocabList, setParsedVocabList] = useState([]);
    const vocabFileInputRef = useRef(null);

    const [showBatchGrammarModal, setShowBatchGrammarModal] = useState(false);
    const [batchGrammarText, setBatchGrammarText] = useState('');
    const [parsedGrammarList, setParsedGrammarList] = useState([]);
    const grammarFileInputRef = useRef(null);

    // ================= FETCH DATA =================
    const fetchCourses = async () => {
        try {
            const res = await axios.get('/api/admin/courses');
            setCourses(res.data);
        } catch {
            setMessage({ text: 'Không thể tải danh sách khóa học!', type: 'error' });
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchLessons = async (courseId) => {
        try {
            const res = await axios.get(`/api/admin/lessons?courseId=${courseId}`);
            setLessons(res.data);
        } catch {
            setMessage({ text: 'Không thể tải danh sách bài học!', type: 'error' });
        }
    };

    const handleSelectCourse = (course) => {
        setSelectedCourse(course);
        setSelectedLesson(null);
        fetchLessons(course.id);
    };

    const fetchLessonDetails = async (lessonId) => {
        try {
            const [vocabRes, grammarRes] = await Promise.all([
                axios.get(`/api/admin/vocabularies?lessonId=${lessonId}`),
                axios.get(`/api/admin/grammars?lessonId=${lessonId}`)
            ]);
            setVocabularies(vocabRes.data);
            setGrammars(grammarRes.data);
        } catch {
            setMessage({ text: 'Không thể tải nội dung bài học!', type: 'error' });
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

    // ================= QUẢN LÝ KHÓA HỌC =================
    const handleOpenCreateCourse = () => {
        setIsEditingCourse(false);
        setCourseFormData({ id: null, name: '', description: '', thumbnailUrl: '', price: 0, isFree: true, status: 'OPEN' });
        setShowCourseModal(true);
    };

    const handleOpenEditCourse = (course) => {
        setIsEditingCourse(true);
        setCourseFormData({
            id: course.id,
            name: course.name,
            description: course.description || '',
            thumbnailUrl: course.thumbnailUrl || '',
            price: course.price || 0,
            isFree: course.isFree ?? false,
            status: course.status || 'OPEN'
        });
        setShowCourseModal(true);
    };

    const handleSaveCourse = async (e) => {
        e.preventDefault();
        try {
            if (isEditingCourse) {
                const res = await axios.put(`/api/admin/courses/${courseFormData.id}`, courseFormData);
                setCourses(courses.map(c => c.id === res.data.id ? res.data : c));
                if (selectedCourse?.id === res.data.id) setSelectedCourse(res.data);
                setMessage({ text: 'Cập nhật khóa học thành công!', type: 'success' });
            } else {
                const res = await axios.post('/api/admin/courses', courseFormData);
                setCourses([...courses, res.data]);
                setMessage({ text: 'Tạo khóa học mới thành công!', type: 'success' });
            }
            setShowCourseModal(false);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Thao tác thất bại!', type: 'error' });
        }
    };

    const handleDeleteCourse = async (courseId, courseName) => {
        if (!window.confirm(`Xóa khóa học "${courseName}" sẽ xóa toàn bộ bài học, từ vựng và ngữ pháp bên trong!`)) return;
        try {
            await axios.delete(`/api/admin/courses/${courseId}`);
            setCourses(courses.filter(c => c.id !== courseId));
            if (selectedCourse?.id === courseId) setSelectedCourse(null);
            setMessage({ text: 'Đã xóa khóa học!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Xóa thất bại!', type: 'error' });
        }
    };

    // ================= QUẢN LÝ BÀI HỌC =================
    const handleOpenCreateLesson = () => {
        setIsEditingLesson(false);
        const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.orderIndex || 0)) + 1 : 1;
        setLessonFormData({ id: null, title: '', orderIndex: nextOrder });
        setShowLessonModal(true);
    };

    const handleOpenEditLesson = (lesson) => {
        setIsEditingLesson(true);
        setLessonFormData({ id: lesson.id, title: lesson.title, orderIndex: lesson.orderIndex });
        setShowLessonModal(true);
    };

    const handleSaveLesson = async (e) => {
        e.preventDefault();
        try {
            if (isEditingLesson) {
                const res = await axios.put(`/api/admin/lessons/${lessonFormData.id}`, {
                    courseId: selectedCourse.id,
                    title: lessonFormData.title,
                    orderIndex: Number(lessonFormData.orderIndex)
                });
                setLessons(lessons.map(l => l.id === res.data.id ? res.data : l));
                if (selectedLesson?.id === res.data.id) setSelectedLesson(res.data);
                setMessage({ text: 'Cập nhật bài học thành công!', type: 'success' });
            } else {
                const res = await axios.post('/api/admin/lessons', {
                    courseId: selectedCourse.id,
                    title: lessonFormData.title,
                    orderIndex: Number(lessonFormData.orderIndex)
                });
                setLessons([...lessons, res.data]);
                setMessage({ text: 'Tạo bài học thành công!', type: 'success' });
            }
            setShowLessonModal(false);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Thao tác bài học thất bại!', type: 'error' });
        }
    };

    const handleDeleteLesson = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa bài học này?')) return;
        try {
            await axios.delete(`/api/admin/lessons/${id}`);
            setLessons(lessons.filter(l => l.id !== id));
            setMessage({ text: 'Đã xóa bài học thành công!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Xóa bài học thất bại!', type: 'error' });
        }
    };

    // ================= QUẢN LÝ TỪ VỰNG =================
    const handleOpenCreateVocab = () => {
        setIsEditingVocab(false);
        setVocabFormData({ id: null, wordKr: '', meaningVn: '' });
        setShowVocabModal(true);
    };

    const handleOpenEditVocab = (v) => {
        setIsEditingVocab(true);
        setVocabFormData({ id: v.id, wordKr: v.wordKr, meaningVn: v.meaningVn });
        setShowVocabModal(true);
    };

    const handleSaveVocab = async (e) => {
        e.preventDefault();
        try {
            if (isEditingVocab) {
                const res = await axios.put(`/api/admin/vocabularies/${vocabFormData.id}`, {
                    lessonId: selectedLesson.id,
                    wordKr: vocabFormData.wordKr,
                    meaningVn: vocabFormData.meaningVn
                });
                setVocabularies(vocabularies.map(v => v.id === res.data.id ? res.data : v));
                setMessage({ text: 'Đã cập nhật từ vựng!', type: 'success' });
            } else {
                const res = await axios.post('/api/admin/vocabularies', {
                    lessonId: selectedLesson.id,
                    wordKr: vocabFormData.wordKr,
                    meaningVn: vocabFormData.meaningVn
                });
                setVocabularies([...vocabularies, res.data]);
                setMessage({ text: 'Đã thêm từ vựng mới!', type: 'success' });
            }
            setShowVocabModal(false);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Thao tác từ vựng thất bại!', type: 'error' });
        }
    };

    const handleDeleteVocab = async (id) => {
        if (!window.confirm('Xóa từ vựng này?')) return;
        try {
            await axios.delete(`/api/admin/vocabularies/${id}`);
            setVocabularies(vocabularies.filter(v => v.id !== id));
            setMessage({ text: 'Đã xóa từ vựng!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Xóa thất bại!', type: 'error' });
        }
    };

    // ================= QUẢN LÝ NGỮ PHÁP =================
    const handleOpenCreateGrammar = () => {
        setIsEditingGrammar(false);
        setGrammarFormData({ id: null, structure: '', usageDesc: '', exampleKr: '', exampleVn: '' });
        setShowGrammarModal(true);
    };

    const handleOpenEditGrammar = (g) => {
        setIsEditingGrammar(true);
        setGrammarFormData({
            id: g.id,
            structure: g.structure,
            usageDesc: g.usageDesc || '',
            exampleKr: g.exampleKr || '',
            exampleVn: g.exampleVn || ''
        });
        setShowGrammarModal(true);
    };

    const handleSaveGrammar = async (e) => {
        e.preventDefault();
        try {
            if (isEditingGrammar) {
                const res = await axios.put(`/api/admin/grammars/${grammarFormData.id}`, {
                    lessonId: selectedLesson.id,
                    ...grammarFormData
                });
                setGrammars(grammars.map(g => g.id === res.data.id ? res.data : g));
                setMessage({ text: 'Đã cập nhật cấu trúc ngữ pháp!', type: 'success' });
            } else {
                const res = await axios.post('/api/admin/grammars', {
                    lessonId: selectedLesson.id,
                    ...grammarFormData
                });
                setGrammars([...grammars, res.data]);
                setMessage({ text: 'Đã thêm ngữ pháp mới!', type: 'success' });
            }
            setShowGrammarModal(false);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Thao tác ngữ pháp thất bại!', type: 'error' });
        }
    };

    const handleDeleteGrammar = async (id) => {
        if (!window.confirm('Xóa cấu trúc ngữ pháp này?')) return;
        try {
            await axios.delete(`/api/admin/grammars/${id}`);
            setGrammars(grammars.filter(g => g.id !== id));
            setMessage({ text: 'Đã xóa ngữ pháp!', type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Xóa thất bại!', type: 'error' });
        }
    };

    // ================= IMPORT HÀNG LOẠT =================
    const handleVocabFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    const array = Array.isArray(json) ? json : [json];
                    const result = array.map(item => ({
                        lessonId: selectedLesson.id,
                        wordKr: item.wordKr || item.word || item['Từ tiếng Hàn'] || '',
                        meaningVn: item.meaningVn || item.meaning || item['Nghĩa tiếng Việt'] || '',
                        audioUrl: null
                    })).filter(item => item.wordKr && item.meaningVn);
                    setParsedVocabList(result);
                } catch {
                    alert('File JSON không hợp lệ!');
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
        const ws = XLSX.utils.aoa_to_sheet([['Từ tiếng Hàn', 'Nghĩa tiếng Việt'], ['사과', 'Quả táo'], ['학교', 'Trường học']]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'TuVung');
        XLSX.writeFile(wb, 'Mau_Import_Tu_Vung.xlsx');
    };

    const downloadVocabJsonTemplate = () => {
        const data = [{ wordKr: "사과", meaningVn: "Quả táo" }, { wordKr: "학교", meaningVn: "Trường học" }];
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
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Lỗi lưu danh sách từ vựng!', type: 'error' });
        }
    };

    const handleGrammarFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    const array = Array.isArray(json) ? json : [json];
                    const result = array.map(item => ({
                        lessonId: selectedLesson.id,
                        structure: item.structure || item['Cấu trúc'] || '',
                        usageDesc: item.usageDesc || item['Cách dùng'] || '',
                        exampleKr: item.exampleKr || item['Ví dụ tiếng Hàn'] || '',
                        exampleVn: item.exampleVn || item['Nghĩa ví dụ'] || ''
                    })).filter(item => item.structure);
                    setParsedGrammarList(result);
                } catch {
                    alert('File JSON không hợp lệ!');
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
        if (clean.startsWith('[') || clean.startsWith('{')) {
            try {
                const parsed = JSON.parse(clean);
                const array = Array.isArray(parsed) ? parsed : [parsed];
                const result = array.map(item => ({
                    lessonId: selectedLesson.id,
                    structure: item.structure || item['Cấu trúc'] || '',
                    usageDesc: item.usageDesc || item['Cách dùng'] || '',
                    exampleKr: item.exampleKr || item['Ví dụ tiếng Hàn'] || '',
                    exampleVn: item.exampleVn || item['Nghĩa ví dụ'] || ''
                })).filter(item => item.structure);
                setParsedGrammarList(result);
                return;
            } catch { }
        }
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
        const ws = XLSX.utils.aoa_to_sheet([['Cấu trúc', 'Cách dùng', 'Ví dụ tiếng Hàn', 'Nghĩa ví dụ'], ['N + 은/는', 'Trợ từ chủ đề', '저는 학생입니다', 'Tôi là học sinh']]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'NguPhap');
        XLSX.writeFile(wb, 'Mau_Import_Ngu_Phap.xlsx');
    };

    const downloadGrammarJsonTemplate = () => {
        const data = [{ structure: "N + 은/는", usageDesc: "Trợ từ chủ đề", exampleKr: "저는 학생입니다.", exampleVn: "Tôi là học sinh." }];
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
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Lỗi lưu ngữ pháp hàng loạt!', type: 'error' });
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
                <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })}>✕</button>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TẦNG 1: DANH SÁCH KHÓA HỌC (HIỂN THỊ CẢ TRẠNG THÁI OPEN/CLOSED) */}
            {/* ========================================================================= */}
            {!selectedCourse && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#373A4D]">Khóa học & Giáo trình</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1">
                                Tạo khóa học mới, thiết lập ảnh bìa, giá bán niêm yết và trạng thái Đóng/Mở.
                            </p>
                        </div>
                        <button
                            onClick={handleOpenCreateCourse}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm self-start"
                        >
                            <Plus size={16} /> Thêm khóa học mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {courses.length === 0 ? (
                            <div className="col-span-2 py-16 text-center bg-white rounded-3xl border border-dashed border-pink-200 p-8">
                                <BookOpen className="w-12 h-12 text-pink-300 mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-gray-700">Chưa có khóa học nào</h3>
                                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                    Hãy nhấn nút "+ Thêm khóa học mới" để bắt đầu thiết lập lộ trình học.
                                </p>
                            </div>
                        ) : (
                            courses.map((c) => (
                                <div key={c.id} className="bg-white rounded-3xl border border-pink-100 p-5 shadow-sm hover:border-pink-300 transition flex flex-col justify-between">
                                    <div className="flex gap-4 items-start">
                                        <div className="w-24 h-32 rounded-2xl overflow-hidden bg-pink-50 border border-pink-100 shrink-0 shadow-sm relative">
                                            {c.thumbnailUrl ? (
                                                <img src={c.thumbnailUrl} alt={c.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&q=80'; }} />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-[#F06292] p-2 text-center">
                                                    <BookOpen size={24} />
                                                    <span className="text-[9px] font-bold mt-1 text-gray-400">Chưa có bìa</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${c.isFree ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-pink-50 text-[#F06292] border border-pink-200'
                                                        }`}>
                                                        {c.isFree ? 'MIỄN PHÍ' : 'TÍNH PHÍ'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1 ${c.status === 'OPEN' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                        }`}>
                                                        {c.status === 'OPEN' ? <><CheckCircle size={10} /> ĐANG MỞ</> : <><EyeOff size={10} /> TẠM ĐÓNG</>}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleOpenEditCourse(c)} className="p-1.5 text-gray-400 hover:text-[#F06292] rounded-xl hover:bg-pink-50 transition" title="Sửa">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => handleDeleteCourse(c.id, c.name)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition" title="Xóa">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-base font-extrabold text-[#373A4D] mt-2 line-clamp-1">{c.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{c.description || 'Chưa có mô tả.'}</p>

                                            <div className="mt-3">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Giá bán:</span>
                                                <p className="text-sm font-extrabold text-[#F06292]">
                                                    {c.isFree ? '0 VNĐ' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c.price)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectCourse(c)}
                                        className="w-full mt-5 py-2.5 bg-[#FFF5F7] hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-2xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Layers size={14} /> Quản lý danh sách bài học
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TẦNG 2: BÀI HỌC (THÊM / SỬA / XÓA) */}
            {/* ========================================================================= */}
            {selectedCourse && !selectedLesson && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#373A4D]">{selectedCourse.name}</h2>
                            <p className="text-xs text-gray-500 font-medium mt-1">Danh sách bài học trong khóa.</p>
                        </div>
                        <button
                            onClick={handleOpenCreateLesson}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm self-start"
                        >
                            <Plus size={16} /> Thêm bài học mới
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs text-gray-600">
                            <thead className="bg-[#FFF5F7] text-[#373A4D] font-extrabold uppercase text-[11px] border-b border-pink-100">
                                <tr>
                                    <th className="py-4 px-6 w-20">Thứ tự</th>
                                    <th className="py-4 px-6">Tên bài học</th>
                                    <th className="py-4 px-6 text-center w-48">Nội dung</th>
                                    <th className="py-4 px-6 text-center w-28">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pink-50">
                                {lessons.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-400 font-medium">Chưa có bài học nào.</td>
                                    </tr>
                                ) : (
                                    lessons.map((lesson) => (
                                        <tr key={lesson.id} className="hover:bg-[#FFFDFE] transition">
                                            <td className="py-4 px-6 font-bold text-gray-400">#{lesson.orderIndex}</td>
                                            <td className="py-4 px-6 font-bold text-[#373A4D] text-sm">{lesson.title}</td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    onClick={() => handleSelectLesson(lesson)}
                                                    className="px-3.5 py-1.5 bg-pink-50 text-[#F06292] border border-pink-200 rounded-xl hover:bg-[#F06292] hover:text-white transition font-bold text-xs inline-flex items-center gap-1.5"
                                                >
                                                    <BookMarked size={14} /> Soạn nội dung
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="inline-flex items-center gap-1">
                                                    <button onClick={() => handleOpenEditLesson(lesson)} className="p-2 text-gray-400 hover:text-[#F06292] rounded-xl hover:bg-pink-50 transition" title="Sửa bài học">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition" title="Xóa bài học">
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
            {/* TẦNG 3: TỪ VỰNG & NGỮ PHÁP (CÓ NÚT SỬA NHANH & XÓA) */}
            {/* ========================================================================= */}
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
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'vocab' ? 'bg-white text-[#F06292] shadow-sm' : 'text-gray-500'}`}
                            >
                                Từ vựng ({vocabularies.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('grammar')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'grammar' ? 'bg-white text-[#F06292] shadow-sm' : 'text-gray-500'}`}
                            >
                                Ngữ pháp ({grammars.length})
                            </button>
                        </div>
                    </div>

                    {/* TAB TỪ VỰNG */}
                    {activeTab === 'vocab' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <p className="text-xs text-gray-500 font-medium">Quản lý từ vựng của bài học.</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setParsedVocabList([]); setBatchVocabText(''); setShowBatchVocabModal(true); }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <FileSpreadsheet size={15} /> Import Excel / JSON
                                    </button>
                                    <button
                                        onClick={handleOpenCreateVocab}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <Plus size={15} /> Thêm lẻ từng từ
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-pink-50 shadow-sm overflow-hidden">
                                <table className="w-full text-left text-xs text-gray-600">
                                    <thead className="bg-[#FFF5F7] text-[#373A4D] font-extrabold uppercase text-[11px] border-b border-pink-100">
                                        <tr>
                                            <th className="py-4 px-6 w-16">ID</th>
                                            <th className="py-4 px-6">Từ tiếng Hàn</th>
                                            <th className="py-4 px-6">Nghĩa tiếng Việt</th>
                                            <th className="py-4 px-6 text-center w-28">Nghe (TTS)</th>
                                            <th className="py-4 px-6 text-center w-28">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-pink-50">
                                        {vocabularies.length === 0 ? (
                                            <tr><td colSpan="5" className="py-8 text-center text-gray-400 font-medium">Chưa có từ vựng nào.</td></tr>
                                        ) : (
                                            vocabularies.map((v) => (
                                                <tr key={v.id} className="hover:bg-[#FFFDFE] transition">
                                                    <td className="py-4 px-6 font-bold text-gray-400">#{v.id}</td>
                                                    <td className="py-4 px-6 font-extrabold text-[#373A4D] text-sm">{v.wordKr}</td>
                                                    <td className="py-4 px-6 font-medium text-gray-600">{v.meaningVn}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button onClick={() => speakKorean(v.wordKr)} className="p-2 text-[#F06292] bg-pink-50 hover:bg-pink-100 rounded-xl transition" title="Nghe phát âm">
                                                            <Volume2 size={16} />
                                                        </button>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <div className="inline-flex items-center gap-1">
                                                            <button onClick={() => handleOpenEditVocab(v)} className="p-2 text-gray-400 hover:text-[#F06292] rounded-xl hover:bg-pink-50 transition" title="Sửa từ vựng">
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button onClick={() => handleDeleteVocab(v.id)} className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition" title="Xóa">
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

                    {/* TAB NGỮ PHÁP */}
                    {activeTab === 'grammar' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <p className="text-xs text-gray-500 font-medium">Quản lý các cấu trúc ngữ pháp.</p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setParsedGrammarList([]); setBatchGrammarText(''); setShowBatchGrammarModal(true); }}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <FileSpreadsheet size={15} /> Import Excel / JSON
                                    </button>
                                    <button
                                        onClick={handleOpenCreateGrammar}
                                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-bold rounded-2xl transition shadow-sm"
                                    >
                                        <Plus size={15} /> Thêm ngữ pháp
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {grammars.length === 0 ? (
                                    <div className="col-span-2 py-10 text-center bg-white rounded-3xl border border-pink-50 text-gray-400 text-xs font-medium">
                                        Chưa có cấu trúc ngữ pháp nào.
                                    </div>
                                ) : (
                                    grammars.map((g) => (
                                        <div key={g.id} className="bg-white rounded-3xl border border-pink-100 p-5 shadow-sm relative">
                                            <div className="flex items-start justify-between">
                                                <span className="px-3 py-1 bg-pink-50 text-[#F06292] font-extrabold text-xs rounded-xl border border-pink-100">{g.structure}</span>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleOpenEditGrammar(g)} className="p-1.5 text-gray-400 hover:text-[#F06292] rounded-lg hover:bg-pink-50 transition" title="Sửa ngữ pháp">
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteGrammar(g.id)} className="p-1.5 text-gray-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition" title="Xóa">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Cách dùng:</span>
                                                    <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{g.usageDesc || '—'}</p>
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
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 1: TẠO / SỬA KHÓA HỌC (CÓ TRẠNG THÁI STATUS) */}
            {/* ========================================================================= */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-[#373A4D]">{isEditingCourse ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}</h3>
                            <button onClick={() => setShowCourseModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveCourse} className="space-y-4 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Tên khóa học / Giáo trình:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Tiếng Hàn Sơ Cấp 1"
                                    value={courseFormData.name}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-1">Trạng thái khóa học:</label>
                                <select
                                    value={courseFormData.status}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, status: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292] font-bold text-gray-700"
                                >
                                    <option value="OPEN">Đang mở (Công khai cho học viên)</option>
                                    <option value="CLOSED">Tạm đóng (Bản nháp / Đang cập nhật nội dung)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block mb-1">Đường dẫn ảnh bìa sách (Thumbnail URL):</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/bia-sach.jpg"
                                    value={courseFormData.thumbnailUrl}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, thumbnailUrl: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                />
                                {courseFormData.thumbnailUrl && (
                                    <div className="mt-2 flex items-center gap-3 p-2 bg-pink-50/50 rounded-xl border border-pink-100">
                                        <img src={courseFormData.thumbnailUrl} alt="Preview" className="w-10 h-14 object-cover rounded-lg shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
                                        <span className="text-[11px] text-gray-500 font-medium">Xem trước ảnh bìa giáo trình</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block mb-1">Mô tả tóm tắt:</label>
                                <textarea
                                    rows="3"
                                    placeholder="Lộ trình kiến thức..."
                                    value={courseFormData.description}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                                <input
                                    type="checkbox"
                                    id="isFreeCourseCheckbox"
                                    checked={courseFormData.isFree}
                                    onChange={(e) => setCourseFormData({ ...courseFormData, isFree: e.target.checked, price: e.target.checked ? 0 : courseFormData.price })}
                                    className="w-4 h-4 text-[#F06292] rounded cursor-pointer"
                                />
                                <label htmlFor="isFreeCourseCheckbox" className="cursor-pointer text-[#373A4D]">Khóa học miễn phí (Không cần thanh toán)</label>
                            </div>

                            {!courseFormData.isFree && (
                                <div>
                                    <label className="block mb-1">Giá bán niêm yết (VNĐ):</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={courseFormData.price}
                                        onChange={(e) => setCourseFormData({ ...courseFormData, price: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                        required
                                    />
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                                <button type="button" onClick={() => setShowCourseModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold">Hủy</button>
                                <button type="submit" className="px-5 py-2 bg-[#F06292] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm"><Save size={14} /> Lưu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 2: TẠO / SỬA BÀI HỌC */}
            {/* ========================================================================= */}
            {showLessonModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-[#373A4D]">{isEditingLesson ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}</h3>
                            <button onClick={() => setShowLessonModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveLesson} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Số thứ tự bài:</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={lessonFormData.orderIndex}
                                    onChange={(e) => setLessonFormData({ ...lessonFormData, orderIndex: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Tên bài học:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Bài 1: Giới thiệu bản thân (소개)"
                                    value={lessonFormData.title}
                                    onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                                <button type="button" onClick={() => setShowLessonModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl font-bold">
                                    {isEditingLesson ? 'Lưu thay đổi' : 'Tạo bài học'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 3: TẠO / SỬA TỪ VỰNG */}
            {/* ========================================================================= */}
            {showVocabModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-[#373A4D]">{isEditingVocab ? 'Chỉnh sửa từ vựng' : 'Thêm từ vựng mới'}</h3>
                            <button onClick={() => setShowVocabModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveVocab} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Từ tiếng Hàn:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: 사과"
                                    value={vocabFormData.wordKr}
                                    onChange={(e) => setVocabFormData({ ...vocabFormData, wordKr: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Nghĩa tiếng Việt:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Quả táo"
                                    value={vocabFormData.meaningVn}
                                    onChange={(e) => setVocabFormData({ ...vocabFormData, meaningVn: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                                <button type="button" onClick={() => setShowVocabModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl font-bold">
                                    {isEditingVocab ? 'Lưu thay đổi' : 'Thêm từ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL 4: TẠO / SỬA NGỮ PHÁP */}
            {/* ========================================================================= */}
            {showGrammarModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-[#373A4D]">{isEditingGrammar ? 'Chỉnh sửa ngữ pháp' : 'Thêm ngữ pháp mới'}</h3>
                            <button onClick={() => setShowGrammarModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSaveGrammar} className="space-y-3 text-xs font-bold text-gray-600">
                            <div>
                                <label className="block mb-1">Cấu trúc ngữ pháp:</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: V/A + -아요/어요"
                                    value={grammarFormData.structure}
                                    onChange={(e) => setGrammarFormData({ ...grammarFormData, structure: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Cách dùng & Quy tắc chia:</label>
                                <textarea
                                    rows="2"
                                    value={grammarFormData.usageDesc}
                                    onChange={(e) => setGrammarFormData({ ...grammarFormData, usageDesc: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Ví dụ câu tiếng Hàn:</label>
                                <input
                                    type="text"
                                    value={grammarFormData.exampleKr}
                                    onChange={(e) => setGrammarFormData({ ...grammarFormData, exampleKr: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                />
                            </div>
                            <div>
                                <label className="block mb-1">Dịch nghĩa ví dụ:</label>
                                <input
                                    type="text"
                                    value={grammarFormData.exampleVn}
                                    onChange={(e) => setGrammarFormData({ ...grammarFormData, exampleVn: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-[#FFF9FA] border border-pink-100 rounded-xl focus:outline-none focus:border-[#F06292]"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                                <button type="button" onClick={() => setShowGrammarModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-[#F06292] text-white rounded-xl font-bold">
                                    {isEditingGrammar ? 'Lưu thay đổi' : 'Thêm ngữ pháp'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL IMPORT TỪ VỰNG HÀNG LOẠT */}
            {showBatchVocabModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-[#373A4D]">Import từ vựng (Excel / JSON)</h3>
                            <button onClick={() => setShowBatchVocabModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <input type="file" ref={vocabFileInputRef} onChange={handleVocabFileUpload} accept=".xlsx, .xls, .csv, .json" className="hidden" />
                            <button onClick={() => vocabFileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F06292] text-white text-xs font-bold rounded-xl shadow-sm"><Upload size={14} /> Chọn tệp Excel / JSON</button>
                            <div className="flex items-center gap-2">
                                <button onClick={downloadVocabExcelTemplate} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-xs font-bold"><Download size={13} /> Mẫu Excel</button>
                                <button onClick={downloadVocabJsonTemplate} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-xl text-xs font-bold"><FileCode size={13} /> Mẫu JSON</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
                            <textarea rows="10" value={batchVocabText} onChange={(e) => handleParseVocabText(e.target.value)} placeholder="Hoặc dán: Từ - Nghĩa" className="w-full flex-1 p-3 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs font-mono resize-none" />
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 overflow-y-auto space-y-2 text-xs">
                                {parsedVocabList.map((item, idx) => (
                                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 flex items-center justify-between">
                                        <div><span className="font-extrabold text-[#373A4D]">{item.wordKr}</span> : <span className="text-gray-600">{item.meaningVn}</span></div>
                                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">Sẵn sàng</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                            <button type="button" onClick={() => setShowBatchVocabModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold">Hủy</button>
                            <button type="button" disabled={parsedVocabList.length === 0} onClick={handleSaveBatchVocab} className="px-5 py-2 bg-[#F06292] text-white rounded-xl text-xs font-bold"><Save size={14} /> Lưu tất cả {parsedVocabList.length} từ</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL IMPORT NGỮ PHÁP HÀNG LOẠT */}
            {showBatchGrammarModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-extrabold text-[#373A4D]">Import ngữ pháp (Excel / JSON)</h3>
                            <button onClick={() => setShowBatchGrammarModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-pink-50/50 rounded-2xl border border-pink-100">
                            <input type="file" ref={grammarFileInputRef} onChange={handleGrammarFileUpload} accept=".xlsx, .xls, .csv, .json" className="hidden" />
                            <button onClick={() => grammarFileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F06292] text-white text-xs font-bold rounded-xl shadow-sm"><Upload size={14} /> Chọn tệp Excel / JSON</button>
                            <div className="flex items-center gap-2">
                                <button onClick={downloadGrammarExcelTemplate} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded-xl text-xs font-bold"><Download size={13} /> Mẫu Excel</button>
                                <button onClick={downloadGrammarJsonTemplate} className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-xl text-xs font-bold"><FileCode size={13} /> Mẫu JSON</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden">
                            <textarea rows="10" value={batchGrammarText} onChange={(e) => handleParseGrammarText(e.target.value)} placeholder="Dán mảng JSON hoặc: Cấu trúc | Cách dùng | Ví dụ | Dịch" className="w-full flex-1 p-3 bg-[#FFF9FA] border border-pink-100 rounded-2xl text-xs font-mono resize-none" />
                            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-3 overflow-y-auto space-y-2 text-xs">
                                {parsedGrammarList.map((item, idx) => (
                                    <div key={idx} className="bg-white p-2.5 rounded-xl border border-gray-100 space-y-1">
                                        <span className="font-extrabold text-[#F06292] bg-pink-50 px-2 py-0.5 rounded-md text-xs">{item.structure}</span>
                                        <p className="text-gray-600 text-[11px] line-clamp-2">{item.usageDesc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end gap-2 border-t border-pink-50">
                            <button type="button" onClick={() => setShowBatchGrammarModal(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold">Hủy</button>
                            <button type="button" disabled={parsedGrammarList.length === 0} onClick={handleSaveBatchGrammar} className="px-5 py-2 bg-[#F06292] text-white rounded-xl text-xs font-bold"><Save size={14} /> Lưu tất cả {parsedGrammarList.length} ngữ pháp</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseManagement;