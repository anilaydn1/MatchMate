import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { db } from '../../config/FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Existing functionality remains the same
  const loadProfile = async () => {
    try {
      const storedPlayerId = await AsyncStorage.getItem('playerId');
      if (storedPlayerId) {
        const docRef = doc(db, 'users', storedPlayerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfileData(docSnap.data());
        } else {
          setProfileData(null);
        }
      } else {
        setProfileData(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setData([
      { id: 1, name: 'Item #1' },
      { id: 2, name: 'Item #2' },
      { id: 3, name: 'Item #3' },
    ]);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
      loadData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.noProfileContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="person-circle-outline" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.noProfileText}>Welcome to Match Maker</Text>
          <Text style={styles.noProfileSubText}>
            Create your profile to start joining and organizing matches
          </Text>
          <Link href="/(stack)/ProfileCreate" asChild>
            <TouchableOpacity style={styles.createButton}>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.createButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <View style={styles.headerBackground}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={50} color="#4CAF50" />
          </View>
          <Text style={styles.headerName}>{profileData?.Name} {profileData?.surname}</Text>
          <View style={styles.playerIdContainer}>
            <Ionicons name="card-outline" size={16} color="#666" />
            <Text style={styles.playerIdText}>ID: {profileData?.playerId}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <StatItem icon="football-outline" label="Position" value={profileData?.position} />
        <View style={styles.statsDivider} />
        <StatItem icon="location" label="City" value={profileData?.city} />
        <View style={styles.statsDivider} />
        <StatItem icon="map" label="District" value={profileData?.district} />
      </View>

      <View style={styles.aboutSection}>
        <Text style={styles.sectionTitle}>About Me</Text>
        <Text style={styles.aboutText}>
          {profileData?.about || 'No information provided yet'}
        </Text>
      </View>

      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        <ProfileItem
          icon="person-outline"
          label="Full Name"
          value={`${profileData?.Name} ${profileData?.surname}`}
        />
        <ProfileItem
          icon="location-outline"
          label="Location"
          value={`${profileData?.district}, ${profileData?.city}`}
        />
        <ProfileItem
          icon="football-outline"
          label="Preferred Position"
          value={profileData?.position}
        />
      </View>
    </View>
  );

  const renderItem = ({ item }) => (
    <View style={styles.activityItem}>
      <Text style={styles.activityText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const StatItem = ({ icon, label, value }) => (
  <View style={styles.statItem}>
    <Ionicons name={icon} size={24} color="#4CAF50" />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value || '---'}</Text>
  </View>
);

const ProfileItem = ({ icon, label, value }) => (
  <View style={styles.profileItem}>
    <View style={styles.profileItemHeader}>
      <Ionicons name={icon} size={20} color="#4CAF50" style={styles.profileItemIcon} />
      <Text style={styles.profileItemLabel}>{label}</Text>
    </View>
    <Text style={styles.profileItemValue}>{value || '---'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF9EC',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  noProfileContainer: {
    width: '80%',
    alignItems: 'center',
    padding: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  noProfileText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
  },
  noProfileSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerBackground: {
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#4CAF50',
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  playerIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  playerIdText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statsDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  aboutSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailsSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  profileItem: {
    marginBottom: 16,
  },
  profileItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileItemIcon: {
    marginRight: 8,
  },
  profileItemLabel: {
    fontSize: 14,
    color: '#666',
  },
  profileItemValue: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activityText: {
    fontSize: 16,
    color: '#333',
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000', // Changed from '#2E7D32' to black
    marginBottom: 8,
  },

  statValue: {
    color: '#000000', // Changed from '#2E7D32' to black
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },

  aboutText: {
    fontSize: 16,
    color: '#000000', // Changed from '#666' to black
    lineHeight: 24,
  },

  profileItemValue: {
    fontSize: 16,
    color: '#000000', // Changed from '#2E7D32' to black
    fontWeight: '500',
  },

  activityText: {
    fontSize: 16,
    color: '#000000', // Changed from '#333' to black
  },


});