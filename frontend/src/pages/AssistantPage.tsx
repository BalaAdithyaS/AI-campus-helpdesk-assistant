import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Send,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Compass,
  Clock,
  CalendarCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Building2
} from 'lucide-react';
import { ChatMessage, SourceCitation as SourceCitationType, HealthStatus } from '../types';
import { sendChatMessage, sendFeedback, ChatContextPayload } from '../api/client';
import { SourceCitation } from '../components/SourceCitation';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorBanner } from '../components/ErrorBanner';
import { RetrievalDiagnostics } from '../components/RetrievalDiagnostics';

interface ContextType {
  health: HealthStatus | null;
  backendError: boolean;
  onRetryBackend: () => void;
}

export const AssistantPage: React.FC = () => {
  const { health, backendError, onRetryBackend } = useOutletContext<ContextType>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<Record<string, 'up' | 'down'>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend !== undefined ? textToSend : inputValue).trim();
    if (!query || isLoading) return;

    setErrorMessage(null);
    const userMessageId = `msg_${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'student',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Build context turns from previous messages
    const contextPayload: ChatContextPayload[] = messages.slice(-4).map((m) => ({
      role: m.sender,
      text: m.text,
      source_ids: m.sources?.map((s) => s.id)
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(query, contextPayload);
      const assistantMessage: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: response.status,
        sources: response.sources,
        evidence_strength: response.evidence_strength,
        needs_clarification: response.needs_clarification,
        execution_time_ms: response.execution_time_ms,
        diagnostics: response.diagnostics
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to communicate with helpdesk assistant backend.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = async (messageId: string, helpful: boolean, query: string, answer: string) => {
    try {
      await sendFeedback(query, answer, helpful);
      setFeedbackSent((prev) => ({ ...prev, [messageId]: helpful ? 'up' : 'down' }));
    } catch {
      // Non-blocking
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setConfirmClearOpen(false);
    setErrorMessage(null);
  };

  const suggestions = [
    {
      title: 'Find a classroom',
      query: 'Where can I find lecture hall TT 305 in Technology Tower?',
      icon: Compass
    },
    {
      title: 'Campus facilities',
      query: 'How can I find information about campus facilities?',
      icon: Building2
    },
    {
      title: 'Laboratory timings',
      query: 'What are the operating hours for the computing lab?',
      icon: Clock
    },
    {
      title: 'Event registration',
      query: 'How do I register for an event?',
      icon: CalendarCheck
    }
  ];

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#090D16] transition-colors duration-200">
      {/* Backend Offline Notification */}
      {backendError && (
        <div className="px-4 md:px-8 pt-3">
          <ErrorBanner
            title="Backend Service Offline"
            message="Cannot reach FastAPI backend at http://127.0.0.1:8000. Start backend using `python -m uvicorn backend.app.main:app --reload` to chat."
            onRetry={onRetryBackend}
          />
        </div>
      )}

      {/* Chat Messages Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Area (Visible when empty) */}
          {messages.length === 0 ? (
            <div className="py-8 md:py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-700/10 dark:bg-blue-600/20 text-blue-800 dark:text-blue-300 flex items-center justify-center mx-auto mb-4 border border-blue-200 dark:border-blue-800/80 shadow-xs">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight font-serif">
                How can we help you navigate campus?
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Ask about classroom locations, lab timings, event registration, and documented university procedures.
              </p>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 max-w-xl mx-auto text-left">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xs transition-all group flex items-start gap-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 group-hover:bg-blue-700 group-hover:text-white dark:group-hover:bg-blue-600 transition-colors">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-900 dark:group-hover:text-white">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {item.query}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Top Action Bar when messages exist */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span>Active Conversation</span>
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Clear conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear conversation</span>
                </button>
              </div>

              {/* Message List */}
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
                >
                  {/* Sender & Timestamp Header */}
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 dark:text-slate-500 px-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      {msg.sender === 'student' ? 'You (Student)' : 'CampusIQ Assistant'}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.execution_time_ms !== undefined && (
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                        ({msg.execution_time_ms}ms)
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.sender === 'student'
                        ? 'bg-blue-700 dark:bg-blue-600 text-white shadow-xs rounded-tr-xs'
                        : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xs rounded-tl-xs'
                    }`}
                  >
                    {/* Status & Evidence Header for Assistant */}
                    {msg.sender === 'assistant' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          {msg.status && <StatusBadge status={msg.status} />}
                          {msg.evidence_strength && (
                            <EvidenceBadge
                              strength={msg.evidence_strength}
                              score={msg.sources?.[0]?.relevance_score}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Answer Text */}
                    <div className="whitespace-pre-line text-[13.5px] leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Sources Section */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          <span>Retrieved Evidence ({msg.sources.length})</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.sources.map((cit) => (
                            <SourceCitation
                              key={cit.id}
                              citation={cit}
                              onViewInKnowledgeBase={(id) => navigate(`/knowledge?query=${encodeURIComponent(id)}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Retrieval Diagnostics Section */}
                    {msg.diagnostics && (
                      <RetrievalDiagnostics 
                        diagnostics={msg.diagnostics} 
                        executionTimeMs={msg.execution_time_ms}
                      />
                    )}

                    {/* Feedback Controls for Assistant */}
                    {msg.sender === 'assistant' && (
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                        <span className="text-[11px]">Was this response helpful?</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const studentQuery = messages[index - 1]?.text || '';
                              handleFeedback(msg.id, true, studentQuery, msg.text);
                            }}
                            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                              feedbackSent[msg.id] === 'up'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title="Helpful"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const studentQuery = messages[index - 1]?.text || '';
                              handleFeedback(msg.id, false, studentQuery, msg.text);
                            }}
                            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                              feedbackSent[msg.id] === 'down'
                                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title="Not helpful"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Assistant Loading State */}
              {isLoading && (
                <div className="flex flex-col items-start">
                  <div className="max-w-md rounded-2xl p-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs">
                    <LoadingIndicator message="Retrieving documented campus evidence..." />
                  </div>
                </div>
              )}

              {/* Local Error State */}
              {errorMessage && (
                <ErrorBanner
                  title="Retrieval Error"
                  message={errorMessage}
                  onRetry={() => handleSendMessage()}
                />
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Box Area */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] p-4 md:px-8 shrink-0 transition-colors">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] focus-within:border-blue-700 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-950 transition-all shadow-xs"
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a campus question (e.g., lecture hall TT 305, computing lab hours, how to enrol for events)..."
              rows={2}
              className="w-full resize-none p-3.5 pr-14 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none bg-transparent"
              disabled={isLoading || backendError}
            />
            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-2">
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading || backendError}
                className="p-2 rounded-lg bg-blue-700 dark:bg-blue-600 text-white hover:bg-blue-800 dark:hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-700 transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Input Footer Note */}
          <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-slate-500">
            Responses are based on the available knowledge base. Verify important information with the relevant university office.
          </div>
        </div>
      </div>

      {/* Confirm Clear Modal */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Clear Conversation?</h3>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will remove all current messages from the screen. Your query history is not permanently recorded.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setConfirmClearOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChat}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
