import React, { useState, useEffect, useRef } from 'react'; 
import { FaComments, FaTimes, FaPaperPlane } from 'react-icons/fa';
import chatbotService from '../../services/chatbot';
import ReactMarkdown from "react-markdown";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hello! 👋 I'm your vehicle finance assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => scrollToBottom(), [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await chatbotService.sendMessage(inputMessage);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { type: 'bot', text: response.response, timestamp: new Date() },
        ]);
        setIsTyping(false);
      }, 500);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: 'Sorry, an error occurred.', timestamp: new Date() },
      ]);
      setIsTyping(false);
    }
  };

  const quickQuestions = [
    'What documents do I need?',
    'Calculate EMI',
    'Loan eligibility',
    'Interest rates',
  ];

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50"
        >
          <FaComments className="text-2xl" />
        </button>
      )}

      {isOpen && (
        <div
          className="
            fixed bottom-4 right-4
            w-[min(380px,90vw)]
            max-h-[calc(100vh-2rem)]
            h-[min(600px,calc(100vh-2rem))]
            bg-white/80 backdrop-blur-md
            rounded-xl shadow-2xl
            flex flex-col
            z-50
            animate-slide-in-up
          "
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-xl flex justify-between">
            <span className="font-semibold flex items-center gap-2">
              <FaComments /> Vehicle Finance Assistant
            </span>
            <button onClick={() => setIsOpen(false)}>
              <FaTimes />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] p-3 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none'
                      : 'bg-white shadow rounded-bl-none'
                  }`}
                >
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="p-3 border-t bg-white/90">
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInputMessage(q)}
                    className="text-xs px-3 py-1 rounded-full bg-blue-100 hover:bg-blue-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white">
            <div className="flex gap-2">
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="Type your message..."
              />
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 rounded-lg">
                <FaPaperPlane />
              </button>
            </div>
          </form>
        </div>
      )}

      <style>
        {`
          @keyframes slide-in-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-slide-in-up {
            animation: slide-in-up 0.4s ease-out;
          }
        `}
      </style>
    </>
  );
};

export default ChatWidget;
