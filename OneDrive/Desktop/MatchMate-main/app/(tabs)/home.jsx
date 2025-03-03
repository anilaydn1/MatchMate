import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ImageBackground,
  Platform,
  StatusBar,
  Dimensions
} from 'react-native';
import { Link } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { db } from '../../config/FirebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const { width, height } = Dimensions.get('window');

export default function Home() {
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const loadAvailabilityStatus = async () => {
      try {
        const playerId = await AsyncStorage.getItem('playerId');
        if (playerId) {
          const userDoc = await getDoc(doc(db, 'users', playerId));
          if (userDoc.exists()) {
            setIsAvailable(userDoc.data().isAvailable);
          }
        }
      } catch (error) {
        console.error('Error loading availability status:', error);
      }
    };

    loadAvailabilityStatus();
  }, []);

  const toggleAvailability = async () => {
    try {
      const playerId = await AsyncStorage.getItem('playerId');
      if (playerId) {
        const newStatus = !isAvailable;
        const userRef = doc(db, 'users', playerId);
        await updateDoc(userRef, { isAvailable: newStatus });
        setIsAvailable(newStatus);
      }
    } catch (error) {
      console.error('Error updating availability status:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('../../assets/images/deneme8.jpg')}
        style={styles.backgroundImage}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>MatchMate</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.statusButton, isAvailable && styles.statusButtonActive]}
              onPress={toggleAvailability}
            >
              <Text style={[styles.statusText, isAvailable && styles.statusTextActive]}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Link href="/(stack)/MatchCreate" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="add-circle-outline" size={28} color="#FFF" />
              <Text style={styles.actionButtonText}>Create Match</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(stack)/SearchMatch" asChild>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="search-outline" size={28} color="#FFF" />
              <Text style={styles.actionButtonText}>Search Match</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statusButtonActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.6)',
    borderColor: '#4A90E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  statusTextActive: {
    color: '#FFF',
  },
  notificationButton: {
    padding: 8,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom:50,
    paddingHorizontal: 20,
    gap: 20,
  },
  actionButton: {
    width: width * 0.8,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});