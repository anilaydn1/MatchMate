import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Alert,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../config/FirebaseConfig';
import { collection, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// City and district data
const cityDistrictData = {
    'İzmir': [
        'Konak', 'Karşıyaka', 'Buca', 'Bornova', 'Bayraklı', 'Çiğli',
        'Gaziemir', 'Menemen', 'Tire', 'Torbalı', 'Ödemiş', 'Seferihisar',
        'Foça', 'Aliağa', 'Bergama', 'Kınık', 'Selçuk', 'Menderes',
        'Kemalpaşa', 'Kiraz', 'Balçova', 'Narlıdere'
    ],
    'Ankara': [
        'Çankaya', 'Keçiören', 'Mamak', 'Sincan', 'Etimesgut', 'Yenimahalle',
        'Pursaklar', 'Altındağ', 'Çubuk', 'Akyurt', 'Gölbaşı', 'Polatlı',
        'Kızılcahamam', 'Bala', 'Evren', 'Haymana', 'Şereflikoçhisar'
    ],
    'Muğla': [
        'Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz',
        'Marmaris', 'Menteşe', 'Milas', 'Ortaca', 'Seydikemer', 'Ula',
        'Yatağan'
    ],
};

// Selection Modal Component
const SelectionModal = ({ visible, onClose, title, options, onSelect, selectedValue }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {options.map((option) => {
                            const isSelected = selectedValue === option;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.modalOption,
                                        isSelected && styles.modalOptionSelected
                                    ]}
                                    onPress={() => onSelect(option)}
                                >
                                    <Text
                                        style={[
                                            styles.modalOptionText,
                                            isSelected && styles.modalOptionTextSelected
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={onClose}
                    >
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const DatePickerModal = ({ visible, onClose, currentDate, onDateChange }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Date</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={currentDate}
                        mode="date"
                        display="spinner"
                        onChange={(event, date) => onDateChange(event, date)}
                        style={styles.datePicker}
                    />
                    <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const TimePickerModal = ({ visible, onClose, currentTime, onTimeChange }) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Time</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={currentTime}
                        mode="time"
                        display="spinner"
                        onChange={(event, time) => onTimeChange(event, time)}
                        style={styles.datePicker}
                    />
                    <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
                        <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};
const MatchCreate = () => {
    const navigation = useNavigation();
    const [matchName, setMatchName] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [matchDescription, setMatchDescription] = useState('');
    const [matchLocation, setMatchLocation] = useState(null);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectionModalVisible, setSelectionModalVisible] = useState(false);
    const [selectionModalType, setSelectionModalType] = useState(null);

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        setSelectedDate(currentDate);
    };

    const onTimeChange = (event, selectedTime) => {
        const currentTime = selectedTime || new Date();
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        setSelectedTime(currentTime);
    };

    const openSelectionModal = (type) => {
        setSelectionModalType(type);
        setSelectionModalVisible(true);
    };

    const handleSelectionModalSelect = (value) => {
        if (selectionModalType === 'city') {
            setSelectedCity(value);
            setSelectedDistrict('');
        } else if (selectionModalType === 'district') {
            setSelectedDistrict(value);
        }
        setSelectionModalVisible(false);
    };

    const getSelectionModalOptions = () => {
        switch (selectionModalType) {
            case 'city':
                return Object.keys(cityDistrictData);
            case 'district':
                return selectedCity ? cityDistrictData[selectedCity] : [];
            default:
                return [];
        }
    };

    const getSelectionModalTitle = () => {
        switch (selectionModalType) {
            case 'city':
                return 'Select City';
            case 'district':
                return 'Select District';
            default:
                return '';
        }
    };

    const handleCreateMatch = async () => {
        if (!matchName || !selectedCity || !selectedDistrict || !matchDescription) {
            Alert.alert('Warning', 'Please fill in all required fields!');
            return;
        }

        try {
            const storedPlayerId = await AsyncStorage.getItem('playerId');
            if (!storedPlayerId) {
                Alert.alert('Error', 'Profile information not found. Please create a profile first.');
                return;
            }

            const userDocRef = doc(db, 'users', storedPlayerId);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
                Alert.alert('Error', 'User not found in Firestore. Please create a profile first.');
                return;
            }
            const userData = userSnap.data();

            // Create the base match document
            const newMatchDoc = {
                matchName,
                matchDate: formatDate(selectedDate),
                matchTime: formatTime(selectedTime),
                city: selectedCity,
                district: selectedDistrict,
                matchDescription,
                // Only include location if it's set
                ...(matchLocation && {
                    latitude: matchLocation.latitude,
                    longitude: matchLocation.longitude
                }),
                createdAt: new Date().toISOString(),
                status: false,
                playerCount: 1,
                players: [
                    {
                        id: storedPlayerId,
                        name: userData.Name || 'Creator'
                    },
                    { id: '2', name: '' },
                    { id: '3', name: '' },
                    { id: '4', name: '' },
                    { id: '5', name: '' },
                    { id: '6', name: '' },
                    { id: '7', name: '' },
                    { id: '8', name: '' },
                    { id: '9', name: '' },
                    { id: '10', name: '' },
                    { id: '11', name: '' },
                    { id: '12', name: '' },
                    { id: '13', name: '' },
                    { id: '14', name: '' }
                ]
            };

            const docRef = await addDoc(collection(db, 'matches'), newMatchDoc);
            const newMatchId = docRef.id;

            await updateDoc(userDocRef, {
                joinedMatch: userSnap.data().joinedMatch
                    ? [...userSnap.data().joinedMatch, newMatchId]
                    : [newMatchId]
            });

            Alert.alert('Success!', 'Match created successfully!', [
                {
                    text: 'OK',
                    onPress: () => navigation.navigate('home', { matchId: newMatchId })
                }
            ]);

        } catch (error) {
            console.error('Error creating match:', error);
            Alert.alert('Error', 'An error occurred while creating the match. Please try again.');
        }
    };



    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Icon name="trophy-outline" size={20} color="#2F4F2F" />
                            <Text style={styles.label}>Match Name</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter match name"
                            placeholderTextColor="#6B8E6F"
                            value={matchName}
                            onChangeText={setMatchName}
                        />
                    </View>

                    <View style={styles.rowContainer}>
                        <View style={[styles.inputContainer, styles.halfWidth]}>
                            <View style={styles.labelContainer}>
                                <Icon name="calendar" size={20} color="#2F4F2F" />
                                <Text style={styles.label}>Date</Text>
                                <Text style={styles.required}>*</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={styles.pickerButtonText}>
                                    {formatDate(selectedDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.inputContainer, styles.halfWidth]}>
                            <View style={styles.labelContainer}>
                                <Icon name="clock-outline" size={20} color="#2F4F2F" />
                                <Text style={styles.label}>Time</Text>
                                <Text style={styles.required}>*</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.pickerButton}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Text style={styles.pickerButtonText}>
                                    {formatTime(selectedTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Icon name="map-marker" size={20} color="#2F4F2F" />
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.required}>*</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => openSelectionModal('city')}
                        >
                            <Text style={styles.selectButtonText}>
                                {selectedCity || 'Select City'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.selectButton,
                                !selectedCity && styles.selectButtonDisabled,
                                { marginTop: 8 }
                            ]}
                            onPress={() => selectedCity && openSelectionModal('district')}
                            disabled={!selectedCity}
                        >
                            <Text style={[
                                styles.selectButtonText,
                                !selectedCity && styles.selectButtonTextDisabled
                            ]}>
                                {selectedDistrict || 'Select District'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.mapButton, { marginTop: 8 }]}
                            onPress={() => setMapModalVisible(true)}
                        >
                            <Icon name="map-marker" size={20} color="#FFFFFF" />
                            <Text style={styles.mapButtonText}>
                                {matchLocation ? 'Change Map Location' : 'Select Map Location'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.labelContainer}>
                            <Icon name="text" size={20} color="#2F4F2F" />
                            <Text style={styles.label}>Description</Text>
                            <Text style={styles.required}>*</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Add match details..."
                            placeholderTextColor="#6B8E6F"
                            value={matchDescription}
                            onChangeText={setMatchDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>
            </ScrollView>

            <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateMatch}
            >
                <Icon name="check" size={24} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Match</Text>
            </TouchableOpacity>

            {/* Selection Modal */}
            <SelectionModal
                visible={selectionModalVisible}
                onClose={() => setSelectionModalVisible(false)}
                title={getSelectionModalTitle()}
                options={getSelectionModalOptions()}
                onSelect={handleSelectionModalSelect}
                selectedValue={
                    selectionModalType === 'city' ? selectedCity : selectedDistrict
                }
            />

            {/* Map Modal */}
            <Modal visible={mapModalVisible} animationType="slide">
                <View style={styles.mapContainer}>
                    <View style={styles.mapHeader}>
                        <Text style={styles.mapTitle}>Select Location</Text>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)}>
                            <Icon name="close" size={24} color="#4B5563" />
                        </TouchableOpacity>
                    </View>
                    <MapView
                        style={styles.map}
                        initialRegion={{
                            latitude: 37.216,
                            longitude: 28.3636,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05
                        }}
                        onPress={(e) => setMatchLocation(e.nativeEvent.coordinate)}
                    >
                        {matchLocation && <Marker coordinate={matchLocation} />}
                    </MapView>
                    <View style={styles.mapButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.mapButton, styles.mapCancelButton]}
                            onPress={() => setMapModalVisible(false)}
                        >
                            <Icon name="close" size={20} color="#FFFFFF" />
                            <Text style={styles.mapButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.mapButton, styles.mapSaveButton]}
                            onPress={() => setMapModalVisible(false)}
                        >
                            <Icon name="check" size={20} color="#FFFFFF" />
                            <Text style={styles.mapButtonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Date/Time Picker Modals */}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    onChange={onDateChange}
                />
            )}
            {Platform.OS === 'android' && showTimePicker && (
                <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    onChange={onTimeChange}
                />
            )}
            {Platform.OS === 'ios' && (
                <>
                    <DatePickerModal
                        visible={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        currentDate={selectedDate}
                        onDateChange={onDateChange}
                    />
                    <TimePickerModal
                        visible={showTimePicker}
                        onClose={() => setShowTimePicker(false)}
                        currentTime={selectedTime}
                        onTimeChange={onTimeChange}
                    />
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ECF9EC',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    inputContainer: {
        marginBottom: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginLeft: 8,
    },
    required: {
        color: '#EF4444',
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    halfWidth: {
        width: '48%',
    },
    pickerButton: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#1F2937',
    },
    selectButton: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        justifyContent: 'center',
    },
    selectButtonDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#1F2937',
    },
    selectButtonTextDisabled: {
        color: '#9CA3AF',
    },
    mapButton: {
        backgroundColor: '#059669',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginLeft: 8,
    },
    createButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: '#059669',
        paddingVertical: 16,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Map Modal Styles
    mapContainer: {
        flex: 1,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    mapTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    map: {
        flex: 1,
    },
    mapButtonsContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    mapButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        marginHorizontal: 8,
    },
    mapCancelButton: {
        backgroundColor: '#EF4444',
    },
    mapSaveButton: {
        backgroundColor: '#059669',
    },
    // Selection Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#166534',
    },
    modalOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalOptionSelected: {
        backgroundColor: '#DCFCE7',
    },
    modalOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    modalOptionTextSelected: {
        color: '#166534',
        fontWeight: '500',
    },
    modalCloseButton: {
        marginTop: 15,
        padding: 15,
        backgroundColor: '#374151',
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default MatchCreate;
