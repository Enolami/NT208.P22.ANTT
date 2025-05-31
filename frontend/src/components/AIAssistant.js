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
        } else if (input.toLowerCase().includes('tối ưu')) {
          response = `**Đề xuất tối ưu lịch trình của bạn:**\n
- Ưu tiên hoàn thành các công việc quan trọng vào buổi sáng khi tinh thần minh mẫn nhất.
- Sắp xếp các cuộc họp vào buổi chiều, tránh xếp sát nhau để có thời gian chuẩn bị.
- Đặt nhắc nhở cho các công việc sắp đến hạn để không bị quên.
- Dành thời gian nghỉ ngắn giữa các phiên làm việc để tăng hiệu suất và tránh burnout.`;
        } else if (input.toLowerCase().includes('gợi ý')) {
          response = `**Một số gợi ý cho bạn:**\n
- Hãy kiểm tra lại các công việc ưu tiên trong ngày.
- Đặt mục tiêu nhỏ cho từng buổi sáng/chiều.
- Sử dụng tính năng đồng bộ lịch để không bỏ lỡ sự kiện quan trọng.
- Đừng quên dành thời gian nghỉ ngơi hợp lý.`;
        } else {
          response = `Tôi có thể giúp bạn:\n- Kiểm tra lịch trình\n- Thêm công việc mới\n- Tìm kiếm thông tin\n- Đưa ra gợi ý\n\n
**Ví dụ bạn có thể hỏi:**\n
- "Lịch hôm nay của tôi có gì?"\n
- "Thêm công việc: Gửi báo cáo vào 15h chiều mai"\n
- "Có sự kiện nào vào cuối tuần không?"\n
- "Gợi ý cách sắp xếp công việc hiệu quả"`;
        }
        resolve(response);
      }, 1000);
    });
  };

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 16px rgba(60,72,100,0.08)',
      padding: 24,
      minHeight: 420
    }}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: 16}}>
        <img src="https://i.imgur.com/vqZpK07.png" alt="AI" style={{width: 40, height: 40, borderRadius: 20, marginRight: 12}} />
        <h2 style={{fontWeight: 700, fontSize: 22, flex: 1}}>Trợ lý lịch trình</h2>
        <button
          onClick={() => handleSubmit()}
          disabled={isAiLoading}
          style={{
            background: '#6c63ff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '8px 18px',
            fontWeight: 600,
            cursor: isAiLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isAiLoading ? 'Đang xử lý...' : 'Gửi'}
        </button>
      </div>
      <div style={{background: '#f7f8fa', borderRadius: 12, padding: 16, minHeight: 120, marginBottom: 16}}>
        <div style={{display: 'flex', alignItems: 'flex-start'}}>
          <div style={{fontSize: 28, marginRight: 12}}>🤖</div>
          <div style={{flex: 1}}>
            {isAiLoading ? (
              <div style={{color: '#888'}}>Đang xử lý...</div>
            ) : aiAssistantResponse ? (
              <div className="markdown" dangerouslySetInnerHTML={{ __html: marked.parse(aiAssistantResponse) }} />
            ) : (
              <div style={{color: '#666'}}>
                Xin chào! Tôi là trợ lý thông minh của bạn.<br />
                Tôi có thể giúp bạn:
                <ul style={{margin: '8px 0 0 18px', padding: 0}}>
                  <li>Kiểm tra lịch trình, nhắc nhở công việc và sự kiện</li>
                  <li>Thêm công việc, sự kiện mới bằng văn bản hoặc giọng nói</li>
                  <li>Đồng bộ hóa với Google/Outlook Calendar</li>
                  <li>Đưa ra gợi ý tối ưu hóa thời gian, cân bằng công việc và nghỉ ngơi</li>
                  <li>Nhắc nhở các công việc sắp đến hạn, chống quên việc quan trọng</li>
                  <li>Gợi ý chống burnout, phân bổ thời gian hợp lý</li>
                </ul>
                <div style={{marginTop: 10, color: '#3fc8e0', fontWeight: 600}}>
                  <span style={{fontSize: 15}}>💡 Ví dụ:</span>
                  <ul style={{margin: '6px 0 0 18px', padding: 0}}>
                    <li>"Lịch hôm nay của tôi có gì?"</li>
                    <li>"Thêm công việc: Gửi báo cáo vào 15h chiều mai"</li>
                    <li>"Gợi ý cách sắp xếp công việc hiệu quả"</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div style={{display: 'flex', gap: 8, marginBottom: 16}}>
        <input
          type="text"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
          style={{
            flex: 1,
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 16
          }}
        />
        <button
          onClick={startListening}
          disabled={isListening}
          style={{
            background: isListening ? '#ede7f6' : '#6c63ff',
            color: isListening ? '#6c63ff' : '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '0 18px',
            fontWeight: 600,
            cursor: isListening ? 'not-allowed' : 'pointer'
          }}
        >
          {isListening ? '🎤 Đang nghe...' : '🎤'}
        </button>
      </div>
      <div style={{display: 'flex', gap: 8}}>
        <button onClick={() => handleSubmit('Thời tiết hôm nay thế nào?')} style={{background: '#e3f2fd', color: '#1976d2', border: 'none', borderRadius: 16, padding: '6px 16px', fontWeight: 500}}>🌤️ Thời tiết</button>
        <button onClick={() => handleSubmit('Kiểm tra lịch của tôi')} style={{background: '#ede7f6', color: '#6c63ff', border: 'none', borderRadius: 16, padding: '6px 16px', fontWeight: 500}}>📅 Lịch trình</button>
        <button onClick={() => handleSubmit('Công việc ưu tiên')} style={{background: '#e8f5e9', color: '#388e3c', border: 'none', borderRadius: 16, padding: '6px 16px', fontWeight: 500}}>📋 Công việc</button>
        <button onClick={() => handleSubmit('Tối ưu lịch trình giúp tôi')} style={{background: '#fff3e0', color: '#ed8936', border: 'none', borderRadius: 16, padding: '6px 16px', fontWeight: 500}}>⚡ Tối ưu</button>
        <button onClick={() => handleSubmit('Gợi ý cho tôi')} style={{background: '#fce4ec', color: '#d81b60', border: 'none', borderRadius: 16, padding: '6px 16px', fontWeight: 500}}>💡 Gợi ý</button>
      </div>
    </div>
  );
}

export default AIAssistant;