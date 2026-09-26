import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  RefreshCw,
  User,
  Shield,
  Clock,
  Radio,
} from 'lucide-react';
import {
  fetchCommunications,
  sendCommunication,
  subscribeToCommunications,
} from '../services/societyService';
import { DbCommunication, AuthSessionUser } from '../types/society';

interface CommProps {
  currentUser: AuthSessionUser | null;
}

export const CommunicationsDesk: React.FC<CommProps> = ({ currentUser }) => {
  const [messages, setMessages] = useState<DbCommunication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [textInput, setTextInput] = useState<string>('');
  const [messageType, setMessageType] = useState<string>('General');
  const [sending, setSending] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchCommunications();
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime channel for communications
    const channel = subscribeToCommunications((payload) => {
      console.log('Realtime communication event:', payload);
      loadData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    setSending(true);
    const newMsg: Omit<DbCommunication, 'communication_id'> = {
      sender_name: `${currentUser?.name || 'Resident'} (${currentUser?.role || 'User'})`,
      message: textInput.trim(),
      message_type: messageType,
      sent_at: new Date().toISOString(),
      status: 'Sent',
    };

    try {
      await sendCommunication(newMsg);
      setTextInput('');
      loadData();
    } catch (err) {
      console.error('Send error:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
      className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-[#212121]"
    >
      {/* 1. Header */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[12px] font-bold text-[#6A1B9A] uppercase tracking-wider px-2.5 py-0.5 bg-[#F3E5F5] rounded-[4px] border border-[#E1BEE7]">
              Supabase Table: `communications`
            </span>
          </div>
          <h1 className="text-[30px] font-bold text-[#4A148C] uppercase tracking-tight leading-tight">
            Instant Broadcast & Community Communications
          </h1>
          <p className="text-[15px] text-[#616161] font-normal">
            Real-time inter-resident, security control room, and administrative helpdesk channel
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2.5 rounded-[4px] text-[14px] font-bold bg-white hover:bg-[#FAF8FC] text-[#4A148C] border border-[#CE93D8] shadow-xs cursor-pointer flex items-center gap-2 uppercase"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Channel</span>
        </button>
      </div>

      {/* 2. Chat Feed Container */}
      <div className="bg-white border border-[#E1BEE7] rounded-[6px] shadow-xs overflow-hidden flex flex-col h-[520px]">
        {/* Chat Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#FAF8FC]">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#757575] text-[15px]">
              No messages posted in `communications` table yet. Send the first message below.
            </div>
          ) : (
            messages.map((m) => {
              const isCurrentUser = m.sender_name.startsWith(currentUser?.name || '###');
              return (
                <div
                  key={m.communication_id}
                  className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[12px] text-[#757575]">
                    <span className="font-bold text-[#4A148C]">{m.sender_name}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 bg-[#F3E5F5] text-[#6A1B9A] font-bold rounded-[2px] uppercase text-[10px]">
                      {m.message_type || 'General'}
                    </span>
                    <span>•</span>
                    <span>
                      {m.sent_at
                        ? new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Now'}
                    </span>
                  </div>

                  <div
                    className={`max-w-xl p-3 rounded-[6px] text-[15px] leading-relaxed shadow-2xs ${
                      isCurrentUser
                        ? 'bg-[#4A148C] text-white rounded-tr-none'
                        : 'bg-white border border-[#E1BEE7] text-[#212121] rounded-tl-none'
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E1BEE7] flex items-center gap-3">
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            className="p-2 bg-[#FAF8FC] border border-[#CE93D8] rounded-[4px] text-[13px] font-bold text-[#4A148C] outline-none"
          >
            <option value="General">General</option>
            <option value="Announcement">Announcement</option>
            <option value="Helpdesk">Helpdesk</option>
            <option value="Emergency">Emergency</option>
          </select>

          <input
            type="text"
            required
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message to broadcast to the community..."
            className="flex-1 p-2.5 bg-[#FAF8FC] border border-[#CE93D8] focus:border-[#4A148C] focus:bg-white rounded-[4px] text-[15px] text-[#212121] outline-none"
          />

          <button
            type="submit"
            disabled={sending}
            className="px-5 py-2.5 bg-[#4A148C] hover:bg-[#310C61] text-white text-[14px] font-bold uppercase rounded-[4px] cursor-pointer flex items-center gap-2 transition-colors disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
