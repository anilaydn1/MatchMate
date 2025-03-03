import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Keyboard,
    ScrollView,
    Modal,
    SafeAreaView,
    TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { db } from '../../config/FirebaseConfig';
import { collection, onSnapshot } from 'firebase/firestore';

const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00"
];

const cityData = {
    'İzmir': {
        name: "İzmir",
        districts: [
            "Konak", "Karşıyaka", "Buca", "Bornova", "Bayraklı", "Cigli",
            "Gaziemir", "Menemen", "Tire", "Torbalı", "Ödemiş", "Seferihisar",
            "Foça", "Aliağa", "Bergama", "Kınık", "Selçuk", "Menderes",
            'Kemalpaşa', 'Kiraz', 'Balçova', 'Narlıdere'
        ]
    },
    'Ankara': {
        name: "Ankara",
        districts: ["Çankaya", "Keçiören", "Mamak", "Sincan", "Etimesgut", "Yenimahalle",
            "Pursaklar", "Altındağ", "Çubuk", "Akyurt", "Gölbaşı", "Polatlı",
            "Kızılcahamam", "Bala", "Evren", "Haymana", "Şereflikoçhisar"]
    },
    "Muğla": {
        name: "Muğla",
        districts: ["Bodrum", "Dalaman", "Datça", "Fethiye", "Kavaklıdere", "Köyceğiz",
            "Marmaris", "Menteşe", "Milas", "Ortaca", "Seydikemer", "Ula",
            "Yatağan"]
    }
};


const SearchMatch = () => {
    const router = useRouter();
    const [showFilter, setShowFilter] = useState(false);
    const [matchNameFilter, setMatchNameFilter] = useState('');
    const [startTimeFilter, setStartTimeFilter] = useState('');
    const [endTimeFilter, setEndTimeFilter] = useState('');
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [matches, setMatches] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]);

    useEffect(() => {
        setDistrict('');
    }, [city]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'matches'), (snapshot) => {
            const fetchedMatches = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMatches(fetchedMatches);
            setFilteredMatches(fetchedMatches);
        });
        return () => unsubscribe();
    }, []);

    const convertTimeToNumber = (timeString) => {
        if (!timeString) return null;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 100 + minutes;
    };

    const isTimeInRange = (matchTime, startTime, endTime) => {
        if (!matchTime || !startTime || !endTime) return true;

        const matchTimeNum = convertTimeToNumber(matchTime);
        const startTimeNum = convertTimeToNumber(startTime);
        const endTimeNum = convertTimeToNumber(endTime);

        if (!matchTimeNum || !startTimeNum || !endTimeNum) return true;

        return matchTimeNum >= startTimeNum && matchTimeNum <= endTimeNum;
    };

    const handleFilter = () => {
        Keyboard.dismiss();
        const newList = matches.filter(m => {
            const nameMatch = matchNameFilter
                ? m.matchName?.toLowerCase().includes(matchNameFilter.toLowerCase())
                : true;

            const timeMatch = isTimeInRange(m.matchTime, startTimeFilter, endTimeFilter);

            const cityMatch = city
                ? m.city?.toLowerCase() === city.toLowerCase()
                : true;

            const districtMatch = district
                ? m.district?.toLowerCase() === district.toLowerCase()
                : true;

            return nameMatch && timeMatch && cityMatch && districtMatch;
        });
        setFilteredMatches(newList);
        setShowFilter(false);
    };

    const handleResetFilter = () => {
        setMatchNameFilter('');
        setStartTimeFilter('');
        setEndTimeFilter('');
        setCity('');
        setDistrict('');
        setFilteredMatches(matches);
        Keyboard.dismiss();
        setShowFilter(false);
    };

    const renderMatchCard = ({ item }) => (
        <TouchableOpacity
            style={styles.matchCard}
            onPress={() => router.push(`/(stack)/TeamSelectionParticipant?matchId=${item.id}`)}
        >
            <Text style={styles.matchName}>{item.matchName}</Text>
            <View style={styles.matchInfoContainer}>
                <View style={styles.matchInfoRow}>
                    <Text style={styles.infoLabel}>📅 Date:</Text>
                    <Text style={styles.infoText}>{item.matchDate}</Text>
                </View>
                <View style={styles.matchInfoRow}>
                    <Text style={styles.infoLabel}>⏰ Time:</Text>
                    <Text style={styles.infoText}>{item.matchTime}</Text>
                </View>
                <View style={styles.matchInfoRow}>
                    <Text style={styles.infoLabel}>👥 Players:</Text>
                    <Text style={styles.infoText}>{item.playerCount}/14</Text>
                </View>
                <View style={styles.matchInfoRow}>
                    <Text style={styles.infoLabel}>📍 Location:</Text>
                    <Text style={styles.infoText}>{item.locationName}</Text>
                </View>
                <Text style={styles.cityText}>{item.city} - {item.district}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Available Matches</Text>
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFilter(true)}
                    >
                        <Text style={styles.filterButtonText}>Filter</Text>
                    </TouchableOpacity>
                </View>

                <Modal
                    visible={showFilter}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowFilter(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Filter Matches</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Match Name"
                                value={matchNameFilter}
                                onChangeText={setMatchNameFilter}
                            />

                            <View style={styles.pickerContainer}>
                                <Text style={styles.pickerLabel}>Start Time</Text>
                                <View style={styles.picker}>
                                    <Picker
                                        selectedValue={startTimeFilter}
                                        onValueChange={(itemValue) => {
                                            setStartTimeFilter(itemValue);
                                            if (endTimeFilter && convertTimeToNumber(itemValue) > convertTimeToNumber(endTimeFilter)) {
                                                setEndTimeFilter('');
                                            }
                                        }}
                                    >
                                        <Picker.Item label="Select Start Time" value="" />
                                        {timeSlots.map((time) => (
                                            <Picker.Item
                                                key={`start-${time}`}
                                                label={time}
                                                value={time}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.pickerContainer}>
                                <Text style={styles.pickerLabel}>End Time</Text>
                                <View style={styles.picker}>
                                    <Picker
                                        selectedValue={endTimeFilter}
                                        onValueChange={(itemValue) => setEndTimeFilter(itemValue)}
                                        enabled={!!startTimeFilter}
                                    >
                                        <Picker.Item label="Select End Time" value="" />
                                        {timeSlots
                                            .filter(time => !startTimeFilter ||
                                                convertTimeToNumber(time) >= convertTimeToNumber(startTimeFilter))
                                            .map((time) => (
                                                <Picker.Item
                                                    key={`end-${time}`}
                                                    label={time}
                                                    value={time}
                                                />
                                            ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.pickerContainer}>
                                <Text style={styles.pickerLabel}>City</Text>
                                <View style={styles.picker}>
                                    <Picker
                                        selectedValue={city}
                                        onValueChange={(itemValue) => setCity(itemValue)}
                                    >
                                        <Picker.Item label="Select City" value="" />
                                        {Object.keys(cityData).map((cityKey) => (
                                            <Picker.Item
                                                key={cityKey}
                                                label={cityData[cityKey].name}
                                                value={cityKey}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.pickerContainer}>
                                <Text style={styles.pickerLabel}>District</Text>
                                <View style={styles.picker}>
                                    <Picker
                                        selectedValue={district}
                                        onValueChange={(itemValue) => setDistrict(itemValue)}
                                        enabled={!!city}
                                    >
                                        <Picker.Item label="Select District" value="" />
                                        {city && cityData[city].districts.map((districtName) => (
                                            <Picker.Item
                                                key={districtName}
                                                label={districtName}
                                                value={districtName}
                                            />
                                        ))}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.resetButton]}
                                    onPress={handleResetFilter}
                                >
                                    <Text style={styles.buttonText}>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.applyButton]}
                                    onPress={handleFilter}
                                >
                                    <Text style={styles.buttonText}>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {filteredMatches.length === 0 ? (
                    <View style={styles.noMatchesContainer}>
                        <Text style={styles.noMatchesText}>No matches found</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredMatches}
                        renderItem={renderMatchCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </SafeAreaView>
        </>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECF9EC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E1E4E8',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A1A1A',
    },
    filterButton: {
        backgroundColor: '#4299E1',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    filterButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1A1A1A',
    },
    input: {
        backgroundColor: '#F6F7F9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    timeInputContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    timeInput: {
        flex: 1,
    },
    pickerContainer: {
        marginBottom: 12,
    },
    pickerLabel: {
        fontSize: 16,
        marginBottom: 4,
        color: '#4A5568',
    },
    picker: {
        backgroundColor: '#F6F7F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E1E4E8',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 16,
    },
    button: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    resetButton: {
        backgroundColor: '#9CA3AF',
    },
    applyButton: {
        backgroundColor: '#4299E1',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
    matchCard: {
        backgroundColor: '#BBDEFB',
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
    matchName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#102027',
        marginBottom: 12,
    },
    matchInfoContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 12,
        borderRadius: 8,
    },
    matchInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#37474F',
        width: 90,
    },
    infoText: {
        fontSize: 14,
        color: '#102027',
        flex: 1,
    },
    cityText: {
        fontSize: 14,
        color: '#4299E1',
        marginTop: 4,
    },
    listContainer: {
        padding: 16,
    },
    noMatchesContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMatchesText: {
        fontSize: 16,
        color: '#4A5568',
    }
});

export default SearchMatch;
