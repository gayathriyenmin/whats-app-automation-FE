import { create } from 'zustand';
import api from '../services/api';

export interface KbArticle {
  id?: number;
  question: string;
  answer: string;
  tags?: string;
  isActive?: boolean;
}

export interface BrandPersonality {
  id?: number;
  name: string;
  systemPrompt: string;
  greetingStyle: 'formal' | 'casual' | 'none';
  emojiDensity: 'none' | 'low' | 'medium' | 'high';
  languageMix: 'english' | 'hinglish' | 'tamil_english';
  isDefault?: boolean;
}

export interface GroupAssistant {
  id?: number;
  groupId: string;
  groupName: string;
  isEnabled: boolean;
  inactivityWaitMinutes: number;
  escalationKeywords: string;
}

interface SettingsState {
  settings: Record<string, string>;
  kbArticles: KbArticle[];
  personalities: BrandPersonality[];
  groups: GroupAssistant[];
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Record<string, string>) => Promise<void>;
  fetchKb: () => Promise<void>;
  saveKb: (article: KbArticle) => Promise<void>;
  deleteKb: (id: number) => Promise<void>;
  fetchPersonalities: () => Promise<void>;
  savePersonality: (personality: BrandPersonality) => Promise<void>;
  fetchGroups: () => Promise<void>;
  saveGroup: (group: GroupAssistant) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {},
  kbArticles: [],
  personalities: [],
  groups: [],
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/settings');
      set({ settings: response.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  updateSettings: async (newSettings) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/settings', newSettings);
      set({ settings: response.data.settings, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },

  fetchKb: async () => {
    try {
      const response = await api.get('/settings/kb');
      set({ kbArticles: response.data });
    } catch (e) {}
  },

  saveKb: async (article) => {
    try {
      await api.post('/settings/kb', article);
      get().fetchKb();
    } catch (e) {}
  },

  deleteKb: async (id) => {
    try {
      await api.delete(`/settings/kb/${id}`);
      get().fetchKb();
    } catch (e) {}
  },

  fetchPersonalities: async () => {
    try {
      const response = await api.get('/settings/personalities');
      set({ personalities: response.data });
    } catch (e) {}
  },

  savePersonality: async (personality) => {
    try {
      await api.post('/settings/personalities', personality);
      get().fetchPersonalities();
    } catch (e) {}
  },

  fetchGroups: async () => {
    try {
      const response = await api.get('/settings/groups');
      set({ groups: response.data });
    } catch (e) {}
  },

  saveGroup: async (group) => {
    try {
      await api.post('/settings/groups', group);
      get().fetchGroups();
    } catch (e) {}
  },
}));
