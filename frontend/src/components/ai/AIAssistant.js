import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/aiService';
import { useTheme } from '@mui/material/styles';
import './AIAssistant.css';

const suggestionButtons = [
  { label: 'Sắp xếp lịch', value: 'Sắp xếp lại lịch trình của tôi' },
  { label: 'Ưu tiên công việc', value: 'Đề xuất công việc ưu tiên' },
  { label: 'Tìm khoảng trống', value: 'Tìm khoảng trống trong lịch' },
];

const AiAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    // Load previous interactions
    const loadInteractions = async () => {
      try {
        const interactions = await aiService.getInteractions();
        const formattedMessages = interactions.reverse().map(interaction => [
          { type: 'user', content: interaction.request_data },
          { type: 'assistant', content: interaction.ai_response }
        ]).flat();
        setMessages(formattedMessages);
      } catch (error) {
        // ignore
      }
    };
    loadInteractions();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsLoading(true);
    setSuggestions(null);

    try {
      const response = await aiService.createInteraction(userMessage);

      let parsedResponse = response.ai_response;
      if (typeof parsedResponse === 'string') {
        const codeBlockMatch = parsedResponse.match(/```(?:json)?\n([\s\S]*?)```/i);
        if (codeBlockMatch) {
          parsedResponse = codeBlockMatch[1];
        }
        try {
          parsedResponse = JSON.parse(parsedResponse);
        } catch {
          setMessages(prev => [...prev, { type: 'assistant', content: response.ai_response }]);
          return;
        }
      }

      let formattedResponse = '';
      if (parsedResponse.analysis) {
        formattedResponse += `📊 Phân tích:\n${parsedResponse.analysis}\n\n`;
      }
      if (parsedResponse.suggestions && parsedResponse.suggestions.length > 0) {
        formattedResponse += `💡 Gợi ý:\n${parsedResponse.suggestions.map((suggestion, index) => 
          `${index + 1}. ${suggestion}`
        ).join('\n')}\n\n`;
      }
      if (parsedResponse.new_schedule) {
        formattedResponse += `📅 Lịch đề xuất:\n`;
        Object.entries(parsedResponse.new_schedule).forEach(([date, schedule]) => {
          formattedResponse += `\nNgày: ${date}\n`;
          if (schedule.tasks && schedule.tasks.length > 0) {
            formattedResponse += '\nCông việc:\n';
            schedule.tasks.forEach(task => {
              formattedResponse += `• ${task.name} (${task.start_time} - ${task.end_time})\n`;
            });
          }
          if (schedule.events && schedule.events.length > 0) {
            formattedResponse += '\nSự kiện:\n';
            schedule.events.forEach(event => {
              formattedResponse += `• ${event.title} (${event.start_time} - ${event.end_time})\n`;
            });
          }
        });
      }

      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: formattedResponse.trim() || response.ai_response
      }]);
      if (parsedResponse.is_busy && parsedResponse.new_schedule) {
        setSuggestions(parsedResponse.new_schedule);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Xin lỗi, đã xảy ra lỗi. Vui lòng thử lại.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!suggestions) return;
    try {
      await aiService.updateSchedule(suggestions);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: 'Lịch trình đã được cập nhật thành công!' 
      }]);
      setSuggestions(null);
    } catch {
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Không thể cập nhật lịch trình. Vui lòng thử lại.' 
      }]);
    }
  };

  const handleDeclineSuggestion = () => {
    setMessages(prev => [...prev, { 
      type: 'assistant', 
      content: 'Bạn đã từ chối thay đổi lịch trình. Nếu cần trợ giúp thêm, hãy hỏi tôi nhé!' 
    }]);
    setSuggestions(null);
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        background: isDark
          ? '#23272f'
          : '#f8fafc',
        fontFamily: "'Quicksand', 'Inter', sans-serif",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '32px 0'
      }}
    >
      <div
        className="ai-chatgpt-container"
        style={{
          width: '100%',
          maxWidth: 1000,
          minHeight: 540,
          maxHeight: 700,
          height: 700,
          background: isDark ? '#1e2e23' : '#fff',
          borderRadius: 24,
          boxShadow: isDark
            ? '0 4px 32px 0 #166534'
            : '0 4px 32px 0 #22c55e22',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: isDark ? '1.5px solid #22c55e' : '1.5px solid #bbf7d0'
        }}
      >
        <div
          style={{
            background: isDark ? '#166534' : '#22c55e',
            padding: '18px 32px',
            fontWeight: 800,
            fontSize: 22,
            color: '#fff',
            letterSpacing: 1,
            borderBottom: isDark
              ? '1.5px solid #22c55e'
              : '1.5px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <span style={{ fontSize: 26 }}>🤖</span>
          <span>Trợ lý AI</span>
        </div>
        <div
          style={{
            flex: 1,
            padding: '28px 18px 16px 18px',
            overflowY: 'auto',
            background: isDark ? '#1e2e23' : '#fff',
            minHeight: 0,
            maxHeight: 'calc(700px - 120px - 70px)' // header + form height
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((message, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    borderRadius: 18,
                    padding: '13px 18px',
                    fontSize: 16,
                    fontFamily: "'Quicksand', 'Inter', sans-serif",
                    fontWeight: 500,
                    background: message.type === 'user'
                      ? (isDark ? '#22c55e' : '#22c55e')
                      : message.type === 'assistant'
                        ? (isDark ? '#1e2e23' : '#fff')
                        : '#fee2e2',
                    color: message.type === 'user'
                      ? '#fff'
                      : message.type === 'assistant'
                        ? (isDark ? '#e3e6f3' : '#166534')
                        : '#b91c1c',
                    boxShadow: message.type === 'user'
                      ? (isDark ? '0 2px 8px #22c55e55' : '0 2px 8px #22c55e33')
                      : message.type === 'assistant'
                        ? (isDark ? '0 2px 8px #16653422' : '0 2px 8px #bbf7d033')
                        : '0 2px 8px #fecaca',
                    border: message.type === 'user'
                      ? (isDark ? '1.5px solid #22c55e' : '1.5px solid #22c55e')
                      : message.type === 'assistant'
                        ? (isDark ? '1.5px solid #22c55e' : '1.5px solid #bbf7d0')
                        : '1.5px solid #fecaca',
                    textAlign: 'left',
                    whiteSpace: 'pre-line',
                    wordBreak: 'break-word',
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    background: '#fff',
                    color: '#166534',
                    borderRadius: 18,
                    padding: '13px 18px',
                    fontSize: 16,
                    fontWeight: 500,
                    boxShadow: '0 2px 8px #bbf7d033',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 60
                  }}
                >
                  <span className="ai-typing">
                    <span className="dot" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="dot" style={{ animationDelay: '120ms' }}>.</span>
                    <span className="dot" style={{ animationDelay: '240ms' }}>.</span>
                  </span>
                </div>
              </div>
            )}
            {suggestions && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ color: isDark ? '#3fc8e0' : '#22c55e', fontWeight: 700, fontSize: 16 }}>Lịch đề xuất</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    style={{
                      padding: '8px 18px',
                      borderRadius: 12,
                      background: isDark ? '#3fc8e0' : '#22c55e',
                      color: '#fff',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: isDark ? '0 2px 8px #3fc8e033' : '0 2px 8px #22c55e33'
                    }}
                    onClick={handleAcceptSuggestion}
                  >
                    Chấp nhận
                  </button>
                  <button
                    style={{
                      padding: '8px 18px',
                      borderRadius: 12,
                      background: isDark ? '#23263a' : '#f1f5f9',
                      color: isDark ? '#3fc8e0' : '#166534',
                      fontWeight: 700,
                      border: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #bbf7d0',
                      cursor: 'pointer',
                      boxShadow: isDark ? '0 2px 8px #3fc8e033' : '0 2px 8px #bbf7d033'
                    }}
                    onClick={handleDeclineSuggestion}
                  >
                    Từ chối
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            borderTop: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #bbf7d0',
            background: isDark ? '#23263a' : '#fff',
            padding: '16px 18px 12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập yêu cầu của bạn..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 16,
                border: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #bbf7d0',
                fontSize: 16,
                fontFamily: "'Quicksand', 'Inter', sans-serif",
                color: isDark ? '#e3e6f3' : '#166534',
                background: isDark ? '#23272f' : '#f8fafc',
                outline: 'none',
                fontWeight: 500,
                transition: 'border 0.18s'
              }}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: isDark ? '#3fc8e0' : '#22c55e',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 18,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                boxShadow: isDark ? '0 2px 8px #3fc8e033' : '0 2px 8px #22c55e33',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.18s'
              }}
              title="Gửi"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
            {suggestionButtons.map((btn) => (
              <button
                key={btn.value}
                type="button"
                style={{
                  padding: '7px 16px',
                  borderRadius: 12,
                  background: isDark ? '#23263a' : '#f1f5f9',
                  color: isDark ? '#3fc8e0' : '#166534',
                  fontWeight: 600,
                  fontSize: 15,
                  border: isDark ? '1.5px solid #3fc8e0' : '1.5px solid #bbf7d0',
                  cursor: 'pointer',
                  fontFamily: "'Quicksand', 'Inter', sans-serif",
                  transition: 'background 0.18s, color 0.18s'
                }}
                onClick={() => setInput(btn.value)}
                tabIndex={-1}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </form>
      </div>
      <style>
        {`
        .ai-typing .dot {
          font-size: 2rem;
          opacity: 0.7;
          animation: ai-bounce 1s infinite;
          display: inline-block;
        }
        .ai-typing .dot:nth-child(2) { animation-delay: 0.15s; }
        .ai-typing .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes ai-bounce {
          0%, 80%, 100% { transform: scale(1); opacity: 0.7; }
          40% { transform: scale(1.3); opacity: 1; }
        }
        `}
      </style>
    </div>
  );
};

export default AiAssistant;