import { create } from 'zustand';
import api from '../services/api';

export interface Contact {
  id: number;
  phone: string;
  name: string;
  optOut: boolean;
}

export interface Message {
  id: number;
  conversationId: number;
  direction: 'incoming' | 'outgoing';
  originalContent: string;
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'awaiting_approval';
  complianceStatus: 'safe' | 'rewritten' | 'human_review' | 'blocked';
  complianceScore: number;
  complianceReason: string | null;
  createdAt: string;
}

export interface Conversation {
  id: number;
  contactId: number;
  status: 'ai_active' | 'human_active' | 'paused';
  isGroup: boolean;
  groupName: string | null;
  groupId: string | null;
  contact: Contact;
  messages: Message[];
  updatedAt: string;
}

export interface ComplianceLog {
  id: number;
  messageId: number;
  riskScore: number;
  category: string;
  details: string;
  actionTaken: string;
  createdAt: string;
  message: Message & { conversation: Conversation };
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  pendingReviews: any[];
  complianceLogs: ComplianceLog[];
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (convId: number) => Promise<void>;
  selectConversation: (convId: number) => void;
  sendOperatorMessage: (convId: number, text: string) => Promise<void>;
  setConversationStatus: (convId: number, status: string) => Promise<void>;
  fetchPendingReviews: () => Promise<void>;
  approveReview: (msgId: number, customText?: string) => Promise<void>;
  rejectReview: (msgId: number) => Promise<void>;
  fetchComplianceLogs: () => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  pendingReviews: [],
  complianceLogs: [],
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/conversations');
      // Sort conversations by updatedAt descending
      const sorted = response.data.sort(
        (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      set({ conversations: sorted, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (convId: number) => {
    try {
      const response = await api.get(`/conversations/${convId}/messages`);
      set({ messages: response.data });
    } catch (e) {}
  },

  selectConversation: (convId: number) => {
    set({ activeConversationId: convId });
    get().fetchMessages(convId);
  },

  sendOperatorMessage: async (convId, text) => {
    try {
      const response = await api.post(`/conversations/${convId}/message`, { text });
      set((state) => ({
        messages: [...state.messages, response.data],
      }));
      // Refresh list
      get().fetchConversations();
    } catch (e) {}
  },

  setConversationStatus: async (convId, status) => {
    try {
      await api.post(`/conversations/${convId}/status`, { status });
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === convId ? { ...c, status: status as any } : c
        ),
      }));
    } catch (e) {}
  },

  fetchPendingReviews: async () => {
    try {
      const response = await api.get('/conversations/pending-reviews');
      set({ pendingReviews: response.data });
    } catch (e) {}
  },

  approveReview: async (msgId, customText) => {
    try {
      await api.post(`/conversations/approve-review/${msgId}`, { text: customText });
      set((state) => ({
        pendingReviews: state.pendingReviews.filter((m) => m.id !== msgId),
      }));
      // If the active conversation matches the reviewed message conversation, reload chat
      const activeId = get().activeConversationId;
      if (activeId) {
        get().fetchMessages(activeId);
      }
      get().fetchConversations();
    } catch (e) {}
  },

  rejectReview: async (msgId) => {
    try {
      await api.post(`/conversations/reject-review/${msgId}`);
      set((state) => ({
        pendingReviews: state.pendingReviews.filter((m) => m.id !== msgId),
      }));
      const activeId = get().activeConversationId;
      if (activeId) {
        get().fetchMessages(activeId);
      }
      get().fetchConversations();
    } catch (e) {}
  },

  fetchComplianceLogs: async () => {
    try {
      const response = await api.get('/conversations/compliance-logs');
      set({ complianceLogs: response.data });
    } catch (e) {}
  },
}));
