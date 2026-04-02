import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  Send,
  Search,
  ArrowLeft,
  AlertTriangle,
  User,
  Check,
  CheckCheck,
  Users,
  X,
} from "lucide-react";
import { BASE_URL } from "../BaseUrl";
import io from "socket.io-client";

const getToken = () => {
  try {
    return JSON.parse(sessionStorage.getItem("accessToken") || '""');
  } catch {
    return sessionStorage.getItem("accessToken") || "";
  }
};

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
  "Content-Type": "application/json",
});

const SOCKET_URL = import.meta.env.VITE_BASE_URL?.replace("/api/v1", "") || "https://api.hiregenix.ai";

export default function Messaging() {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [warning, setWarning] = useState("");
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // New conversation (pending — no conversationId yet)
  const [pendingRecipient, setPendingRecipient] = useState(null);

  // Contacts panel state
  const [showContacts, setShowContacts] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsTotal, setContactsTotal] = useState(0);
  const [contactsPage, setContactsPage] = useState(1);
  const [contactsTotalPages, setContactsTotalPages] = useState(0);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [contactRole, setContactRole] = useState("");

  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const socketRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const getCurrentUserId = () => {
    try {
      const token = getToken();
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || payload.id;
    } catch {
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Socket.io
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket", "polling"] });

    socket.on("new_message", ({ conversationId, message }) => {
      if (activeConversation?.id === conversationId) {
        setMessages((prev) => [...prev, message]);
        fetch(`${BASE_URL}/messaging/conversations/${conversationId}/read`, { method: "POST", headers: authHeaders() });
      }
      fetchConversations();
    });

    socket.on("new_conversation", () => fetchConversations());
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (socketRef.current && activeConversation) {
      socketRef.current.emit("join_conversation", { conversationId: activeConversation.id });
    }
    return () => {
      if (socketRef.current && activeConversation) {
        socketRef.current.emit("leave_conversation", { conversationId: activeConversation.id });
      }
    };
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/messaging/conversations`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.result || []);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Fetch contacts
  const fetchContacts = useCallback(async (search = contactSearch, role = contactRole, page = 1) => {
    setContactsLoading(true);
    try {
      let url = `${BASE_URL}/messaging/contacts?page=${page}&limit=50`;
      if (search.trim()) url += `&q=${encodeURIComponent(search)}`;
      if (role) url += `&role=${role}`;
      const res = await fetch(url, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.result || []);
        setContactsTotal(data.total || 0);
        setContactsPage(data.page || 1);
        setContactsTotalPages(data.totalPages || 0);
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
    } finally {
      setContactsLoading(false);
    }
  }, [contactSearch, contactRole]);

  useEffect(() => {
    if (showContacts) fetchContacts("", contactRole, 1);
  }, [showContacts]);

  const handleContactSearch = (q) => {
    setContactSearch(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => fetchContacts(q, contactRole, 1), 300);
  };

  const handleRoleFilter = (role) => {
    setContactRole(role);
    fetchContacts(contactSearch, role, 1);
  };

  const fetchMessages = async (conversationId) => {
    try {
      const res = await fetch(`${BASE_URL}/messaging/conversations/${conversationId}/messages`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.result || []);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const openConversation = (conv) => {
    setPendingRecipient(null);
    setActiveConversation(conv);
    setMobileShowChat(true);
    setShowContacts(false);
    fetchMessages(conv.id);
    setWarning("");
    setMessageText("");
  };

  // Click a contact -> open chat area in "new conversation" mode
  const openNewChat = (user) => {
    // Check if we already have a conversation with this user
    const existing = conversations.find((c) => c.otherUser?.id === user.id);
    if (existing) {
      openConversation(existing);
      return;
    }
    // Open pending chat
    setPendingRecipient(user);
    setActiveConversation(null);
    setMessages([]);
    setMobileShowChat(true);
    setShowContacts(false);
    setWarning("");
    setMessageText("");
    setTimeout(() => messageInputRef.current?.focus(), 100);
  };

  // Send message — either in existing conversation or start new one
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sendingMessage) return;
    if (!activeConversation && !pendingRecipient) return;

    setSendingMessage(true);
    setWarning("");

    try {
      if (pendingRecipient) {
        // Start new conversation
        const res = await fetch(`${BASE_URL}/messaging/conversations`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ recipientId: pendingRecipient.id, body: messageText }),
        });
        const data = await res.json();
        if (res.ok) {
          const convId = data.result.conversation.id;
          setMessages([data.result.message]);
          setActiveConversation({ id: convId, otherUser: pendingRecipient });
          setPendingRecipient(null);
          setMessageText("");
          if (data.contactInfoStripped) setWarning(data.warning);
          fetchConversations();
        } else {
          setWarning(data.message || "Failed to start conversation");
        }
      } else {
        // Send in existing conversation
        const res = await fetch(`${BASE_URL}/messaging/conversations/${activeConversation.id}/messages`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ body: messageText }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessages((prev) => [...prev, data.result]);
          setMessageText("");
          if (data.contactInfoStripped) setWarning(data.warning);
          fetchConversations();
        } else {
          setWarning(data.message || "Failed to send message");
        }
      }
    } catch (err) {
      setWarning("Network error. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "JOB_SEEKER": return "Job Seeker";
      case "RECRUITER": return "Recruiter";
      case "ADMIN": return "Admin";
      default: return role;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "JOB_SEEKER": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "RECRUITER": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
      case "ADMIN": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // The "other user" for the chat header — either from active conversation or pending recipient
  const chatUser = activeConversation?.otherUser || pendingRecipient;
  const isChatOpen = activeConversation || pendingRecipient;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
      {/* Sidebar */}
      <div className={`${mobileShowChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-gray-200 dark:border-gray-800`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-500" />
              Messages
            </h2>
            <button
              onClick={() => setShowContacts(!showContacts)}
              className={`p-2 rounded-xl transition-colors ${showContacts ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" : "bg-teal-500 text-white hover:bg-teal-600"}`}
              title={showContacts ? "Back to conversations" : "Browse contacts"}
            >
              {showContacts ? <X className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </button>
          </div>

          {showContacts && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[
                  { label: "All", value: "" },
                  { label: "Job Seekers", value: "JOB_SEEKER" },
                  { label: "Recruiters", value: "RECRUITER" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleRoleFilter(opt.value)}
                    className={`text-xs px-3 py-1 rounded-lg transition-colors ${contactRole === opt.value ? "bg-teal-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={contactSearch}
                  onChange={(e) => handleContactSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-400 px-1">{contactsTotal} contact{contactsTotal !== 1 ? "s" : ""} found</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {showContacts ? (
            contactsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6 text-center">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No contacts found</p>
                <p className="text-xs mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              <>
                {contacts.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openNewChat(user)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(user.role)}`}>{getRoleLabel(user.role)}</span>
                  </button>
                ))}
                {contactsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-3 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={() => { setContactsPage(contactsPage - 1); fetchContacts(contactSearch, contactRole, contactsPage - 1); }} disabled={contactsPage <= 1} className="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30">Prev</button>
                    <span className="text-xs text-gray-500">{contactsPage} / {contactsTotalPages}</span>
                    <button onClick={() => { setContactsPage(contactsPage + 1); fetchContacts(contactSearch, contactRole, contactsPage + 1); }} disabled={contactsPage >= contactsTotalPages} className="text-xs px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30">Next</button>
                  </div>
                )}
              </>
            )
          ) : (
            loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 px-6 text-center">
                <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs mt-1">Click the contacts button to browse and message users</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left border-b border-gray-100 dark:border-gray-800 ${activeConversation?.id === conv.id ? "bg-teal-50 dark:bg-teal-900/10 border-l-4 border-l-teal-500" : ""}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                      {conv.otherUser?.firstName?.[0]}{conv.otherUser?.lastName?.[0]}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-teal-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{conv.unreadCount > 9 ? "9+" : conv.unreadCount}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{conv.otherUser?.firstName} {conv.otherUser?.lastName}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{formatTime(conv.lastMessageAt)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessageText || "No messages yet"}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${getRoleBadgeColor(conv.otherUser?.role)}`}>{getRoleLabel(conv.otherUser?.role)}</span>
                    </div>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${mobileShowChat ? "flex" : "hidden md:flex"} flex-col flex-1`}>
        {isChatOpen ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <button onClick={() => { setMobileShowChat(false); setActiveConversation(null); setPendingRecipient(null); }} className="md:hidden p-1 text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-amber-500 flex items-center justify-center text-white font-semibold text-sm">
                {chatUser?.firstName?.[0]}{chatUser?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{chatUser?.firstName} {chatUser?.lastName}</p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor(chatUser?.role)}`}>{getRoleLabel(chatUser?.role)}</span>
                  {pendingRecipient && <span className="text-xs text-gray-400">New conversation</span>}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
              {messages.length === 0 && pendingRecipient && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-amber-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                    {chatUser?.firstName?.[0]}{chatUser?.lastName?.[0]}
                  </div>
                  <p className="text-base font-medium text-gray-600 dark:text-gray-300">{chatUser?.firstName} {chatUser?.lastName}</p>
                  <p className="text-xs text-gray-400 mt-1">{chatUser?.email}</p>
                  <p className="text-sm text-gray-400 mt-4">Send a message to start the conversation</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId || msg.sender?.id === currentUserId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-teal-500 text-white rounded-br-md" : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md shadow-sm"}`}>
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMine ? "text-white/70 justify-end" : "text-gray-400"}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isMine && (msg.isRead ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                      </div>
                      {msg.contactInfoStripped && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-200">
                          <AlertTriangle className="w-3 h-3" /> Contact info removed
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Warning */}
            {warning && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{warning}</p>
                <button onClick={() => setWarning("")} className="text-amber-500 hover:text-amber-700 ml-auto text-xs">Dismiss</button>
              </div>
            )}

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={pendingRecipient ? `Message ${chatUser?.firstName}...` : "Type a message..."}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400"
                  disabled={sendingMessage}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!messageText.trim() || sendingMessage}
                  className="p-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 px-6">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">Choose from existing conversations or browse contacts to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
