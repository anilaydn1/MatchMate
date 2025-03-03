import { View, Text, Pressable, Image } from 'react-native';
import React, { useCallback, useState, useEffect } from 'react';
import Colors from './../../constants/Colors';
import * as WebBrowser from 'expo-web-browser';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router'; // <-- useRouter import ettik

export const useWarmUpBrowser = () => {
  React.useEffect(() => {
    console.log('WebBrowser.warmUpAsync() başlatılıyor...');
    void WebBrowser.warmUpAsync();
    return () => {
      console.log('WebBrowser.coolDownAsync() başlatılıyor...');
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter(); // <-- useRouter hook'u

  const checkLoginStatus = async () => {
    const loggedInStatus = await SecureStore.getItemAsync('isLoggedIn');
    if (loggedInStatus === 'true') {
      setIsLoggedIn(true);
    }
  };

  useEffect(() => {
    checkLoginStatus(); // Giriş durumunu kontrol et
  }, []);

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)/home', { scheme: 'myapp' }),
      });
      if (createdSessionId) {
        await SecureStore.setItemAsync('isLoggedIn', 'true');
        setIsLoggedIn(true); // Giriş başarılı, durumu güncelle
      }
    } catch (err) {
      console.error('OAuth işlemi sırasında hata oluştu:', err);
    }
  }, [startOAuthFlow]);

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/(tabs)/home'); // <-- isLoggedIn kontrolü ile yönlendirme yapıyoruz
    }
  }, [isLoggedIn, router]);

  if (isLoggedIn) {
    return null; // Kullanıcı giriş yapmış, başka bir şey render etmiyoruz
  }

  return (
    <View style={{ backgroundColor: Colors.WHITE, height: '100%' }}>
      <Image
        source={require('./../../assets/images/welcome_page_.jpg')}
        style={{ width: '100%', height: 500, borderRadius: 8 }}
      />
      <View style={{ padding: 20, display: 'flex', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'outfit-bold', fontSize: 30, textAlign: 'center' }}>
          Unite, compete, and repeat!
        </Text>
        <Text style={{ padding: 5, fontSize: 18, fontFamily: 'outfit', textAlign: 'center', color: Colors.GRAY }}>
          Let's find the perfect rival for your team and bring the excitement back to the game!
        </Text>
        <Pressable
          onPress={onPress}
          style={{
            padding: 14,
            marginTop: 21,
            backgroundColor: Colors.PRIMARY,
            width: '100%',
            borderRadius: 14,
          }}
        >
          <Text style={{ textAlign: 'center', fontFamily: 'outfit-medium', fontSize: 20 }}>
            Get Started
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
