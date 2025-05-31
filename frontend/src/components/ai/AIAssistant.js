import React, { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/aiService';
import './AIAssistant.css';

const AiAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load previous interactions
    const loadInteractions = async () => {
      try {
        const interactions = await aiService.getInteractions();
        // Reverse the interactions array to show oldest first
        const formattedMessages = interactions.reverse().map(interaction => [
          { type: 'user', content: interaction.request_data },
          { type: 'assistant', content: interaction.ai_response }
        ]).flat();
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading interactions:', error);
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

      // Check and parse if it's JSON inside a code block
      if (typeof parsedResponse === 'string') {
        const codeBlockMatch = parsedResponse.match(/```(?:json)?\n([\s\S]*?)```/i);
        if (codeBlockMatch) {
          parsedResponse = codeBlockMatch[1]; // extract inner JSON string
        }

        try {
          parsedResponse = JSON.parse(parsedResponse);
        } catch (jsonError) {
          console.error('JSON parsing failed:', jsonError);
          // If parsing fails, treat the original string as plain text
          setMessages(prev => [...prev, { 
            type: 'assistant', 
            content: response.ai_response 
          }]);
          return;
        }
      }

      // Format the response for display
      let formattedResponse = '';
      
      // Add analysis
      if (parsedResponse.analysis) {
        formattedResponse += `📊 Analysis:\n${parsedResponse.analysis}\n\n`;
      }
      
      // Add suggestions if any
      if (parsedResponse.suggestions && parsedResponse.suggestions.length > 0) {
        formattedResponse += `💡 Suggestions:\n${parsedResponse.suggestions.map((suggestion, index) => 
          `${index + 1}. ${suggestion}`
        ).join('\n')}\n\n`;
      }
      
      // Add schedule changes if any
      if (parsedResponse.new_schedule) {
        formattedResponse += `📅 Proposed Schedule Changes:\n`;
        Object.entries(parsedResponse.new_schedule).forEach(([date, schedule]) => {
          formattedResponse += `\nDate: ${date}\n`;
          
          if (schedule.tasks && schedule.tasks.length > 0) {
            formattedResponse += '\nTasks:\n';
            schedule.tasks.forEach(task => {
              formattedResponse += `• ${task.name} (${task.start_time} - ${task.end_time})\n`;
            });
          }
          
          if (schedule.events && schedule.events.length > 0) {
            formattedResponse += '\nEvents:\n';
            schedule.events.forEach(event => {
              formattedResponse += `• ${event.title} (${event.start_time} - ${event.end_time})\n`;
            });
          }
        });
      }

      // Display formatted response
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: formattedResponse.trim()
      }]);

      // Set suggestions for schedule updates if available
      if (parsedResponse.is_busy && parsedResponse.new_schedule) {
        setSuggestions(parsedResponse.new_schedule);
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Sorry, an error occurred while processing your request. Please try again.' 
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
        content: 'Schedule updated successfully!' 
      }]);
      setSuggestions(null);
    } catch (error) {
      setMessages(prev => [...prev, { 
        type: 'error', 
        content: 'Unable to update schedule. Please try again.' 
      }]);
    }
  };

  const handleDeclineSuggestion = () => {
    setMessages(prev => [...prev, { 
      type: 'assistant', 
      content: 'Schedule changes have been declined. Let me know if you need any further assistance!' 
    }]);
    setSuggestions(null);
  };

  return (
    <div className="ai-assistant">
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          {suggestions && (
            <div className="suggestions-container">
              <div className="suggestions-header">Proposed Schedule</div>
              <div className="suggestions-actions">
                <button 
                  className="accept-button"
                  onClick={handleAcceptSuggestion}
                >
                  Accept Changes
                </button>
                <button 
                  className="decline-button"
                  onClick={handleDeclineSuggestion}
                >
                  Decline Changes
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your schedule..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;