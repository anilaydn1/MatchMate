import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Alert,
    SafeAreaView,
    Image,
    ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../config/FirebaseConfig';
import {
    collection,
    onSnapshot,
    doc,
    updateDoc,
    getDoc
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function TeamSelectionParticipant() {
    const router = useRouter();
    const { matchId } = useLocalSearchParams();
    const [matchData, setMatchData] = useState(null);
    const [team1, setTeam1] = useState([]);
    const [team2, setTeam2] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const matchRef = doc(db, 'matches', matchId);

        const unsubscribe = onSnapshot(matchRef, (doc) => {
            if (doc.exists()) {
                const matchData = { id: doc.id, ...doc.data() };
                setMatchData(matchData);
                const players = matchData.players || [];
                setTeam1(players.slice(0, 7));
                setTeam2(players.slice(7, 14));
            } else {
                setMatchData(null);
                setTeam1([]);
                setTeam2([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [matchId]);

    const handleJoinTeam = async (teamNumber) => {
        if (!matchData) {
            Alert.alert('Error', 'Match data not found.');
            return;
        }

        try {
            const storedPlayerId = await AsyncStorage.getItem('playerId');
            if (!storedPlayerId) {
                Alert.alert('Error', 'Please create a profile first.');
                return;
            }

            const userDocRef = doc(db, 'users', storedPlayerId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                Alert.alert('Error', 'User profile not found.');
                return;
            }

            const userData = userDoc.data();
            const matchRef = doc(db, 'matches', matchId);
            const players = matchData.players || [];

            const newPlayer = {
                id: storedPlayerId,
                name: `${userData.Name} ${userData.surname}`
            };

            if (players.some(player => player?.id === newPlayer.id)) {
                Alert.alert('Error', 'You are already in this match!');
                return;
            }

            let playerAdded = false;
            const startIndex = teamNumber === 1 ? 0 : 7;
            const endIndex = teamNumber === 1 ? 7 : 14;

            for (let i = startIndex; i < endIndex; i++) {
                if (!players[i]?.name) {
                    players[i] = newPlayer;
                    playerAdded = true;
                    break;
                }
            }

            if (!playerAdded) {
                Alert.alert('Team Full', `Team ${teamNumber} is already full!`);
                return;
            }

            const playerCount = players.filter(player => player?.name).length;
            await updateDoc(matchRef, {
                players,
                playerCount,
                status: players.slice(0, 7).every(p => p?.name) && players.slice(7, 14).every(p => p?.name)
            });

            const joinedMatch = [...(userData.joinedMatch || []), matchId];
            const waitedMatch = (userData.waitedMatch || []).filter(id => id !== matchId);
            await updateDoc(userDocRef, { joinedMatch, waitedMatch });

            Alert.alert('Success', `Successfully joined Team ${teamNumber}!`);
        } catch (error) {
            console.error('Error joining team:', error);
            Alert.alert('Error', 'Failed to join team. Please try again.');
        }
    };

    const handleLeaveMatch = async () => {
        if (!matchData) {
            Alert.alert('Error', 'Match data not found.');
            return;
        }

        try {
            const storedPlayerId = await AsyncStorage.getItem('playerId');
            if (!storedPlayerId) {
                Alert.alert('Error', 'Please create a profile first.');
                return;
            }

            const userDocRef = doc(db, 'users', storedPlayerId);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                Alert.alert('Error', 'User profile not found.');
                return;
            }

            const matchRef = doc(db, 'matches', matchId);
            const players = matchData.players || [];
            const playerIndex = players.findIndex(player => player?.id === storedPlayerId);

            if (playerIndex === -1) {
                Alert.alert('Error', 'You are not in this match!');
                return;
            }

            players[playerIndex] = { id: '', name: '' };
            const playerCount = players.filter(player => player?.name).length;

            await updateDoc(matchRef, {
                players,
                playerCount,
                status: players.slice(0, 7).every(p => p?.name) && players.slice(7, 14).every(p => p?.name)
            });

            const userData = userDoc.data();
            const updatedJoinedMatch = (userData.joinedMatch || []).filter(id => id !== matchId);
            await updateDoc(userDocRef, { joinedMatch: updatedJoinedMatch });

            Alert.alert('Success', 'Successfully left the match!');
        } catch (error) {
            console.error('Error leaving match:', error);
            Alert.alert('Error', 'Failed to leave match. Please try again.');
        }
    };

    const handleInvitePlayer = async () => {
        if (!matchData) {
            Alert.alert('Error', 'Match data not available');
            return;
        }

        try {
            await AsyncStorage.setItem('currentMatchData', JSON.stringify({
                id: matchId,
                matchName: matchData.matchName,
                matchDate: matchData.matchDate,
                matchTime: matchData.matchTime,
                locationName: matchData.locationName,
                playerCount: matchData.playerCount
            }));
            router.push('../(stack)/Inviteplayer');
        } catch (error) {
            console.error('Error storing match data:', error);
            Alert.alert('Error', 'Could not proceed to invite players');
        }
    };

    const renderPlayerItem = ({ item, index, teamNumber }) => {
        if (!item?.name) {
            return (
                <View style={styles.emptySlot}>
                    <View style={styles.emptySlotContent}>
                        <MaterialCommunityIcons name="account-plus" size={24} color="#94a3b8" />
                        <Text style={styles.emptySlotText}>Position {index + 1}</Text>
                    </View>
                </View>
            );
        }
        return (
            <View style={[
                styles.playerItem,
                teamNumber === 1 ? styles.blueTeamPlayer : styles.redTeamPlayer
            ]}>
                <View style={styles.playerContent}>
                    <View style={[
                        styles.playerAvatar,
                        teamNumber === 1 ? styles.blueTeamAvatar : styles.redTeamAvatar
                    ]}>
                        <Text style={[
                            styles.playerInitials,
                            teamNumber === 1 ? styles.blueTeamText : styles.redTeamText
                        ]}>
                            {item.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                    </View>
                    <Text style={[
                        styles.playerName,
                        teamNumber === 1 ? styles.blueTeamText : styles.redTeamText
                    ]} numberOfLines={1}>
                        {item.name}
                    </Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!matchData) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#64748b" />
                <Text style={styles.errorText}>Match not found</Text>
                <TouchableOpacity
                    style={styles.errorButton}
                    onPress={() => router.back()}>
                    <Text style={styles.errorButtonText}>Return to Matches</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (

        <>
            <Stack.Screen options={{
                headerShown: false
            }} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.matchTitle}>{matchData.matchName}</Text>
                        <Text style={styles.matchInfo}>
                            {matchData.matchDate} • {matchData.matchTime}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.leaveButton}
                        onPress={() => Alert.alert(
                            'Leave Match',
                            'Are you sure you want to leave this match?',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Leave', onPress: handleLeaveMatch, style: 'destructive' }
                            ]
                        )}>
                        <Text style={styles.leaveButtonText}>Leave Match</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.teamsContainer}>
                    <View style={styles.teamSection}>
                        <Text style={styles.teamTitle}>Team Blue</Text>
                        <Text style={styles.teamCount}>{team1.filter(p => p?.name).length}/7 Players</Text>
                        <FlatList
                            data={Array(7).fill(null).map((_, i) => team1[i] || null)}
                            renderItem={({ item, index }) => renderPlayerItem({ item, index, teamNumber: 1 })}
                            keyExtractor={(_, index) => `team1-${index}`}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                        <TouchableOpacity
                            style={[styles.joinButton, styles.blueButton]}
                            onPress={() => handleJoinTeam(1)}>
                            <Text style={styles.joinButtonText}>Join Blue Team</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.teamSection}>
                        <Text style={styles.teamTitle}>Team Red</Text>
                        <Text style={styles.teamCount}>{team2.filter(p => p?.name).length}/7 Players</Text>
                        <FlatList
                            data={Array(7).fill(null).map((_, i) => team2[i] || null)}
                            renderItem={({ item, index }) => renderPlayerItem({ item, index, teamNumber: 2 })}
                            keyExtractor={(_, index) => `team2-${index}`}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                        <TouchableOpacity
                            style={[styles.joinButton, styles.redButton]}
                            onPress={() => handleJoinTeam(2)}>
                            <Text style={styles.joinButtonText}>Join Red Team</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={handleInvitePlayer}>
                    <MaterialCommunityIcons name="account-plus" size={24} color="#fff" style={styles.inviteIcon} />
                    <Text style={styles.inviteButtonText}>Invite Players</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECF9EC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: 3,
        borderBottomColor: '#d3dbd3',
    },
    matchTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a365d',
        marginBottom: 4,
    },
    matchInfo: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
    },
    leaveButton: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    leaveButtonText: {
        color: '#dc2626',
        fontWeight: '600',
    },
    teamsContainer: {
        flexDirection: 'row',
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 20,
    },
    teamSection: {
        flex: 1,
        padding: 10,
    },
    teamTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        color: '#2d3748',
    },
    teamCount: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 15,
    },
    divider: {
        width: 3,
        backgroundColor: '#d3dbd3',
        marginVertical: 10,
    },
    listContent: {
        gap: 12,
        paddingVertical: 10,
    },
    playerItem: {
        borderRadius: 16,
        padding: 11,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    playerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    playerInitials: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a5568',
    },
    playerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
        flex: 1,
    },
    emptySlot: {
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#6d7d6b',
    },
    emptySlotContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptySlotText: {
        fontSize: 14,
        color: '#718096',
        marginLeft: 8,
    },
    joinButton: {
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    blueButton: {
        backgroundColor: '#3b82f6',
    },
    redButton: {
        backgroundColor: '#ef4444',
    },
    joinButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    inviteButton: {
        backgroundColor: '#10b981',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    inviteIcon: {
        marginRight: 8,
    },
    inviteButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 20,
    },
    errorText: {
        fontSize: 20,
        color: '#64748b',
        marginVertical: 20,
        textAlign: 'center',
    },
    errorButton: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 20,
    },
    errorButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    blueTeamPlayer: {
        backgroundColor: '#EBF8FF',
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    redTeamPlayer: {
        backgroundColor: '#FEF2F2',
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    blueTeamAvatar: {
        backgroundColor: '#BFDBFE',
    },
    redTeamAvatar: {
        backgroundColor: '#FECACA',
    },
    blueTeamText: {
        color: '#1E40AF',
    },
    redTeamText: {
        color: '#991B1B',
    },
});