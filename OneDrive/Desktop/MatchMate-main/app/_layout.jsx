import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { View, Text } from 'react-native';

const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log('No values stored under key: ' + key);
      }
      return item;
    } catch (error) {
      console.error('SecureStore get item error: ', error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Fontları yükle ve durumlarını kontrol et
  const [fontsLoaded] = useFonts({
    'outfit': require('.././assets/fonts/Outfit-Regular.ttf'),
    'outfit-medium': require('.././assets/fonts/Outfit-Medium.ttf'),
    'outfit-bold': require('.././assets/fonts/Outfit-Bold.ttf'),
  });

  if (!fontsLoaded) {
    // Fontlar yüklenirken basit bir yükleme ekranı göster
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading fonts...</Text>
      </View>
    );
  }

  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={publishableKey}
    >
      {/* Tüm ekranlarda üstteki header'ı gizlemek için screenOptions kullanıyoruz */}
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login/index" />
      </Stack>
    </ClerkProvider>
  );
}
