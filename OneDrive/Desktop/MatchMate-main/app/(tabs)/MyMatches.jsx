import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../config/FirebaseConfig';
import { collection, onSnapshot, doc, query, where, getDoc, getDocs, updateDoc, arrayRemove } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function MyMatches() {
  const router = useRouter();
  const [myMatches, setMyMatches] = useState([]);
  const [waitedMatches, setWaitedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const previousWaitedMatches = useRef([]);

  const sendNotification = async (matchName) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "New Match Invitation!",
        body: `You've been invited to ${matchName}`,
        data: { screen: 'MyMatches' },
      },
      trigger: null,
    });
  };

  const handleRejectMatch = async (matchId) => {
    Alert.alert(
      "Reject Match Invitation",
      "Are you sure you want to reject this match invitation?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              if (!playerId) return;

              const userRef = doc(db, 'users', playerId);
              await updateDoc(userRef, {
                waitedMatch: arrayRemove(matchId)
              });
            } catch (error) {
              console.error('Error rejecting match:', error);
              Alert.alert('Error', 'Failed to reject match invitation. Please try again.');
            }
          }
        }
      ]
    );
  };

  const setupListeners = (userId, initialJoinedIds = [], initialWaitedIds = []) => {
    let unsubscribeUser;
    let unsubscribeJoinedMatches;
    let unsubscribeWaitedMatches;

    try {
      unsubscribeUser = onSnapshot(doc(db, 'users', userId), async (userDoc) => {
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const joinedMatchIds = userData.joinedMatch || [];
        const waitedMatchIds = userData.waitedMatch?.filter(id => !joinedMatchIds.includes(id)) || [];

        if (joinedMatchIds.length > 0) {
          if (unsubscribeJoinedMatches) unsubscribeJoinedMatches();
          const q = query(collection(db, 'matches'), where('__name__', 'in', joinedMatchIds));
          unsubscribeJoinedMatches = onSnapshot(q, (snapshot) => {
            const matches = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setMyMatches(matches);
          });
        } else {
          setMyMatches([]);
        }

        if (waitedMatchIds.length > 0) {
          if (unsubscribeWaitedMatches) unsubscribeWaitedMatches();
          const q = query(collection(db, 'matches'), where('__name__', 'in', waitedMatchIds));
          unsubscribeWaitedMatches = onSnapshot(q, (snapshot) => {
            const matches = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            const newMatches = matches.filter(match =>
              !previousWaitedMatches.current.some(prev => prev.id === match.id)
            );

            if (newMatches.length > 0) {
              newMatches.forEach(match => {
                sendNotification(match.matchName);
              });
            }

            setWaitedMatches(matches);
            previousWaitedMatches.current = matches;
          });
        } else {
          setWaitedMatches([]);
        }
      });
    } catch (error) {
      console.error('Error setting up listeners:', error);
    }

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeJoinedMatches) unsubscribeJoinedMatches();
      if (unsubscribeWaitedMatches) unsubscribeWaitedMatches();
    };
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const id = await AsyncStorage.getItem('playerId');
      if (id) {
        const userDocRef = doc(db, 'users', id);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const joinedMatchIds = userData.joinedMatch || [];
          const waitedMatchIds = userData.waitedMatch || [];

          if (joinedMatchIds.length > 0) {
            const matchesRef = collection(db, 'matches');
            const q = query(matchesRef, where('__name__', 'in', joinedMatchIds));
            const joinedMatchesSnap = await getDocs(q);
            setMyMatches(joinedMatchesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          }

          if (waitedMatchIds.length > 0) {
            const matchesRef = collection(db, 'matches');
            const q = query(matchesRef, where('__name__', 'in', waitedMatchIds));
            const waitedMatchesSnap = await getDocs(q);
            setWaitedMatches(waitedMatchesSnap.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })));
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const requestNotificationPermission = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const id = await AsyncStorage.getItem('playerId');
        if (!id) {
          setLoading(false);
          return;
        }

        setPlayerId(id);
        const userDocRef = doc(db, 'users', id);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userDocSnap.data();
        const joinedMatchIds = userData.joinedMatch || [];
        const waitedMatchIds = userData.waitedMatch || [];

        if (joinedMatchIds.length > 0) {
          const matchesRef = collection(db, 'matches');
          const q = query(matchesRef, where('__name__', 'in', joinedMatchIds));
          const initialJoinedMatches = await getDocs(q);
          setMyMatches(initialJoinedMatches.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })));
        }

        if (waitedMatchIds.length > 0) {
          const matchesRef = collection(db, 'matches');
          const q = query(matchesRef, where('__name__', 'in', waitedMatchIds));
          const initialWaitedMatches = await getDocs(q);
          const waitedMatches = initialWaitedMatches.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setWaitedMatches(waitedMatches);
          previousWaitedMatches.current = waitedMatches;
        }

        return setupListeners(id, joinedMatchIds, waitedMatchIds);
      } catch (error) {
        console.error('Error in initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = initializeData();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const renderMatchCard = ({ item, type }) => (
    <TouchableOpacity
      style={[styles.matchCard, type === 'invited' ? styles.invitedMatchCard : styles.joinedMatchCard]}
      onPress={() => router.push(`/(stack)/TeamSelectionParticipant?matchId=${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.matchName} numberOfLines={1}>
          {item.matchName}
        </Text>
        <View style={styles.badgeContainer}>
          {type === 'invited' && (
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectMatch(item.id)}
            >
              <Text style={styles.rejectButtonText}>✕</Text>
            </TouchableOpacity>
          )}
          <View style={[styles.badge, type === 'invited' ? styles.invitedBadge : styles.joinedBadge]}>
            <Text style={styles.badgeText}>
              {type === 'invited' ? 'Invited' : 'Joined'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.matchDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📅 Date:</Text>
          <Text style={styles.detailValue}>{item.matchDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>⏰ Time:</Text>
          <Text style={styles.detailValue}>{item.matchTime}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>📍 Location:</Text>
          <Text style={styles.detailValue} numberOfLines={1}>{item.locationName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>👥 Players:</Text>
          <Text style={styles.detailValue}>{item.playerCount || 0}/14</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListEmptyComponent = ({ text }) => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#028090" />
        <Text style={styles.loadingText}>Loading matches...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Matches</Text>
          <FlatList
            data={myMatches}
            keyExtractor={(item) => `joined-${item.id}`}
            renderItem={({ item }) => renderMatchCard({ item, type: 'joined' })}
            contentContainerStyle={[
              styles.listContainer,
              myMatches.length === 0 && styles.emptyListContainer
            ]}
            ListEmptyComponent={<ListEmptyComponent text="No matches joined yet" />}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Invitations</Text>
          <FlatList
            data={waitedMatches}
            keyExtractor={(item) => `invited-${item.id}`}
            renderItem={({ item }) => renderMatchCard({ item, type: 'invited' })}
            contentContainerStyle={[
              styles.listContainer,
              waitedMatches.length === 0 && styles.emptyListContainer
            ]}
            ListEmptyComponent={<ListEmptyComponent text="No match invitations" />}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ECF9EC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    flex: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#102027',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  matchCard: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  joinedMatchCard: {
    backgroundColor: '#BBDEFB',
  },
  invitedMatchCard: {
    backgroundColor: '#FFE0B2',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#102027',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinedBadge: {
    backgroundColor: '#1565C0',
  },
  invitedBadge: {
    backgroundColor: '#F57C00',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  matchDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#37474F',
    width: 70,
  },
  detailValue: {
    fontSize: 14,
    color: '#102027',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#37474F',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#37474F', // Darker gray
    fontStyle: 'italic',
    textAlign: 'center',
  },
  listContainer: {
    paddingTop: 4,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#FF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});