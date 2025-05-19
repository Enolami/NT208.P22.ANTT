import React, { useState } from 'react';
import { marked } from 'marked';

function AIAssistant({
  isListening,
  setIsListening,
  aiAssistantResponse,
  setAiAssistantResponse,
  isAiLoading,
  setIsAiLoading
}) {
  const [userInput, setUserInput] = useState('');

  const startListening = () => {
    setIsListening(true);
    // Simulate speech recognition
    setTimeout(() => {
      setIsListening(false);
      setUserInput('Thêm công việc mới cho ngày mai');
      handleSubmit('Thêm công việc mới cho ngày mai');
    }, 2000);
  };

  const handleSubmit = (input = userInput) => {
    if (!input.trim()) return;
    setIsAiLoading(true);
    setAiAssistantResponse('');
    simulateAIResponse(input).then(response => {
      setAiAssistantResponse(response);
      setIsAiLoading(false);
    });
  };

  const simulateAIResponse = (input) => {
    return new Promise(resolve => {
      setTimeout(() => {
        let response = '';
        if (input.toLowerCase().includes('thời tiết')) {
          response = 'Hôm nay trời nắng đẹp, nhiệt độ 28°C. Thời tiết lý tưởng cho các hoạt động ngoài trời.';
        } else if (input.toLowerCase().includes('lịch')) {
          response = 'Bạn có 3 cuộc họp vào ngày mai:\n1. Họp team lúc 9:00\n2. Họp với khách hàng lúc 14:00\n3. Họp tổng kết lúc 16:00';
        } else if (input.toLowerCase().includes('công việc')) {
          response = 'Các công việc ưu tiên của bạn:\n1. Hoàn thành báo cáo quý\n2. Chuẩn bị bài thuyết trình\n3. Gửi email cho khách hàng';
        } else {
          response = 'Tôi có thể giúp bạn:\n- Kiểm tra lịch trình\n- Thêm công việc mới\n- Tìm kiếm thông tin\n- Đưa ra gợi ý';
        }
        resolve(response);
      }, 1000);
    });
  };

  return (
    <div className="ai-assistant">
      <div className="ai-header">
        <h2>Trợ lý thông minh</h2>
        <button
          onClick={() => handleSubmit()}
          disabled={isAiLoading}
          className={`button ${isAiLoading ? 'button-disabled' : 'button-primary'}`}
        >
          {isAiLoading ? 'Đang xử lý...' : 'Gửi'}
        </button>
      </div>

      <div className="ai-chat">
        <div className="ai-message">
          <div className="ai-avatar">🤖</div>
          <div className="ai-content">
            {isAiLoading ? (
              <div className="loading">Đang xử lý...</div>
            ) : aiAssistantResponse ? (
              <div className="markdown" dangerouslySetInnerHTML={{ __html: marked.parse(aiAssistantResponse) }} />
            ) : (
              <div className="welcome-message">
                Xin chào! Tôi là trợ lý thông minh của bạn. Tôi có thể giúp bạn:
                <ul>
                  <li>Kiểm tra lịch trình</li>
                  <li>Thêm công việc mới</li>
                  <li>Tìm kiếm thông tin</li>
                  <li>Đưa ra gợi ý</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ai-input">
        <input
          type="text"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
          className="input-field"
        />
        <button
          onClick={startListening}
          disabled={isListening}
          className={`button ${isListening ? 'button-disabled' : 'button-secondary'}`}
        >
          {isListening ? '🎤 Đang nghe...' : '🎤'}
        </button>
      </div>

      <div className="quick-actions">
        <button onClick={() => handleSubmit('Thời tiết hôm nay thế nào?')} className="quick-action-button">
          🌤️ Thời tiết
        </button>
        <button onClick={() => handleSubmit('Kiểm tra lịch của tôi')} className="quick-action-button">
          📅 Lịch trình
        </button>
        <button onClick={() => handleSubmit('Công việc ưu tiên')} className="quick-action-button">
          📋 Công việc
        </button>
      </div>
    </div>
  );
}

export default AIAssistant; 