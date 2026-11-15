import { create } from 'zustand';
import { Conversation, Message, MessageType } from '@convocart/shared';
import { apiRequest } from '../lib/api';
import { nexconnClient } from '../lib/nexconnClient';
import {
  fetchRecipientRsaPublicKey,
  rsaEncryptDirectional,
  syncMyRsaPublicKey,
} from '../lib/encryption';
import { useAuthStore } from './useAuthStore';

async function buildEncryptedChatPayload(
  conversation: Conversation | undefined,
  plaintext: string,
  metadata?: any
): Promise<{ text: string; metadata: any }> {
  const currentUser = useAuthStore.getState().user;
  if (!conversation || !currentUser || !plaintext || !plaintext.trim()) {
    return { text: plaintext, metadata };
  }

  const targetLookupId =
    currentUser.role === 'consumer'
      ? conversation.assignedSupportAgentId &&
        (conversation.escalatedToSupport || conversation.status === 'escalated')
        ? conversation.assignedSupportAgentId
        : conversation.vendorOwnerUid || conversation.vendorId
      : conversation.consumerId;

  const [recipientRec, senderKey] = await Promise.all([
    fetchRecipientRsaPublicKey(targetLookupId, true),
    syncMyRsaPublicKey(currentUser.uid, currentUser.rsaPublicKey),
  ]);

  if (!recipientRec?.rsaPublicKey) {
    return { text: plaintext, metadata };
  }

  const encrypted = await rsaEncryptDirectional({
    plaintext,
    recipientPublicKey: recipientRec.rsaPublicKey,
    senderPublicKey: senderKey?.publicKey,
  });

  return {
    text: encrypted.rsaForRecipient,
    metadata: {
      ...(metadata || {}),
      encrypted: true,
      rsaEncrypted: true,
      encryptionAlgorithm: encrypted.algorithm,
      rsaForRecipient: encrypted.rsaForRecipient,
      rsaForSender: encrypted.rsaForSender,
      rsaRecipientUid: recipientRec.uid,
      rsaSenderUid: currentUser.uid,
      rsaKeyFingerprint: encrypted.recipientFingerprint,
    },
  };
}

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
  targetLanguage: string;
  autoTranslate: boolean;
  isTranslating: boolean;

  fetchConversations: () => Promise<void>;
  refreshActiveMessages: (conversationId?: string) => Promise<void>;
  resetAndFetchForNewUser: () => Promise<void>;
  selectConversation: (conversationId: string, openDrawer?: boolean) => Promise<void>;
  startConversationWithVendor: (vendorId: string, productId?: string, orderId?: string) => Promise<string>;
  startConversationWithCustomer: (consumerId: string, vendorId?: string, orderId?: string) => Promise<string>;
  sendMessage: (
    text: string,
    type?: MessageType,
    mediaUrl?: string,
    metadata?: any,
    conversationIdOverride?: string
  ) => Promise<void>;
  sendPaymentRequest: (
    conversationId: string,
    amount: number,
    title: string,
    orderId?: string
  ) => Promise<void>;
  updateConversationSettings: (
    conversationId: string,
    settings: {
      aiHandlingEnabled?: boolean;
      autoTranslateEnabled?: boolean;
      consumerPreferredLanguage?: string;
      vendorPreferredLanguage?: string;
      status?: string;
    }
  ) => Promise<void>;
  editMessage: (conversationId: string, messageId: string, text: string) => Promise<void>;
  deleteMessage: (conversationId: string, messageId: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  toggleDrawer: (open?: boolean) => void;
  setTargetLanguage: (language: string) => Promise<void>;
  toggleAutoTranslate: (enabled?: boolean) => Promise<void>;
  translateMessage: (
    conversationId: string,
    messageId: string,
    targetLanguage?: string,
    decryptedPlaintext?: string
  ) => Promise<Message | null>;
  translateAllInConversation: (conversationId: string, targetLanguage?: string) => Promise<void>;
  translateDraft: (text: string, targetLanguage?: string, sourceLanguage?: string) => Promise<{ translatedText: string; detectedLanguage: string }>;
  escalateConversation: (conversationId: string, reason?: string) => Promise<void>;
  dispatchConversation: (
    conversationId: string,
    payload: { action: 'claim' | 'auto' | 'transfer_vendor' | 'resolve'; agentId?: string }
  ) => Promise<void>;
  startCall: (targetName: string, targetAvatar?: string, isVideo?: boolean) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const initialLanguage = typeof window !== 'undefined' ? localStorage.getItem('convocart_chat_lang') || 'en' : 'en';
const initialAutoTranslate = typeof window !== 'undefined' ? localStorage.getItem('convocart_auto_translate') === 'true' : false;

const chatSyncChannel =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('nexconn_convocart_chat_sync')
    : null;

type ChatSyncEventType =
  | 'escalated'
  | 'message_sent'
  | 'conversation_updated'
  | 'dispatched'
  | 'auth_changed';

function broadcastChatSync(event: { type: ChatSyncEventType; conversationId?: string }) {
  try {
    chatSyncChannel?.postMessage(event);
  } catch {
    // ignore BroadcastChannel close errors
  }
  nexconnClient.notifySync(event);
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  isDrawerOpen: false,
  isLoading: false,
  unreadTotal: 0,
  activeCall: null,
  targetLanguage: initialLanguage,
  autoTranslate: initialAutoTranslate,
  isTranslating: false,

  fetchConversations: async () => {
    const user = useAuthStore.getState().user;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('convocart_auth_token') : null;
    if (!user || !token) {
      set({ conversations: [], unreadTotal: 0 });
      return;
    }
    try {
      const list = await apiRequest<Conversation[]>('/conversations');
      const unread = list.reduce((acc, c) => {
        const uidCount = c.unreadCount?.[user.uid] || 0;
        const vendorCount =
          user.vendorId && user.vendorId !== user.uid ? c.unreadCount?.[user.vendorId] || 0 : 0;
        return acc + uidCount + vendorCount;
      }, 0);
      set({ conversations: list, unreadTotal: unread });
    } catch {
      // ignore transient auth/network errors
    }
  },

  refreshActiveMessages: async (conversationId?: string) => {
    const user = useAuthStore.getState().user;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('convocart_auth_token') : null;
    if (!user || !token) return;
    const convId = conversationId || get().activeConversationId;
    if (!convId) return;
    try {
      const msgs = await apiRequest<Message[]>(`/conversations/${convId}/messages`);
      set((state) => ({
        messages: { ...state.messages, [convId]: msgs },
      }));
    } catch {
      // ignore transient poll failures
    }
  },

  resetAndFetchForNewUser: async () => {
    set({ activeConversationId: null, conversations: [], unreadTotal: 0 });
    await get().fetchConversations();
    const list = get().conversations;
    if (list.length > 0) {
      await get().selectConversation(list[0].conversationId, false);
    }
  },

  selectConversation: async (conversationId: string, openDrawer: boolean = true) => {
    set((state) => ({
      activeConversationId: conversationId,
      isDrawerOpen: openDrawer ? true : state.isDrawerOpen,
    }));
    try {
      const msgs = await apiRequest<Message[]>(`/conversations/${conversationId}/messages`);
      set((state) => ({
        messages: { ...state.messages, [conversationId]: msgs },
      }));
      get().markAsRead(conversationId);
      if (get().autoTranslate) {
        get().translateAllInConversation(conversationId, get().targetLanguage);
      }
    } catch (err) {
      console.error('[Chat] Failed to load messages:', err);
    }
  },

  startConversationWithVendor: async (vendorId: string, productId?: string, orderId?: string) => {
    const authUser = useAuthStore.getState().user;
    if (!authUser) {
      const target = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/auth?redirect=${encodeURIComponent(target)}`;
      throw new Error('Please sign in to chat with the seller');
    }
    try {
      const conv = await apiRequest<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ vendorId, productId, orderId }),
      });
      await get().fetchConversations();
      await get().selectConversation(conv.conversationId);
      nexconnClient.notifySync({ type: 'conversation_updated', conversationId: conv.conversationId });
      broadcastChatSync({ type: 'conversation_updated', conversationId: conv.conversationId });
      return conv.conversationId;
    } catch (err) {
      console.error('[Chat] Start conversation error:', err);
      throw err;
    }
  },

  startConversationWithCustomer: async (consumerId: string, vendorId?: string, orderId?: string) => {
    try {
      const user = useAuthStore.getState().user;
      const conv = await apiRequest<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: vendorId || user?.vendorId || 'me',
          consumerId,
          orderId,
        }),
      });
      await get().fetchConversations();
      await get().selectConversation(conv.conversationId);
      nexconnClient.notifySync({ type: 'conversation_updated', conversationId: conv.conversationId });
      return conv.conversationId;
    } catch (err) {
      console.error('[Chat] Start customer conversation error:', err);
      throw err;
    }
  },

  sendMessage: async (
    text: string,
    type: MessageType = 'text',
    mediaUrl?: string,
    metadata?: any,
    conversationIdOverride?: string
  ) => {
    const convId =
      conversationIdOverride || get().activeConversationId || get().conversations[0]?.conversationId;
    if (!convId) return;

    if (get().activeConversationId !== convId) {
      set({ activeConversationId: convId });
    }

    try {
      const { autoTranslate, targetLanguage } = get();
      let targetConv = get().conversations.find((c) => c.conversationId === convId);
      if (!targetConv) {
        try {
          targetConv = await apiRequest<Conversation>(`/conversations/${convId}`);
        } catch {
          // ignore if unavailable
        }
      }
      const { text: wireText, metadata: wireMetadata } = await buildEncryptedChatPayload(
        targetConv,
        text,
        metadata
      );

      const res = await apiRequest<{
        sentMessage: Message;
        aiReply?: Message;
        conversation?: Conversation;
      }>(`/conversations/${convId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          text: wireText,
          type,
          mediaUrl,
          metadata: wireMetadata,
          targetLanguage: autoTranslate ? targetLanguage : wireMetadata?.targetLanguage,
        }),
      });

      const activeMsgs = get().messages[convId] || [];
      const incoming = [res.sentMessage, ...(res.aiReply ? [res.aiReply] : [])];
      const existingIds = new Set(activeMsgs.map((m) => m.id));
      const updated = [...activeMsgs, ...incoming.filter((m) => !existingIds.has(m.id))];

      set((state) => ({
        messages: { ...state.messages, [convId]: updated },
        conversations: res.conversation
          ? state.conversations.map((c) =>
              c.conversationId === convId ? res.conversation! : c
            )
          : state.conversations,
      }));

      // Call Nexconn SDK direct channel dispatch using encrypted payload when RSA active
      const currentConv =
        res.conversation || get().conversations.find((c) => c.conversationId === convId);
      if (currentConv) {
        nexconnClient.sendDirectMessage(currentConv.vendorId, wireText);
      }

      await get().fetchConversations();
      broadcastChatSync({ type: 'message_sent', conversationId: convId });
    } catch (err) {
      console.error('[Chat] Send message failed:', err);
    }
  },

  sendPaymentRequest: async (
    conversationId: string,
    amount: number,
    title: string,
    orderId?: string
  ) => {
    await get().sendMessage(
      title || `Payment request for $${amount.toFixed(2)}`,
      'payment_request',
      undefined,
      {
        paymentAmount: amount,
        paymentOrderId: orderId,
        paymentStatus: 'pending',
      },
      conversationId
    );
  },

  updateConversationSettings: async (conversationId: string, settings) => {
    try {
      const res = await apiRequest<{ conversation: Conversation; systemMessage?: Message }>(
        `/conversations/${conversationId}/settings`,
        {
          method: 'PATCH',
          body: JSON.stringify(settings),
        }
      );

      set((state) => {
        const currentMsgs = state.messages[conversationId] || [];
        const nextMsgs =
          res.systemMessage && !currentMsgs.some((m) => m.id === res.systemMessage!.id)
            ? [...currentMsgs, res.systemMessage]
            : currentMsgs;
        return {
          conversations: state.conversations.map((c) =>
            c.conversationId === conversationId ? res.conversation : c
          ),
          messages: {
            ...state.messages,
            [conversationId]: nextMsgs,
          },
        };
      });

      await get().fetchConversations();
      broadcastChatSync({ type: 'conversation_updated', conversationId });
    } catch (err) {
      console.error('[Chat] Failed to update conversation settings:', err);
      throw err;
    }
  },

  editMessage: async (conversationId: string, messageId: string, text: string) => {
    try {
      let targetConv = get().conversations.find((c) => c.conversationId === conversationId);
      if (!targetConv) {
        try {
          targetConv = await apiRequest<Conversation>(`/conversations/${conversationId}`);
        } catch {
          // ignore
        }
      }
      const { text: wireText, metadata: wireMetadata } = await buildEncryptedChatPayload(
        targetConv,
        text
      );
      const res = await apiRequest<{ message: Message }>(
        `/conversations/${conversationId}/messages/${messageId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            text: wireText,
            ...(wireMetadata?.rsaEncrypted ? { metadata: wireMetadata } : {}),
          }),
        }
      );
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) =>
            m.id === messageId ? res.message : m
          ),
        },
      }));
      await get().fetchConversations();
      nexconnClient.notifySync({ type: 'message_sent', conversationId });
    } catch (err) {
      console.error('[Chat] Edit message failed:', err);
    }
  },

  deleteMessage: async (conversationId: string, messageId: string) => {
    try {
      const res = await apiRequest<{ message: Message }>(
        `/conversations/${conversationId}/messages/${messageId}`,
        {
          method: 'DELETE',
        }
      );
      set((state) => ({
        messages: {
          ...state.messages,
          [conversationId]: (state.messages[conversationId] || []).map((m) =>
            m.id === messageId ? res.message : m
          ),
        },
      }));
      await get().fetchConversations();
      nexconnClient.notifySync({ type: 'message_sent', conversationId });
    } catch (err) {
      console.error('[Chat] Recall message failed:', err);
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

  setTargetLanguage: async (language: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('convocart_chat_lang', language);
    }
    set({ targetLanguage: language });
    nexconnClient.syncTranslationPreferences(language, get().autoTranslate);

    const activeId = get().activeConversationId;
    if (get().autoTranslate && activeId) {
      await get().translateAllInConversation(activeId, language);
    }
  },

  toggleAutoTranslate: async (enabled?: boolean) => {
    const next = enabled !== undefined ? enabled : !get().autoTranslate;
    if (typeof window !== 'undefined') {
      localStorage.setItem('convocart_auto_translate', String(next));
    }
    set({ autoTranslate: next });
    nexconnClient.syncTranslationPreferences(get().targetLanguage, next);

    const activeId = get().activeConversationId;
    if (next && activeId) {
      await get().translateAllInConversation(activeId, get().targetLanguage);
    }
  },

  translateMessage: async (
    conversationId: string,
    messageId: string,
    targetLanguage?: string,
    decryptedPlaintext?: string
  ) => {
    const lang = targetLanguage || get().targetLanguage;
    set({ isTranslating: true });
    try {
      if (decryptedPlaintext && decryptedPlaintext.trim()) {
        const res = await apiRequest<{ translatedText: string; detectedLanguage?: string }>(
          '/translation/translate',
          {
            method: 'POST',
            body: JSON.stringify({ text: decryptedPlaintext, targetLanguage: lang }),
          }
        );
        const list = get().messages[conversationId] || [];
        let updatedMessage: Message | null = null;
        const nextList = list.map((m) => {
          if (m.id !== messageId) return m;
          updatedMessage = {
            ...m,
            metadata: {
              ...(m.metadata || {}),
              detectedLanguage: res.detectedLanguage || m.metadata?.detectedLanguage,
              translatedText: {
                ...(m.metadata?.translatedText || {}),
                [lang]: res.translatedText,
              },
            },
          };
          return updatedMessage;
        });
        set((state) => ({
          isTranslating: false,
          messages: { ...state.messages, [conversationId]: nextList },
        }));
        return updatedMessage;
      }

      const res = await apiRequest<{ message: Message; translatedText: string }>(
        `/conversations/${conversationId}/messages/${messageId}/translate`,
        {
          method: 'POST',
          body: JSON.stringify({ targetLanguage: lang }),
        }
      );

      set((state) => {
        const list = state.messages[conversationId] || [];
        return {
          isTranslating: false,
          messages: {
            ...state.messages,
            [conversationId]: list.map((m) => (m.id === messageId ? res.message : m)),
          },
        };
      });
      return res.message;
    } catch (err) {
      set({ isTranslating: false });
      console.error('[Chat] Translate message failed:', err);
      return null;
    }
  },

  translateAllInConversation: async (conversationId: string, targetLanguage?: string) => {
    const lang = targetLanguage || get().targetLanguage;
    set({ isTranslating: true });
    try {
      const res = await apiRequest<{ conversationId: string; targetLanguage: string; messages: Message[] }>(
        `/conversations/${conversationId}/translate-all`,
        {
          method: 'POST',
          body: JSON.stringify({
            targetLanguage: lang,
            enableAutoTranslate: get().autoTranslate,
          }),
        }
      );

      set((state) => ({
        isTranslating: false,
        messages: {
          ...state.messages,
          [conversationId]: res.messages,
        },
      }));
    } catch (err) {
      set({ isTranslating: false });
      console.error('[Chat] Translate all failed:', err);
    }
  },

  translateDraft: async (text: string, targetLanguage?: string, sourceLanguage?: string) => {
    const lang = targetLanguage || get().targetLanguage;
    // Try Nexconn SDK translateModule fast path if available, otherwise backend authoritative translator
    const sdkTranslated = await nexconnClient.translateTextViaSDK(text, lang, sourceLanguage || 'auto');
    if (sdkTranslated && sdkTranslated !== text) {
      return { translatedText: sdkTranslated, detectedLanguage: sourceLanguage || 'auto' };
    }

    const res = await apiRequest<{
      originalText: string;
      translatedText: string;
      detectedSourceLanguage: string;
      targetLanguage: string;
    }>('/conversations/translate-text', {
      method: 'POST',
      body: JSON.stringify({ text, targetLanguage: lang, sourceLanguage }),
    });
    return { translatedText: res.translatedText, detectedLanguage: res.detectedSourceLanguage };
  },

  escalateConversation: async (conversationId: string, reason?: string) => {
    try {
      const res = await apiRequest<{ conversation: Conversation; systemMessage?: Message }>(
        `/conversations/${conversationId}/escalate`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }
      );

      const msgs = await apiRequest<Message[]>(`/conversations/${conversationId}/messages`);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.conversationId === conversationId ? res.conversation : c
        ),
        messages: {
          ...state.messages,
          [conversationId]: msgs,
        },
      }));
      await get().fetchConversations();
      broadcastChatSync({ type: 'escalated', conversationId });
    } catch (err) {
      console.error('[Chat] Escalation failed:', err);
      throw err;
    }
  },

  dispatchConversation: async (conversationId: string, payload) => {
    try {
      const res = await apiRequest<{ conversation: Conversation }>(
        `/conversations/${conversationId}/dispatch`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      const msgs = await apiRequest<Message[]>(`/conversations/${conversationId}/messages`);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.conversationId === conversationId ? res.conversation : c
        ),
        messages: {
          ...state.messages,
          [conversationId]: msgs,
        },
      }));
      await get().fetchConversations();
      broadcastChatSync({ type: 'dispatched', conversationId });
    } catch (err) {
      console.error('[Chat] Dispatch failed:', err);
      throw err;
    }
  },

  startCall: (targetName: string, targetAvatar?: string, isVideo: boolean = false) => {
    const activeConv = get().conversations.find(
      (c) => c.conversationId === get().activeConversationId
    );
    const currentUser = useAuthStore.getState().user;
    const targetUserId =
      currentUser?.role === 'consumer'
        ? activeConv?.vendorId || 'vendor_nexconn_audio'
        : activeConv?.consumerId || 'user_consumer_1';

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

    nexconnClient
      .startCallSession({
        targetUserId,
        callType: isVideo ? 'video' : 'voice',
      })
      .then((res) => {
        set((state) =>
          state.activeCall ? { activeCall: { ...state.activeCall, callId: res.callId } } : state
        );
      })
      .catch(() => {});

    setTimeout(() => {
      set((state) => {
        if (state.activeCall && state.activeCall.status === 'calling') {
          return { activeCall: { ...state.activeCall, status: 'connected' } };
        }
        return state;
      });
    }, 1800);
  },

  endCall: () => {
    void nexconnClient.endCallSession();
    set((state) => {
      if (!state.activeCall) return { activeCall: null };
      return {
        activeCall: { ...state.activeCall, status: 'ended' },
      };
    });
    setTimeout(() => {
      set({ activeCall: null });
    }, 600);
  },

  toggleMute: () => {
    set((state) => {
      if (!state.activeCall) return state;
      const nextMuted = !state.activeCall.isMuted;
      void nexconnClient.toggleCallMicrophone(!nextMuted);
      return { activeCall: { ...state.activeCall, isMuted: nextMuted } };
    });
  },

  toggleCamera: () => {
    set((state) => {
      if (!state.activeCall) return state;
      const nextCamOff = !state.activeCall.isCameraOff;
      void nexconnClient.toggleCallCamera(!nextCamOff);
      return { activeCall: { ...state.activeCall, isCameraOff: nextCamOff } };
    });
  },
}));

// Cross-tab & real-time Nexconn SDK event sync
if (typeof window !== 'undefined') {
  const handleExternalSync = (event: { type?: string; conversationId?: string }) => {
    const state = useChatStore.getState();
    if (event.type === 'auth_changed') {
      void state.resetAndFetchForNewUser();
      return;
    }
    void state.fetchConversations();
    if (event.conversationId && state.activeConversationId === event.conversationId) {
      void state.refreshActiveMessages(event.conversationId);
    }
  };

  if (chatSyncChannel) {
    chatSyncChannel.onmessage = (ev) => {
      handleExternalSync((ev?.data as any) || {});
    };
  }

  nexconnClient.onMessage(() => {
    const state = useChatStore.getState();
    void state.fetchConversations();
    if (state.activeConversationId) {
      void state.refreshActiveMessages(state.activeConversationId);
    }
  });

  nexconnClient.onSync((event) => {
    handleExternalSync(event);
  });
}
