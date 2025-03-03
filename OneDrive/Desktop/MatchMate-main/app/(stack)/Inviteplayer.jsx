import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Dimensions,
    Alert,
    SafeAreaView,
    ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/FirebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function InvitePlayer() {
    const [players, setPlayers] = useState([]);
    const [matchData, setMatchData] = useState(null);
    const [currentMatchPlayers, setCurrentMatchPlayers] = useState([]);
    const router = useRouter();

    // Fetch stored match data and current players in the match
    useEffect(() => {
        const fetchMatchData = async () => {
            try {
                // Get stored match data
                const storedMatchData = await AsyncStorage.getItem('currentMatchData');
                if (!storedMatchData) {
                    Alert.alert('Error', 'No match data available');
                    router.back();
                    return;
                }

                const parsedMatchData = JSON.parse(storedMatchData);
                setMatchData(parsedMatchData);

                // Set up real-time listener for match players
                const matchRef = doc(db, 'matches', parsedMatchData.id);
                const unsubscribe = onSnapshot(matchRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const match = docSnapshot.data();
                        const players = match.players || [];
                        // Get all player IDs from both teams
                        const playerIds = players
                            .filter(player => player && player.id)
                            .map(player => player.id);
                        setCurrentMatchPlayers(playerIds);
                    }
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching match data:', error);
                Alert.alert('Error', 'Could not retrieve match data');
                router.back();
            }
        };

        fetchMatchData();
    }, []);

    // Fetch available players
    useEffect(() => {
        const playersRef = collection(db, 'users');
        const q = query(playersRef, where('isAvailable', '==', true));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const formattedPlayers = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: `${data.Name || 'Unknown'} ${data.surname || ''}`.trim(),
                    position: data.position || 'Unknown Position',
                    location: data.city || 'Unknown Location',
                    available: data.isAvailable,
                    waitedMatch: data.waitedMatch || []
                };
            });

            setPlayers(formattedPlayers);
        });

        return () => unsubscribe();
    }, []);

    const handleInvitePlayer = async (player) => {
        if (!matchData) {
            Alert.alert('Error', 'Match data not available');
            return;
        }

        try {
            if (currentMatchPlayers.includes(player.id)) {
                Alert.alert('Error', 'Player is already in this match');
                return;
            }

            if (player.waitedMatch?.includes(matchData.id)) {
                Alert.alert('Error', 'Player is already invited to this match');
                return;
            }

            const storedPlayerId = await AsyncStorage.getItem('playerId');
            if (!storedPlayerId) {
                Alert.alert('Error', 'Please create a profile first');
                return;
            }

            const playerRef = doc(db, 'users', player.id);
            const playerDoc = await getDoc(playerRef);

            if (!playerDoc.exists()) {
                Alert.alert('Error', 'Player not found');
                return;
            }

            const currentWaitedMatch = playerDoc.data().waitedMatch || [];

            if (!currentWaitedMatch.includes(matchData.id)) {
                const updatedWaitedMatch = [...currentWaitedMatch, matchData.id];

                await updateDoc(playerRef, {
                    waitedMatch: updatedWaitedMatch,
                    invitedBy: storedPlayerId
                });

                Alert.alert('Success', `Invitation sent to ${player.name}`);
            }

        } catch (error) {
            console.error('Error inviting player:', error);
            Alert.alert('Error', 'Failed to invite player. Please try again.');
        }
    };

    const renderPlayerItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.playerCard,
                item.waitedMatch?.includes(matchData?.id) && styles.invitedPlayerCard,
                currentMatchPlayers.includes(item.id) && styles.inMatchPlayerCard
            ]}
            onPress={() => {
                if (currentMatchPlayers.includes(item.id)) {
                    Alert.alert('Notice', 'This player is already in the match');
                    return;
                }

                if (item.waitedMatch?.includes(matchData?.id)) {
                    Alert.alert('Notice', 'This player has already been invited');
                    return;
                }

                Alert.alert(
                    'Invite Player',
                    `Do you want to invite ${item.name} to the match?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Invite', onPress: () => handleInvitePlayer(item) }
                    ]
                );
            }}
        >
            <View style={styles.playerAvatarContainer}>
                <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitials}>
                        {item.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                </View>
            </View>
            <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>
                <View style={styles.playerDetailsContainer}>
                    <MaterialCommunityIcons name="soccer-field" size={16} color="#64748b" />
                    <Text style={styles.playerDetails}>{item.position}</Text>
                </View>
                <View style={styles.playerDetailsContainer}>
                    <MaterialCommunityIcons name="map-marker" size={16} color="#64748b" />
                    <Text style={styles.playerDetails}>{item.location}</Text>
                </View>
            </View>
            {currentMatchPlayers.includes(item.id) ? (
                <View style={styles.statusBadge}>
                    <MaterialCommunityIcons name="account-check" size={16} color="#fff" />
                    <Text style={styles.statusText}>In Match</Text>
                </View>
            ) : item.waitedMatch?.includes(matchData?.id) && (
                <View style={[styles.statusBadge, styles.invitedBadge]}>
                    <MaterialCommunityIcons name="email-send" size={16} color="#fff" />
                    <Text style={styles.statusText}>Invited</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (!matchData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Loading match data...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#1a365d" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Invite Players</Text>
                </View>

                <View style={styles.matchInfoContainer}>
                    <Text style={styles.matchTitle}>{matchData.matchName}</Text>
                    <View style={styles.matchDetailsRow}>
                        <View style={styles.matchDetailItem}>
                            <MaterialCommunityIcons name="calendar" size={20} color="#64748b" />
                            <Text style={styles.matchDetails}>{matchData.matchDate}</Text>
                        </View>
                        <View style={styles.matchDetailItem}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748b" />
                            <Text style={styles.matchDetails}>{matchData.matchTime}</Text>
                        </View>
                        <View style={styles.matchDetailItem}>
                            <MaterialCommunityIcons name="account-group" size={20} color="#64748b" />
                            <Text style={styles.matchDetails}>{matchData.playerCount}/14</Text>
                        </View>
                    </View>
                </View>

                <FlatList
                    data={players}
                    keyExtractor={(item) => item.id}
                    renderItem={renderPlayerItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECF9EC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a365d',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748b',
    },
    matchInfoContainer: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    matchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a365d',
        marginBottom: 12,
    },
    matchDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    matchDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    matchDetails: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 4,
    },
    listContainer: {
        padding: 16,
        paddingTop: 0,
    },
    playerCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    invitedPlayerCard: {
        backgroundColor: '#f0fdf4',
        borderColor: '#22c55e',
        borderWidth: 1,
    },
    inMatchPlayerCard: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
        borderWidth: 1,
    },
    playerAvatarContainer: {
        marginRight: 12,
    },
    playerAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerInitials: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748b',
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a365d',
        marginBottom: 4,
    },
    playerDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    playerDetails: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        position: 'absolute',
        right: 12,
        top: 12,
    },
    invitedBadge: {
        backgroundColor: '#22c55e',
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
});