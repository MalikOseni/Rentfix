import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IssueDraft } from './issueStore';

export interface OfflineItem {
  id: string;
  payload: IssueDraft;
  createdAt: number;
}

interface OfflineQueueState {
  items: OfflineItem[];
  enqueue: (item: OfflineItem) => void;
  dequeue: (id: string) => void;
  clear: () => void;
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set) => ({
      items: [],
      enqueue: (item) => set((state) => ({ items: [...state.items, item] })),
      dequeue: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      clear: () => set({ items: [] })
    }),
    {
      name: 'issue-offline-queue',
      getStorage: () => AsyncStorage
    }
  )
);
