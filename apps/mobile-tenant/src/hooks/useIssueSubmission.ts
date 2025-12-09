import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { submitIssue } from '../api/issues';
import { useIssueStore } from '../state/issueStore';
import { useOfflineQueue } from '../state/offlineQueue';
import { useOnlineStatus } from './useOnlineStatus';
import { createId } from '../utils/ids';

export const useIssueSubmission = () => {
  const isOnline = useOnlineStatus();
  const { draft, reset } = useIssueStore();
  const { items, enqueue, dequeue } = useOfflineQueue();

  const mutation = useMutation(() => submitIssue(draft), {
    onSuccess: () => {
      reset();
    },
    onError: (error: unknown) => {
      Alert.alert('Submission failed', (error as Error).message);
    }
  });

  const submit = async () => {
    if (!isOnline) {
      enqueue({ id: createId(), payload: draft, createdAt: Date.now() });
      reset();
      return { queued: true };
    }

    const result = await mutation.mutateAsync();
    return { queued: false, ticketId: result.ticketId };
  };

  useEffect(() => {
    const flushQueue = async () => {
      if (!isOnline || items.length === 0) return;
      for (const item of items) {
        try {
          await submitIssue(item.payload);
          dequeue(item.id);
        } catch (error) {
          Alert.alert('Sync failed', (error as Error).message);
          break;
        }
      }
    };
    flushQueue();
  }, [isOnline, items, dequeue]);

  return { submit, isSubmitting: mutation.isLoading, pendingOffline: items.length };
};
