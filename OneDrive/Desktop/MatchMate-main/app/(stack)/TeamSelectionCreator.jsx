import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Alert,
    ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

const dummyMatches = [
    {
        id: 'match123',
        players: [
            { id: '1', name: 'Maç Kurucusu' },
            { id: '2', name: 'Player 2' },
            { id: '3', name: 'Player 3' },
            { id: '4', name: 'Player 4' },
            { id: '5', name: 'Player 5' },
            { id: '6', name: 'Player 6' },
            { id: '7', name: 'Player 7' },
            { id: '8', name: 'Player 8' },
            { id: '9', name: 'Player 9' },
            { id: '10', name: 'Player 10' },
            { id: '11', name: 'Player 11' },
            { id: '12', name: 'Player 12' },
            { id: '13', name: 'Player 13' },
            { id: '14', name: 'Player 14' },
        ]
    },
];

const { width } = Dimensions.get('window');

export default function TeamSelectionCreator() {
    const router = useRouter();
    const { user } = useUser();
    const { matchId } = useLocalSearchParams(); // matchId doğru şekilde alınıyor.
    const [matchData, setMatchData] = useState(null);

    useEffect(() => {
        if (matchId) {
            const found = dummyMatches.find(m => m.id === matchId);
            if (found) {
                found.players[0] = {
                    id: '1',
                    name: user?.fullName || 'Maç Kurucusu'
                };
                setMatchData(found);
            } else {
                setMatchData(null);
            }
        }
    }, [matchId, user]);

    const players = matchData?.players || [];
    const team1 = players.slice(0, 7);
    const team2 = players.slice(7, 14);

    const handleCancelMatch = () => {
        Alert.alert('Maçı İptal Et', 'Emin misiniz?', [
            { text: 'Evet', onPress: () => console.log('Match canceled') },
            { text: 'Hayır' }
        ]);
    };

    const handleInvitePlayer = () => {
        router.push('/Inviteplayer');
    };

    const renderPlayerItem = ({ item }) => (
        <View style={styles.playerItem}>
            <Text style={styles.playerName}>{item.name}</Text>
        </View>
    );

    if (!matchData) {
        return (
            <View style={styles.notFoundContainer}>
                <Text style={styles.notFoundText}>Match not found!</Text>
                <TouchableOpacity
                    style={styles.goBackButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.goBackButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Maçı iptal et (kurucuda görünen kırmızı buton) */}
            <TouchableOpacity style={styles.cancelMatchButton} onPress={handleCancelMatch}>
                <Text style={styles.cancelMatchButtonText}>Maçı İptal Et</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.teamWrapper}>
                    {/* Sol Takım */}
                    <View style={styles.teamContainer}>
                        <Text style={styles.teamTitle}>Team 1</Text>
                        {team1.map((player, index) => (
                            <View key={index} style={styles.playerItem}>
                                <Text style={styles.playerName}>{player.name}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.divider} />

                    {/* Sağ Takım */}
                    <View style={styles.teamContainer}>
                        <Text style={styles.teamTitle}>Team 2</Text>
                        {team2.map((player, index) => (
                            <View key={index} style={styles.playerItem}>
                                <Text style={styles.playerName}>{player.name}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Invite Player altta sabit */}
            <TouchableOpacity style={styles.invitePlayerButton} onPress={handleInvitePlayer}>
                <Text style={styles.invitePlayerButtonText}>Invite Player</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ECF9EC', position: 'relative' },
    cancelMatchButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: '#ff3b30',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        zIndex: 5,
    },
    cancelMatchButtonText: {
        color: '#fff', fontSize: 14, fontWeight: '600',
    },
    scrollContent: {
        paddingTop: 60,
        paddingHorizontal: 10,
        paddingBottom: 120
    },
    teamWrapper: {
        flexDirection: 'row', justifyContent: 'center',
    },
    teamContainer: {
        flex: 1, alignItems: 'center',
    },
    teamTitle: {
        fontSize: 22, fontWeight: '700', color: '#05668D', marginBottom: 15,
    },
    divider: {
        width: 2, backgroundColor: '#02C39A', marginHorizontal: 10, borderRadius: 1
    },
    playerItem: {
        width: width * 0.4,
        backgroundColor: '#FFD36E',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        alignSelf: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
        marginBottom: 10,
    },
    playerName: {
        fontSize: 16, fontWeight: '500', color: '#4A4A4A',
    },
    invitePlayerButton: {
        position: 'absolute',
        bottom: 30, left: (width / 2) - 80,
        width: 160, paddingVertical: 14,
        backgroundColor: '#028090',
        borderRadius: 25, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
    },
    invitePlayerButtonText: {
        color: '#fff', fontSize: 16, fontWeight: '600',
    },
    notFoundContainer: {
        flex: 1, alignItems: 'center', justifyContent: 'center'
    },
    notFoundText: {
        fontSize: 18, marginBottom: 10
    },
    goBackButton: {
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: '#ccc', borderRadius: 8,
    },
    goBackButtonText: {
        color: '#000', fontSize: 14, fontWeight: '600'
    },
});
