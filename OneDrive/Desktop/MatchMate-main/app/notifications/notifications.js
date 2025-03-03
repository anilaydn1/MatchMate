import React, { useEffect, useState } from "react";
import { Text, View, FlatList, Platform } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "./../../config/FirebaseConfig"; // Firebase yapılandırma dosyasından import
import * as Notifications from 'expo-notifications'; // Expo Notifications importu

// Bildirim işleme yapılandırması
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function StatusListener() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Bildirim izni reddedildi!');
          return; // İzin verilmezse devam etme
        }
        console.log('Bildirim izni verildi.');

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default Channel',
            importance: Notifications.AndroidImportance.MAX, // MAX önem seviyesi
            description: 'Varsayılan bildirim kanalı',
            sound: true,
            vibrationPattern: [0, 250, 250, 250], // Daha kısa titreşim
            enableVibrate: true,
          });
          console.log('Bildirim kanalı oluşturuldu: default');
        }
      } catch (error) {
        console.error('Bildirim ayarları yapılırken hata:', error);
      }
    };

    initializeNotifications();

    console.log("Başlatılıyor: Firestore bağlantısı kuruluyor...");

    // matches koleksiyonunda sadece status alanını dinle
    const matchesQuery = query(
      collection(db, "matches"), // Koleksiyon adı
      where("status", "==", true) // Belirli status değerlerini dinle
    );

    console.log("Sorgu oluşturuldu: ", matchesQuery);

    const unsubscribe = onSnapshot(
      matchesQuery,
      (snapshot) => {
        console.log("Veri alındı: ", snapshot.size, " belge bulundu.");
        const fetchedMatches = snapshot.docs.map((doc) => {
          console.log("Belge ID: ", doc.id, " Belge Verisi: ", doc.data());
          return {
            id: doc.id,
            status: doc.data().status, // Sadece status alanını alıyoruz
          };
        });
        setMatches(fetchedMatches);
        console.log("State güncellendi: ", fetchedMatches);

        // Eğer status true ise bildirim gönder
        if (fetchedMatches.length > 0) {
          sendLocalNotification();
        }
      },
      (error) => {
        console.error("Hata oluştu: ", error.message);
      }
    );

    console.log("Dinleme başlatıldı.");

    // Component unmount olduğunda dinlemeyi durdur
    return () => {
      console.log("Bileşen kaldırılıyor: Dinleme durduruluyor.");
      unsubscribe();
    };
  }, []);

  const sendLocalNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Are you ready for the competition!",
          body: "Both teams are ready.",
          sound: true,
        },
        trigger: null, // Bildirimi hemen gönder
      });
      console.log('Bildirim başarıyla gönderildi.');
    } catch (error) {
      console.error('Bildirim gönderiminde hata:', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        
      />
    </View>
  );
}
