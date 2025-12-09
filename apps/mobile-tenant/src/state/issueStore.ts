import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IssueDraft = {
  description: string;
  category: string;
  emergency: boolean;
  address: string;
  accessNotes: string;
  photos: string[];
  aiCategory?: string;
  aiUrgency?: string;
};

const defaultDraft: IssueDraft = {
  description: '',
  category: '',
  emergency: false,
  address: '',
  accessNotes: '',
  photos: []
};

interface IssueState {
  draft: IssueDraft;
  setField: (field: keyof IssueDraft, value: IssueDraft[keyof IssueDraft]) => void;
  addPhoto: (uri: string) => void;
  removePhoto: (uri: string) => void;
  hydrateAIHints: (payload: { category?: string; urgency?: string }) => void;
  reset: () => void;
}

export const useIssueStore = create<IssueState>()(
  persist(
    (set) => ({
      draft: defaultDraft,
      setField: (field, value) =>
        set((state) => ({
          draft: { ...state.draft, [field]: value }
        })),
      addPhoto: (uri) =>
        set((state) => ({
          draft: { ...state.draft, photos: Array.from(new Set([...state.draft.photos, uri])) }
        })),
      removePhoto: (uri) =>
        set((state) => ({
          draft: { ...state.draft, photos: state.draft.photos.filter((p) => p !== uri) }
        })),
      hydrateAIHints: ({ category, urgency }) =>
        set((state) => ({
          draft: { ...state.draft, aiCategory: category, aiUrgency: urgency }
        })),
      reset: () => set({ draft: defaultDraft })
    }),
    {
      name: 'issue-draft',
      getStorage: () => AsyncStorage,
      partialize: (state) => ({ draft: state.draft })
    }
  )
);
