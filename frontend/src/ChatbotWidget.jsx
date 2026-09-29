import React, { useState, useRef, useEffect } from 'react';
import axios from './axios';
import {
    MessageCircle, X, Send, Sparkles, BookOpen, Compass, RotateCcw, Bot
} from 'lucide-react';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            role: 'model',
            content: 'Xin chào! Mình là **Trợ lý AI Tiếng Hàn** 🇰🇷.\n\nMình có thể hỗ trợ bạn:\n- 📖 **Tra nghĩa từ vựng** chuyên sâu kèm ví dụ câu\n- 💡 **Giải thích ngữ pháp** và phân biệt các cấu trúc dễ nhầm lẫn\n- 🧭 **Lập lộ trình học tập** chi tiết cho người mới bắt đầu\n\nBạn muốn tìm hiểu nội dung gì hôm nay?'
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống tin nhắn mới nhất
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Gửi tin nhắn
    const handleSendMessage = async (textToSend) => {
        const text = (textToSend || inputMessage).trim();
        if (!text || isLoading) return;

        const userMsg = { role: 'user', content: text };
        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Chỉ gửi tối đa 6 lượt tin nhắn gần nhất để tối ưu token
            const historyToSend = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await axios.post('/api/chat/ask', {
                message: text,
                history: historyToSend
            });

            setMessages(prev => [...prev, { role: 'model', content: res.data.reply }]);
        } catch {
            setMessages(prev => [
                ...prev,
                { role: 'model', content: 'Hiện tại kết nối AI đang gián đoạn. Bạn thử gửi lại câu hỏi sau giây lát nhé!' }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Các câu hỏi gợi ý nhanh
    const quickPrompts = [
        { label: '🧭 Lộ trình cho người mới', text: 'Hãy xây dựng cho tôi lộ trình học tiếng Hàn từ số 0 để đạt TOPIK 2 trong vòng 6 tháng.' },
        { label: '💡 Phân biệt -아/어서 & -(으)니까', text: 'Giải thích và phân biệt giúp tôi ngữ pháp -아/어서 và -(으)니까 khi nào dùng cấu trúc nào?' },
        { label: '📖 Tra từ "가족"', text: 'Tra từ "가족": nghĩa tiếng Việt, cách dùng và cho 2 ví dụ câu thực tế.' }
    ];

    // Định dạng text đơn giản (bold, xuống dòng)
    const renderFormattedText = (text) => {
        return text.split('\n').map((line, idx) => {
            // Render in đậm **chữ**
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={idx} className="block min-h-[1.2em]">
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={pIdx} className="font-black text-[#373A4D]">{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </span>
            );
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">

            {/* 1. NÚT TRÒN MỞ CHAT NỔI (BONG BÓNG) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-[#F48FB1] to-[#F06292] text-white flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-200 group relative"
                    title="Trợ lý AI Tiếng Hàn"
                >
                    <Bot size={28} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full"></span>
                </button>
            )}

            {/* 2. CỬA SỔ CHATBOX */}
            {isOpen && (
                <div className="w-[380px] sm:w-[420px] h-[580px] bg-white rounded-3xl shadow-2xl border border-pink-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">

                    {/* HEADER CHAT */}
                    <div className="bg-gradient-to-r from-[#F48FB1] to-[#F06292] p-4 text-white flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black flex items-center gap-1.5">
                                    Trợ lý AI Tiếng Hàn <Sparkles size={13} className="text-yellow-200" />
                                </h3>
                                <span className="text-[10px] text-pink-100 font-medium flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></span> Sẵn sàng giải đáp
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setMessages([messages[0]])}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
                                title="Làm mới đoạn hội thoại"
                            >
                                <RotateCcw size={15} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* DANH SÁCH TIN NHẮN */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#FFFDFE] text-xs">
                        {messages.map((msg, index) => {
                            const isUser = msg.role === 'user';
                            return (
                                <div
                                    key={index}
                                    className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!isUser && (
                                        <div className="w-7 h-7 rounded-xl bg-pink-100 text-[#F06292] flex items-center justify-center font-black shrink-0 text-[11px]">
                                            AI
                                        </div>
                                    )}

                                    <div
                                        className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed font-medium shadow-2xs ${isUser
                                                ? 'bg-[#F06292] text-white rounded-br-xs'
                                                : 'bg-white border border-pink-100 text-gray-700 rounded-bl-xs'
                                            }`}
                                    >
                                        {renderFormattedText(msg.content)}
                                    </div>
                                </div>
                            );
                        })}

                        {isLoading && (
                            <div className="flex gap-2.5 items-center text-xs text-gray-400 font-bold pl-1">
                                <div className="w-7 h-7 rounded-xl bg-pink-50 text-[#F06292] flex items-center justify-center">
                                    <Sparkles size={14} className="animate-spin" />
                                </div>
                                <span>Gemini đang tra cứu câu trả lời...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* THANH GỢI Ý CÂU HỎI NHANH (QUICK PROMPTS) */}
                    <div className="px-3 py-2 bg-pink-50/50 border-t border-pink-50 flex gap-1.5 overflow-x-auto no-scrollbar">
                        {quickPrompts.map((qp, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendMessage(qp.text)}
                                className="shrink-0 px-2.5 py-1 bg-white border border-pink-200 text-[#F06292] rounded-xl text-[10px] font-black hover:bg-pink-100/50 transition shadow-2xs"
                            >
                                {qp.label}
                            </button>
                        ))}
                    </div>

                    {/* Ô NHẬP TIN NHẮN */}
                    <div className="p-3 bg-white border-t border-pink-100 flex items-center gap-2">
                        <input
                            type="text"
                            placeholder="Nhập từ vựng, ngữ pháp hoặc lộ trình cần hỏi..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            disabled={isLoading}
                            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-[#373A4D] focus:outline-none focus:border-[#F06292] focus:bg-white transition"
                        />

                        <button
                            onClick={() => handleSendMessage()}
                            disabled={isLoading || !inputMessage.trim()}
                            className="w-10 h-10 rounded-2xl bg-[#F06292] hover:bg-[#e05584] text-white flex items-center justify-center shadow-xs transition disabled:opacity-40"
                        >
                            <Send size={16} />
                        </button>
                    </div>

                </div>
            )}

        </div>
    );
};

export default ChatbotWidget;