import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, LogOut, Sun, Moon, Bot } from 'lucide-react';
import API from '../services/api';

const ChatPage = ({ theme, toggleTheme }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState('');
    const [sendError, setSendError] = useState('');
    const [historyRetry, setHistoryRetry] = useState(0);
    const chatBoxRef = useRef(null);
    const navigate = useNavigate();

    // Load chat history
    useEffect(() => {
        const controller = new AbortController();
        const loadHistory = async () => {
            try {
                const response = await API.get('/chat/history', { signal: controller.signal });
                const history = Array.isArray(response.data) ? response.data : [];
                setMessages(
                    history.filter(
                        (message) =>
                            message &&
                            (message.sender === 'user' || message.sender === 'bot') &&
                            typeof message.message === 'string'
                    )
                );
                setHistoryError('');
            } catch (error) {
                if (controller.signal.aborted) return;
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login', { replace: true });
                    return;
                }
                setHistoryError('Could not load your chat history. Please try again.');
                console.error('Failed to load chat history:', error);
            } finally {
                if (!controller.signal.aborted) {
                    setHistoryLoading(false);
                }
            }
        };

        void loadHistory();
        return () => controller.abort();
    }, [historyRetry, navigate]);

    // Smooth scroll to bottom on new messages
    useEffect(() => {
        chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    // Send message
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || loading) return;

        const userText = inputMessage;
        setInputMessage('');
        setSendError(''); // Reset any previous send errors

        const tempUserMsg = { id: Date.now(), sender: 'user', message: userText };
        setMessages((prev) => [...prev, tempUserMsg]);
        setLoading(true);

        try {
            const response = await API.post('/chat/send', { message: userText });

            if (response.data && response.data.message) {
                // Safe formatting if backend skips sending "sender" or "id" fields
                const botMsg = {
                    id: response.data.id || Date.now() + 1,
                    sender: response.data.sender || 'bot',
                    message: response.data.message,
                };
                setMessages((prev) => [...prev, botMsg]);
            }
        } catch (err) {
            console.error("API Error Details:", err);
            const errMsg = err.response?.data?.detail || "Network ya API error aayi hai.";
            setSendError(errMsg);
            alert(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    const retryHistory = () => {
        setHistoryError('');
        setHistoryLoading(true);
        setHistoryRetry((attempt) => attempt + 1);
    };

    return (
        <div className="chat-layout">
            <header className="chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bot size={28} color="var(--accent-color)" aria-hidden="true" />
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Tech Assistant Chatbot</h3>
                        <span style={{ fontSize: '12px', color: '#22c55e' }}>● Specialized Guardrails Active</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={toggleTheme}
                        title="Toggle Theme"
                        aria-label="Toggle theme"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button
                        type="button"
                        className="icon-btn"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <LogOut size={20} color="#ef4444" />
                    </button>
                </div>
            </header>

            <div className="chat-box" ref={chatBoxRef} aria-live="polite">
                {historyLoading && <p role="status">Loading chat history...</p>}
                {historyError && (
                    <div role="alert">
                        <p>{historyError}</p>
                        <button type="button" onClick={retryHistory}>Retry</button>
                    </div>
                )}
                {!historyLoading && !historyError && messages.length === 0 && (
                    <p>Start a conversation by sending a message.</p>
                )}
                {messages.map((message) => (
                    <div key={message.id} className={`message-bubble ${message.sender}`}>
                        {message.message}
                    </div>
                ))}
                {loading && (
                    <div className="message-bubble bot" role="status" style={{ fontStyle: 'italic', opacity: 0.7 }}>
                        Thinking...
                    </div>
                )}
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className="form-input"
                    style={{ borderRadius: '24px', padding: '12px 20px' }}
                    placeholder="Chat with jaadzen for programming and development concepts..."
                    value={inputMessage}
                    onChange={(event) => setInputMessage(event.target.value)}
                    aria-label="Message"
                    disabled={historyLoading || Boolean(historyError)}
                />
                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: 'auto', borderRadius: '50%', padding: '12px', marginTop: 0 }}
                    disabled={loading || historyLoading || Boolean(historyError) || !inputMessage.trim()}
                    aria-label="Send message"
                    title="Send message"
                >
                    <Send size={18} aria-hidden="true" />
                </button>
            </form>
            {sendError && <p role="alert" style={{ padding: '0 24px 12px', color: '#ef4444' }}>{sendError}</p>}
        </div>
    );
};

export default ChatPage;
