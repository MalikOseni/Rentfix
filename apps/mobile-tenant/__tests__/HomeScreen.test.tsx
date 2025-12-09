import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useOfflineQueue } from '../src/state/offlineQueue';

jest.mock('../src/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => true }));
jest.mock('../src/state/offlineQueue');

const mockedQueue = useOfflineQueue as jest.MockedFunction<typeof useOfflineQueue>;
mockedQueue.mockReturnValue({ items: [], enqueue: jest.fn(), dequeue: jest.fn() } as any);

describe('HomeScreen', () => {
  it('navigates to report issue', () => {
    const navigate = jest.fn();
    const { getByText } = render(<HomeScreen navigation={{ navigate } as any} route={{} as any} />);
    fireEvent.press(getByText('Report an issue'));
    expect(navigate).toHaveBeenCalledWith('ReportIssue');
  });
});
