import { View } from 'react-native';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import StatusListener from './notifications/notifications';

export default function Index() {
  const matchId = "12345";
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const router = useRouter(); // <-- useRouter hook'u

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedInStatus = await SecureStore.getItemAsync('isLoggedIn');
      setIsLoggedIn(loggedInStatus === 'true');
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn !== null) {
      if (isLoggedIn) {
        router.push('/(tabs)/home'); // Kullanıcı giriş yapmışsa home sayfasına yönlendir
      } else {
        router.push('/login'); // Giriş yapmamışsa login sayfasına yönlendir
      }
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn === null) {
    return null; // Yükleme durumu
  }

  return (
    
    <View style={{ flex: 1 }} />,
    <StatusListener matchId={matchId} />
  );
}
