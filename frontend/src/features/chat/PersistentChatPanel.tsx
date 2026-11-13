import React, { useEffect, useState, useRef } from 'react';
import {
  MessageSquare,
  X,
  Phone,
  Video,
  Search,
  ChevronLeft,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { CallModal } from './CallModal';
import { WHATSAPP_DARK_BG_STYLE } from './whatsappWallpaper';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const PersistentChatPanel: React.FC = () => {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    isDrawerOpen,
    unreadTotal,
    fetchConversations,
    selectConversation,
    sendMessage,
    toggleDrawer,
    startCall,
  } = useChatStore();

  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      fetchConversations();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const activeConv = conversations.find((c) => c.conversationId === activeConversationId);
  const activeMsgs = activeConversationId ? messages[activeConversationId] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMsgs]);

  const filteredConversations = conversations.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.vendorBusinessName.toLowerCase().includes(q) ||
      c.consumerName.toLowerCase().includes(q) ||
      (c.productTitle && c.productTitle.toLowerCase().includes(q))
    );
  });

  const handlePayRequest = (amount: number, orderId?: string) => {
    navigate('/shop/checkout', { state: { directPaymentAmount: amount, orderId } });
    toggleDrawer(false);
  };

  return (
    <>
      {/* WhatsApp Floating Toggle Button */}
      {!isDrawerOpen && (
        <button
          onClick={() => toggleDrawer(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#00a884] hover:bg-[#029676] px-4 py-2.5 text-[#111b21] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs font-bold"
        >
          <div className="relative">
            <MessageSquare className="h-4 w-4 fill-current" />
            {unreadTotal > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
                {unreadTotal}
              </span>
            )}
          </div>
          <span>WhatsApp Chat</span>
        </button>
      )}

      {/* WhatsApp Style Persistent Right-Side Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-[#111b21] shadow-2xl border-l border-[#222d34] transition-transform duration-300 ease-in-out',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* WhatsApp Top Header Bar (#202c33) */}
        <div className="flex items-center justify-between border-b border-[#222d34] px-3.5 py-3 bg-[#202c33] text-[#e9edef]">
          <div className="flex items-center gap-2 min-w-0">
            {activeConversationId && (
              <button
                onClick={() => useChatStore.setState({ activeConversationId: null })}
                className="rounded-full p-1 text-[#aebac1] hover:text-white hover:bg-[#2a3942] transition-colors"
                title="Back to Chats"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {activeConv ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={
                      user?.role === 'vendor'
                        ? activeConv.consumerAvatar ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                        : 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80'
                    }
                    alt="avatar"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00a884] ring-2 ring-[#202c33]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#e9edef] leading-tight truncate">
                    {user?.role === 'vendor' ? activeConv.consumerName : activeConv.vendorBusinessName}
                  </h4>
                  <p className="text-[11px] text-[#00a884] font-medium leading-tight mt-0.5">
                    online
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#e9edef] text-base">
                  Chats
                </h3>
              </div>
            )}
          </div>

          {/* Right Action Icons in WhatsApp #aebac1 */}
          <div className="flex items-center gap-1 text-[#aebac1]">
            {activeConv && (
              <>
                <button
                  onClick={() =>
                    startCall(
                      user?.role === 'vendor' ? activeConv.consumerName : activeConv.vendorBusinessName,
                      undefined,
                      false
                    )
                  }
                  className="rounded-full p-2 hover:text-white hover:bg-[#2a3942] transition-colors"
                  title="Voice Call"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    startCall(
                      user?.role === 'vendor' ? activeConv.consumerName : activeConv.vendorBusinessName,
                      undefined,
                      true
                    )
                  }
                  className="rounded-full p-2 hover:text-white hover:bg-[#2a3942] transition-colors"
                  title="Video Call"
                >
                  <Video className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={() => toggleDrawer(false)}
              className="rounded-full p-2 hover:text-white hover:bg-[#2a3942] transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        {activeConversationId ? (
          /* Active Chat View with Authentic WhatsApp Doodle Wallpaper */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Linked Product Bar */}
            {activeConv?.productTitle && (
              <div className="flex items-center justify-between border-b border-[#222d34] bg-[#182229] px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2 truncate text-[#d1d7db]">
                  {activeConv.productImage && (
                    <img src={activeConv.productImage} alt="" className="h-7 w-7 rounded object-cover" />
                  )}
                  <span className="truncate font-medium">{activeConv.productTitle}</span>
                </div>
                {activeConv.productId && (
                  <button
                    onClick={() => {
                      navigate(`/shop/products/${activeConv.productId}`);
                      toggleDrawer(false);
                    }}
                    className="flex items-center gap-1 font-bold text-[#53bdeb] hover:underline shrink-0 text-[11px] ml-2"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Messages Scroll Area with WhatsApp Dark Doodle Wallpaper */}
            <div
              style={WHATSAPP_DARK_BG_STYLE}
              className="flex-1 overflow-y-auto p-4 space-y-1"
            >
              {/* WhatsApp Security Encryption Pill */}
              <div className="text-center my-2">
                <span className="inline-block rounded-md bg-[#182229]/90 border border-[#222d34] px-3 py-1 text-[11px] text-[#8696a0] shadow-xs">
                  🔒 Messages are protected with end-to-end Nexconn signaling
                </span>
              </div>

              {activeMsgs.length === 0 ? (
                <div className="flex h-3/4 flex-col items-center justify-center text-center p-6 text-[#8696a0]">
                  <MessageSquare className="h-10 w-10 text-[#00a884] mb-2 opacity-60" />
                  <p className="text-sm font-semibold text-[#e9edef]">Start chatting with the seller</p>
                  <p className="text-xs text-[#8696a0] mt-1">
                    Ask about sizing, technical specs, discounts, or delivery times.
                  </p>
                </div>
              ) : (
                activeMsgs.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isMe={m.senderId === user?.uid}
                    onPayRequest={handlePayRequest}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* WhatsApp Composer */}
            <MessageComposer onSendMessage={sendMessage} />
          </div>
        ) : (
          /* WhatsApp Conversations List View */
          <div className="flex flex-1 flex-col overflow-hidden bg-[#111b21]">
            {/* WhatsApp Search Bar */}
            <div className="p-2.5 border-b border-[#222d34] bg-[#111b21]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8696a0]" />
                <input
                  type="text"
                  placeholder="Search or start new chat"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg bg-[#202c33] pl-9 pr-3 py-1.5 text-xs text-[#d1d7db] placeholder:text-[#8696a0] border-none focus:outline-none"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#222d34]">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[#8696a0]">
                  <MessageSquare className="h-10 w-10 mx-auto text-[#00a884] mb-2 opacity-60" />
                  <p className="text-sm font-bold text-[#e9edef]">No chats yet</p>
                  <p className="text-xs text-[#8696a0] mt-1">
                    Click "Message Seller" on any product card to start a conversation!
                  </p>
                </div>
              ) : (
                filteredConversations.map((c) => {
                  const unread = user ? c.unreadCount[user.uid] || 0 : 0;
                  return (
                    <button
                      key={c.conversationId}
                      onClick={() => selectConversation(c.conversationId)}
                      className="flex w-full items-center gap-3 p-3.5 text-left bg-[#111b21] hover:bg-[#202c33] transition-colors"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={
                            user?.role === 'vendor'
                              ? c.consumerAvatar ||
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                              : 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&auto=format&fit=crop&q=80'
                          }
                          alt=""
                          className="h-11 w-11 rounded-full object-cover"
                        />
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#00a884] ring-2 ring-[#111b21]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#e9edef] truncate">
                            {user?.role === 'vendor' ? c.consumerName : c.vendorBusinessName}
                          </h4>
                          {c.lastMessage && (
                            <span className="text-[11px] text-[#8696a0]">
                              {new Date(c.lastMessage.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        {c.productTitle && (
                          <p className="text-[11px] font-semibold text-[#00a884] truncate mt-0.5">
                            {c.productTitle}
                          </p>
                        )}

                        <p className="text-xs text-[#8696a0] truncate mt-0.5">
                          {c.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#00a884] text-[10px] font-bold text-[#111b21] shrink-0">
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Nexconn Call Modal */}
      <CallModal />
    </>
  );
};
