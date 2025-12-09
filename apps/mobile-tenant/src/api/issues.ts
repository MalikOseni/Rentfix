import * as FileSystem from 'expo-file-system';
import { apiFetch } from './client';
import { IssueDraft } from '../state/issueStore';

export type TicketTimelineItem = {
  id: string;
  status: IssueDraft['category'];
  note: string;
  timestamp: string;
};

export const submitIssue = async (draft: IssueDraft) => {
  const payload = {
    description: draft.description,
    category: draft.category,
    urgency: draft.emergency ? 'emergency' : 'routine',
    address: draft.address,
    accessNotes: draft.accessNotes,
    photos: draft.photos,
    aiCategory: draft.aiCategory,
    aiUrgency: draft.aiUrgency
  };
  return apiFetch<{ ticketId: string }>('/tickets', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const getTimeline = async (ticketId: string) =>
  apiFetch<{ events: TicketTimelineItem[] }>(`/tickets/${ticketId}/timeline`);

export const uploadPhoto = async (uri: string) => {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('Photo not found on device');
  }
  // Stub: integrate with signed URL or direct upload in production
  return apiFetch<{ url: string }>('/evidence/upload', {
    method: 'POST',
    body: JSON.stringify({ uri })
  });
};
