import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected));
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
};
