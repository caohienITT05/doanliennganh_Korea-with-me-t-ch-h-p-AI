import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Volume2, RotateCcw, ChevronLeft, ChevronRight,
    Shuffle, CheckCircle2, XCircle, Award, BookOpen, Layers,
    HelpCircle, Puzzle, Sparkles, Check, RefreshCw
} from 'lucide-react';
import axios from './axios';

const StudyLesson = ({ lesson, onBack }) => {
    const [activeTab, setActiveTab] = useState('flashcard'); // 'flashcard' | 'quiz' | 'matching' | 'grammar'
    const [vocabularies, setVocabularies] = useState([]);
    const [grammars, setGrammars] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Flashcard State ---
    const [cardIndex, setCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [rememberedCount, setRememberedCount] = useState(0);

    // --- Quiz State ---
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [quizIndex, setQuizIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    // --- Matching Game State ---
    const [matchingCards, setMatchingCards] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [matchedIds, setMatchedIds] = useState([]);
    const [gameWon, setGameWon] = useState(false);

    // 1. Tải toàn bộ dữ liệu bài học
    useEffect(() => {
        const fetchStudyData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/public/lessons/${lesson.id}/study`);
                setVocabularies(res.data.vocabularies || []);
                setGrammars(res.data.grammars || []);
                if (res.data.vocabularies && res.data.vocabularies.length > 0) {
                    initQuiz(res.data.vocabularies);
                    initMatchingGame(res.data.vocabularies);
                }
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu bài học:", err);
            } finally {
                setLoading(false);
            }
        };

        if (lesson?.id) {
            fetchStudyData();
        }
    }, [lesson]);

    // 2. Phát âm TTS tiếng Hàn
    const speakKorean = (text, e) => {
        if (e) e.stopPropagation();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ko-KR';
            utterance.rate = 0.85;
            window.speechSynthesis.speak(utterance);
        }
    };

    // ================= FLASHCARD LOGIC =================
    const handleNextCard = () => {
        if (cardIndex < vocabularies.length - 1) {
            setIsFlipped(false);
            setTimeout(() => setCardIndex(prev => prev + 1), 150);
        }
    };

    const handlePrevCard = () => {
        if (cardIndex > 0) {
            setIsFlipped(false);
            setTimeout(() => setCardIndex(prev => prev - 1), 150);
        }
    };

    const handleShuffleCards = () => {
        const shuffled = [...vocabularies].sort(() => Math.random() - 0.5);
        setVocabularies(shuffled);
        setCardIndex(0);
        setIsFlipped(false);
    };

    // ================= QUIZ LOGIC =================
    const initQuiz = (vocabList) => {
        if (!vocabList || vocabList.length === 0) return;
        const questions = vocabList.map(item => {
            // 3 đáp án sai ngẫu nhiên
            const wrongChoices = vocabList
                .filter(v => v.id !== item.id)
                .map(v => v.meaningVn)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            const allOptions = [...wrongChoices, item.meaningVn].sort(() => Math.random() - 0.5);

            return {
                id: item.id,
                wordKr: item.wordKr,
                correctMeaning: item.meaningVn,
                options: allOptions
            };
        }).sort(() => Math.random() - 0.5);

        setQuizQuestions(questions);
        setQuizIndex(0);
        setScore(0);
        setQuizFinished(false);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
    };

    const handleSelectQuizOption = (option) => {
        if (isAnswerSubmitted) return;
        setSelectedAnswer(option);
        setIsAnswerSubmitted(true);
        if (option === quizQuestions[quizIndex].correctMeaning) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuizQuestion = () => {
        if (quizIndex < quizQuestions.length - 1) {
            setQuizIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswerSubmitted(false);
        } else {
            setQuizFinished(true);
        }
    };

    // ================= MATCHING GAME LOGIC =================
    const initMatchingGame = (vocabList) => {
        if (!vocabList || vocabList.length === 0) return;
        const selectedVocabs = [...vocabList].sort(() => Math.random() - 0.5).slice(0, 6);
        const krCards = selectedVocabs.map(v => ({ id: `kr-${v.id}`, vocabId: v.id, text: v.wordKr, lang: 'kr' }));
        const vnCards = selectedVocabs.map(v => ({ id: `vn-${v.id}`, vocabId: v.id, text: v.meaningVn, lang: 'vn' }));

        setMatchingCards([...krCards, ...vnCards].sort(() => Math.random() - 0.5));
        setSelectedCards([]);
        setMatchedIds([]);
        setGameWon(false);
    };

    const handleCardClick = (card) => {
        if (matchedIds.includes(card.vocabId)) return;
        if (selectedCards.some(c => c.id === card.id)) return;

        if (selectedCards.length === 0) {
            setSelectedCards([card]);
        } else if (selectedCards.length === 1) {
            const first = selectedCards[0];
            if (first.lang === card.lang) {
                setSelectedCards([card]);
                return;
            }

            setSelectedCards([first, card]);
            if (first.vocabId === card.vocabId) {
                setMatchedIds(prev => {
                    const updated = [...prev, card.vocabId];
                    if (updated.length === matchingCards.length / 2) {
                        setGameWon(true);
                    }
                    return updated;
                });
                setSelectedCards([]);
            } else {
                setTimeout(() => setSelectedCards([]), 800);
            }
        }
    };

    const currentCard = vocabularies[cardIndex];

    return (
        <div className="min-h-screen bg-[#FFF5F7] text-[#373A4D] font-sans pb-16">

            {/* 1. TOP BAR ĐIỀU HƯỚNG */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 bg-pink-50 hover:bg-[#F06292] text-[#F06292] hover:text-white rounded-2xl transition shadow-2xs"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <span className="text-[10px] font-black uppercase text-[#F06292] tracking-wider">
                                Bài #{lesson?.orderIndex || 1}
                            </span>
                            <h1 className="text-base font-black text-[#373A4D] line-clamp-1">{lesson?.title}</h1>
                        </div>
                    </div>

                    {/* TAB CHUYỂN CHẾ ĐỘ HỌC */}
                    <div className="flex bg-[#FFF5F7] p-1.5 rounded-2xl border border-pink-100">
                        <button
                            onClick={() => setActiveTab('flashcard')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${activeTab === 'flashcard' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                                }`}
                        >
                            <Layers size={14} /> Flashcard
                        </button>
                        <button
                            onClick={() => setActiveTab('quiz')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${activeTab === 'quiz' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                                }`}
                        >
                            <HelpCircle size={14} /> Trắc nghiệm
                        </button>
                        <button
                            onClick={() => setActiveTab('matching')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${activeTab === 'matching' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                                }`}
                        >
                            <Puzzle size={14} /> Ghép từ
                        </button>
                        <button
                            onClick={() => setActiveTab('grammar')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${activeTab === 'grammar' ? 'bg-[#F06292] text-white shadow-xs' : 'text-gray-500 hover:text-[#F06292]'
                                }`}
                        >
                            <BookOpen size={14} /> Ngữ pháp ({grammars.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. KHU VỰC NỘI DUNG TƯƠNG TÁC CHÍNH */}
            <div className="max-w-4xl mx-auto px-6 pt-8">

                {loading ? (
                    <div className="py-20 text-center bg-white rounded-3xl border border-pink-100 shadow-sm">
                        <Sparkles className="animate-spin text-[#F06292] mx-auto mb-2" size={32} />
                        <p className="text-xs font-bold text-gray-400">Đang tải học liệu tiếng Hàn...</p>
                    </div>
                ) : vocabularies.length === 0 && activeTab !== 'grammar' ? (
                    <div className="py-20 text-center bg-white rounded-3xl border border-pink-100 shadow-sm">
                        <BookOpen className="text-pink-300 mx-auto mb-2" size={40} />
                        <p className="text-sm font-bold text-gray-700">Bài học này chưa có từ vựng</p>
                        <p className="text-xs text-gray-400 mt-1">Vui lòng vào trang Quản trị Admin để import danh sách từ vựng.</p>
                    </div>
                ) : (
                    <>
                        {/* ========================================================================= */}
                        {/* CHẾ ĐỘ 1: FLASHCARD 3D (LẬT THẺ THÔNG MINH) */}
                        {/* ========================================================================= */}
                        {activeTab === 'flashcard' && currentCard && (
                            <div className="flex flex-col items-center space-y-6">
                                {/* Thanh tiến độ */}
                                <div className="w-full max-w-md flex items-center justify-between text-xs font-black text-gray-400 px-2">
                                    <span>Tiến độ học: {cardIndex + 1} / {vocabularies.length}</span>
                                    <button onClick={handleShuffleCards} className="flex items-center gap-1 text-[#F06292] hover:underline">
                                        <Shuffle size={14} /> Xáo trộn thẻ
                                    </button>
                                </div>
                                <div className="w-full max-w-md h-2 bg-pink-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#F06292] transition-all duration-300 rounded-full"
                                        style={{ width: `${((cardIndex + 1) / vocabularies.length) * 100}%` }}
                                    />
                                </div>

                                {/* THẺ 3D LẬT QUA LẠI */}
                                <div
                                    className="w-full max-w-md h-72 cursor-pointer select-none"
                                    style={{ perspective: '1000px' }}
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <div
                                        className="relative w-full h-full duration-500 rounded-3xl shadow-lg border border-pink-100"
                                        style={{
                                            transformStyle: 'preserve-3d',
                                            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                                        }}
                                    >
                                        {/* MẶT TRƯỚC (TIẾNG HÀN) */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center justify-between text-center"
                                            style={{ backfaceVisibility: 'hidden' }}
                                        >
                                            <span className="text-[11px] font-black text-[#F06292] bg-pink-50 px-3 py-1 rounded-full uppercase">
                                                Tiếng Hàn (Nhấp để lật nghĩa)
                                            </span>

                                            <div>
                                                <h2 className="text-4xl font-black text-[#373A4D] tracking-wide mb-2">
                                                    {currentCard.wordKr}
                                                </h2>
                                                <button
                                                    onClick={(e) => speakKorean(currentCard.wordKr, e)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-[#F06292] rounded-xl text-xs font-bold transition mt-2 shadow-2xs"
                                                >
                                                    <Volume2 size={16} /> Nghe phát âm
                                                </button>
                                            </div>

                                            <span className="text-[11px] text-gray-400 font-medium">
                                                💡 Nhấp vào thẻ để xem nghĩa tiếng Việt
                                            </span>
                                        </div>

                                        {/* MẶT SAU (TIẾNG VIỆT) */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#FFF0F4] to-white rounded-3xl p-8 flex flex-col items-center justify-between text-center"
                                            style={{
                                                backfaceVisibility: 'hidden',
                                                transform: 'rotateY(180deg)'
                                            }}
                                        >
                                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">
                                                Nghĩa tiếng Việt
                                            </span>

                                            <div>
                                                <h3 className="text-3xl font-black text-[#F06292] mb-1">
                                                    {currentCard.meaningVn}
                                                </h3>
                                                <p className="text-sm font-bold text-gray-400">"{currentCard.wordKr}"</p>
                                            </div>

                                            <button
                                                onClick={(e) => speakKorean(currentCard.wordKr, e)}
                                                className="p-2 text-[#F06292] bg-white rounded-xl shadow-xs"
                                            >
                                                <Volume2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* ĐIỀU HƯỚNG THẺ */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handlePrevCard}
                                        disabled={cardIndex === 0}
                                        className="p-3 bg-white border border-pink-200 text-gray-600 hover:text-[#F06292] disabled:opacity-40 rounded-2xl shadow-xs transition"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setIsFlipped(!isFlipped)}
                                        className="px-6 py-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-md shadow-pink-200 transition"
                                    >
                                        Lật mặt thẻ
                                    </button>
                                    <button
                                        onClick={handleNextCard}
                                        disabled={cardIndex === vocabularies.length - 1}
                                        className="p-3 bg-white border border-pink-200 text-gray-600 hover:text-[#F06292] disabled:opacity-40 rounded-2xl shadow-xs transition"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* CHẾ ĐỘ 2: TRẮC NGHIỆM QUIZ (4 LỰA CHỌN) */}
                        {/* ========================================================================= */}
                        {activeTab === 'quiz' && (
                            <div className="max-w-xl mx-auto">
                                {quizFinished ? (
                                    <div className="bg-white rounded-3xl p-8 border border-pink-100 shadow-md text-center space-y-4">
                                        <div className="w-16 h-16 bg-pink-50 text-[#F06292] rounded-full mx-auto flex items-center justify-center">
                                            <Award size={32} />
                                        </div>
                                        <h2 className="text-2xl font-black text-[#373A4D]">Hoàn thành bài kiểm tra!</h2>
                                        <p className="text-sm font-bold text-gray-500">
                                            Bạn đã đạt được: <span className="text-[#F06292] text-xl font-black">{score}</span> / {quizQuestions.length} câu đúng!
                                        </p>
                                        <button
                                            onClick={() => initQuiz(vocabularies)}
                                            className="px-6 py-3 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-2xl shadow-md transition inline-flex items-center gap-2"
                                        >
                                            <RotateCcw size={16} /> Làm lại Quiz
                                        </button>
                                    </div>
                                ) : quizQuestions.length > 0 ? (
                                    <div className="bg-white rounded-3xl p-6 border border-pink-100 shadow-md space-y-6">
                                        <div className="flex items-center justify-between text-xs font-black text-gray-400 pb-2 border-b border-pink-50">
                                            <span>Câu hỏi {quizIndex + 1} / {quizQuestions.length}</span>
                                            <span className="text-[#F06292]">Điểm: {score}</span>
                                        </div>

                                        <div className="text-center py-4 bg-pink-50/50 rounded-2xl border border-pink-100">
                                            <span className="text-[11px] font-black text-gray-400 uppercase">Chọn nghĩa đúng của từ:</span>
                                            <h2 className="text-3xl font-black text-[#373A4D] mt-2">
                                                {quizQuestions[quizIndex].wordKr}
                                            </h2>
                                            <button
                                                onClick={() => speakKorean(quizQuestions[quizIndex].wordKr)}
                                                className="mt-2 text-[#F06292] hover:underline text-xs font-bold inline-flex items-center gap-1"
                                            >
                                                <Volume2 size={15} /> Nghe phát âm
                                            </button>
                                        </div>

                                        {/* 4 Lựa chọn đáp án */}
                                        <div className="grid grid-cols-1 gap-3">
                                            {quizQuestions[quizIndex].options.map((opt, idx) => {
                                                let btnStyle = "bg-white border-pink-100 text-[#373A4D] hover:border-pink-300 hover:bg-pink-50/30";
                                                if (isAnswerSubmitted) {
                                                    if (opt === quizQuestions[quizIndex].correctMeaning) {
                                                        btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-700 font-black";
                                                    } else if (opt === selectedAnswer) {
                                                        btnStyle = "bg-rose-50 border-rose-400 text-rose-700";
                                                    } else {
                                                        btnStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                                                    }
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleSelectQuizOption(opt)}
                                                        className={`p-4 rounded-2xl border text-sm font-bold text-left transition flex items-center justify-between shadow-2xs ${btnStyle}`}
                                                    >
                                                        <span>{opt}</span>
                                                        {isAnswerSubmitted && opt === quizQuestions[quizIndex].correctMeaning && (
                                                            <CheckCircle2 size={18} className="text-emerald-600" />
                                                        )}
                                                        {isAnswerSubmitted && opt === selectedAnswer && opt !== quizQuestions[quizIndex].correctMeaning && (
                                                            <XCircle size={18} className="text-rose-600" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {isAnswerSubmitted && (
                                            <div className="pt-2 flex justify-end">
                                                <button
                                                    onClick={handleNextQuizQuestion}
                                                    className="px-6 py-2.5 bg-[#F06292] hover:bg-[#e05584] text-white text-xs font-black rounded-xl shadow-md transition"
                                                >
                                                    {quizIndex === quizQuestions.length - 1 ? 'Xem kết quả' : 'Câu tiếp theo →'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* CHẾ ĐỘ 3: GAME GHÉP TỪ (MATCHING PAIRS) */}
                        {/* ========================================================================= */}
                        {activeTab === 'matching' && (
                            <div className="max-w-2xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-base font-black text-[#373A4D]">Mini-game: Ghép thẻ tương ứng</h3>
                                        <p className="text-xs text-gray-500 font-medium">Nhấp chọn 1 từ tiếng Hàn và 1 nghĩa tiếng Việt để ghép đôi.</p>
                                    </div>
                                    <button
                                        onClick={() => initMatchingGame(vocabularies)}
                                        className="p-2 bg-white border border-pink-200 text-[#F06292] rounded-xl hover:bg-pink-50 transition shadow-2xs"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>

                                {gameWon ? (
                                    <div className="bg-white rounded-3xl p-8 border border-pink-100 shadow-md text-center space-y-4">
                                        <span className="text-4xl">🎉</span>
                                        <h2 className="text-xl font-black text-[#373A4D]">Xuất sắc! Bạn đã ghép đúng tất cả các thẻ!</h2>
                                        <button
                                            onClick={() => initMatchingGame(vocabularies)}
                                            className="px-6 py-3 bg-[#F06292] text-white text-xs font-black rounded-2xl shadow-md transition"
                                        >
                                            Chơi lại ván mới
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {matchingCards.map((card) => {
                                            const isMatched = matchedIds.includes(card.vocabId);
                                            const isSelected = selectedCards.some(c => c.id === card.id);

                                            let cardStyle = "bg-white border-pink-100 text-[#373A4D] hover:border-pink-300 hover:shadow-xs";
                                            if (isMatched) {
                                                cardStyle = "bg-emerald-50 border-emerald-200 text-emerald-600 opacity-40 cursor-default";
                                            } else if (isSelected) {
                                                cardStyle = "bg-[#F06292] border-[#F06292] text-white shadow-md scale-105";
                                            }

                                            return (
                                                <div
                                                    key={card.id}
                                                    onClick={() => handleCardClick(card)}
                                                    className={`h-24 rounded-2xl border-2 p-2 flex flex-col items-center justify-center text-center cursor-pointer transition duration-200 select-none ${cardStyle}`}
                                                >
                                                    <span className={`text-xs font-black ${card.lang === 'kr' ? 'text-sm' : ''}`}>
                                                        {card.text}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ========================================================================= */}
                        {/* CHẾ ĐỘ 4: SỔ TAY NGỮ PHÁP (GRAMMAR BOOK) */}
                        {/* ========================================================================= */}
                        {activeTab === 'grammar' && (
                            <div className="max-w-3xl mx-auto space-y-4">
                                {grammars.length === 0 ? (
                                    <div className="py-16 text-center bg-white rounded-3xl border border-pink-100">
                                        <p className="text-xs font-bold text-gray-400">Bài học này chưa có cấu trúc ngữ pháp nào.</p>
                                    </div>
                                ) : (
                                    grammars.map((g) => (
                                        <div key={g.id} className="bg-white rounded-3xl p-6 border border-pink-100 shadow-sm space-y-3">
                                            <div className="flex items-center gap-2">
                                                <span className="px-3.5 py-1 bg-gradient-to-r from-pink-500 to-[#F06292] text-white font-black text-xs rounded-xl shadow-xs">
                                                    {g.structure}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase">Cách dùng & Ý nghĩa:</span>
                                                <p className="text-xs text-gray-700 font-bold leading-relaxed mt-0.5">
                                                    {g.usageDesc || 'Chưa có hướng dẫn cách dùng.'}
                                                </p>
                                            </div>

                                            {(g.exampleKr || g.exampleVn) && (
                                                <div className="p-3.5 bg-[#FFF9FA] rounded-2xl border border-pink-100 flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="text-[10px] font-black text-[#F06292] uppercase">Câu ví dụ:</span>
                                                        {g.exampleKr && <p className="text-sm font-black text-[#373A4D] mt-0.5">{g.exampleKr}</p>}
                                                        {g.exampleVn && <p className="text-xs text-gray-500 font-medium mt-0.5">{g.exampleVn}</p>}
                                                    </div>
                                                    {g.exampleKr && (
                                                        <button
                                                            onClick={() => speakKorean(g.exampleKr)}
                                                            className="p-2 text-[#F06292] bg-white rounded-xl shadow-2xs hover:bg-pink-50 transition shrink-0"
                                                            title="Nghe câu ví dụ"
                                                        >
                                                            <Volume2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

        </div>
    );
};

export default StudyLesson;