import { create } from 'zustand';
import { Conversation, Message, MessageType } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { nexconnClient } from '../lib/nexconnClient';

interface CallState {
  isActive: boolean;
  isVideo: boolean;
  callId: string;
  targetName: string;
  targetAvatar?: string;
  status: 'calling' | 'connected' | 'ended';
  isMuted: boolean;
  isCameraOff: boolean;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId -> Message[]
  isDrawerOpen: boolean;
  isLoading: boolean;
  unreadTotal: number;
  activeCall: CallState | null;

  fetchConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  startConversationWithVendor: (vendorId: string, productId?: string, orderId?: string) => Promise<string>;
  sendMessage: (text: string, type?: MessageType, mediaUrl?: string, metadata?: any) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  toggleDrawer: (open?: boolean) => void;
  startCall: (targetName: string, targetAvatar?: string, isVideo?: boolean) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isDrawerOpen: false,
  isLoading: false,
  unreadTotal: 0,
  activeCall: null,

  fetchConversations: async () => {
    try {
      const list = await apiRequest<Conversation[]>('/conversations');
      const unread = list.reduce((acc, c) => {
        const myUid = localStorage.getItem('convocart_auth_token') ? '' : '';
        const counts = Object.values(c.unreadCount || {});
        return acc + (counts[0] || 0);
      }, 0);
      set({ conversations: list, unreadTotal: unread });
    } catch {
      // not logged in yet
    }
  },

  selectConversation: async (conversationId: string) => {
    set({ activeConversationId: conversationId, isDrawerOpen: true });
    try {
      const msgs = await apiRequest<Message[]>(`/conversations/${conversationId}/messages`);
      set((state) => ({
        messages: { ...state.messages, [conversationId]: msgs },
      }));
      get().markAsRead(conversationId);
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    }
  },

  startConversationWithVendor: async (vendorId: string, productId?: string, orderId?: string) => {
    try {
      const conv = await apiRequest<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ vendorId, productId, orderId }),
      });
      await get().fetchConversations();
      await get().selectConversation(conv.conversationId);
      return conv.conversationId;
    } catch (err) {
      console.error('[Chat] Start conversation error:', err);
      throw err;
    }
  },

  sendMessage: async (text: string, type: MessageType = 'text', mediaUrl?: string, metadata?: any) => {
    const convId = get().activeConversationId;
    if (!convId) return;

    try {
      const res = await apiRequest<{ sentMessage: Message; aiReply?: Message }>(
        `/conversations/${convId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({ text, type, mediaUrl, metadata }),
        }
      );

      const activeMsgs = get().messages[convId] || [];
      const updated = [...activeMsgs, res.sentMessage];
      if (res.aiReply) {
        updated.push(res.aiReply);
      }

      set((state) => ({
        messages: { ...state.messages, [convId]: updated },
      }));

      // Call Nexconn SDK direct channel dispatch
      const currentConv = get().conversations.find((c) => c.conversationId === convId);
      if (currentConv) {
        nexconnClient.sendDirectMessage(currentConv.vendorId, text);
      }

      get().fetchConversations();
    } catch (err) {
      console.error('[Chat] Send message failed:', err);
    }
  },

  markAsRead: async (conversationId: string) => {
    try {
      await apiRequest(`/conversations/${conversationId}/read`, { method: 'PATCH' });
      get().fetchConversations();
    } catch {
      // ignore
    }
  },

  toggleDrawer: (open) => {
    set((state) => ({
      isDrawerOpen: open !== undefined ? open : !state.isDrawerOpen,
    }));
  },

  startCall: (targetName: string, targetAvatar?: string, isVideo: boolean = false) => {
    set({
      activeCall: {
        isActive: true,
        isVideo,
        callId: `call_${Date.now()}`,
        targetName,
        targetAvatar,
        status: 'calling',
        isMuted: false,
        isCameraOff: false,
      },
    });

    // Simulate connection after ring
    setTimeout(() => {
      set((state) => {
        if (state.activeCall && state.activeCall.status === 'calling') {
          return { activeCall: { ...state.activeCall, status: 'connected' } };
        }
        return state;
      });
    }, 2500);
  },

  endCall: () => {
    set((state) => {
      if (!state.activeCall) return { activeCall: null };
      return {
        activeCall: { ...state.activeCall, status: 'ended' },
      };
    });
    setTimeout(() => {
      set({ activeCall: null });
    }, 800);
  },

  toggleMute: () => {
    set((state) => {
      if (!state.activeCall) return state;
      return { activeCall: { ...state.activeCall, isMuted: !state.activeCall.isMuted } };
    });
  },

  toggleCamera: () => {
    set((state) => {
      if (!state.activeCall) return state;
      return { activeCall: { ...state.activeCall, isCameraOff: !state.activeCall.isCameraOff } };
    });
  },
}));
