import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    KeyboardAvoidingView,
    Alert,
    Modal,
} from 'react-native';
import { db } from '../../config/FirebaseConfig';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
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
    'Mugla': [
        'Bodrum', 'Dalaman', 'Datça', 'Fethiye', 'Kavaklıdere', 'Köyceğiz',
        'Marmaris', 'Menteşe', 'Milas', 'Ortaca', 'Seydikemer', 'Ula',
        'Yatağan'
    ],
};

// Otomatik artan playerId almak için counter mekanizması
const getNextPlayerId = async () => {
    const counterRef = doc(db, 'counters', 'playerIdCounter');
    const counterDoc = await getDoc(counterRef);

    let currentId;
    if (!counterDoc.exists()) {
        // Initialize counter if it doesn't exist
        currentId = 1000;
        await setDoc(counterRef, { currentId: currentId });
    } else {
        currentId = counterDoc.data().currentId;
    }

    // Update the counter
    await setDoc(counterRef, { currentId: currentId + 1 });

    return currentId;
};

// Pozisyon seçenekleri
const positions = [
    { label: 'GoalKeeper', value: 'GoalKeeper' },
    { label: 'Defance', value: 'Defance' },
    { label: 'Middlefielder', value: 'Middlefielder' },
    { label: 'Striker', value: 'Striker' }
];

// Şehir, ilçe, pozisyon seçimi için kullanılan modal
const SelectionModal = ({
    visible,
    onClose,
    title,
    options,
    onSelect,
    selectedValue
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <ScrollView>
                        {options.map((option) => {
                            const val = typeof option === 'string' ? option : option.value;
                            const label = typeof option === 'string' ? option : option.label;
                            const isSelected = selectedValue === val;

                            return (
                                <TouchableOpacity
                                    key={val}
                                    style={[
                                        styles.modalOption,
                                        isSelected && styles.modalOptionSelected
                                    ]}
                                    onPress={() => onSelect(val)}
                                >
                                    <Text
                                        style={[
                                            styles.modalOptionText,
                                            isSelected && styles.modalOptionTextSelected
                                        ]}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// Firestore'a profile eklemek için kullanılan fonksiyon
const createProfileInFirestore = async (formData) => {
    try {
        const playerId = await getNextPlayerId();
        const userDatas = {
            playerId: playerId,
            Name: formData.firstName,
            surname: formData.lastName,
            city: formData.city,
            district: formData.district,
            position: formData.position,
            about: formData.about,
            isAvailable: formData.isAvailable,
            email: formData.email,
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', playerId.toString()), userDatas);
        console.log('User successfully added to Firestore with ID:', playerId);
        return playerId;
    } catch (error) {
        console.error('Profile creation error:', error);
        Alert.alert('Error', 'An error occurred while creating the profile.');
        throw error;
    }
};

export default function Profil({ email }) {
    const router = useRouter();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        city: '',
        district: '',
        position: '',
        about: '',
        isAvailable: false,
        email: email || ''
    });

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);

    // Modal'dan seçim yapıldığında
    const handleModalSelect = (value) => {
        if (modalType === 'city') {
            setFormData((prev) => ({ ...prev, city: value, district: '' }));
        } else if (modalType === 'district') {
            setFormData((prev) => ({ ...prev, district: value }));
        } else if (modalType === 'position') {
            setFormData((prev) => ({ ...prev, position: value }));
        }
        setModalVisible(false);
    };

    // Modal açma
    const openModal = (type) => {
        setModalType(type);
        setModalVisible(true);
    };

    // playerId'yi AsyncStorage'de saklama
    const storePlayerId = async (playerId) => {
        try {
            await AsyncStorage.setItem('playerId', playerId.toString());
            console.log('Player ID stored successfully:', playerId);
        } catch (error) {
            console.error('Error storing Player ID:', error);
        }
    };

    // Formu kaydet
    const handleSubmit = async () => {
        // Zorunlu alanlar dolu mu kontrol et
        if (!formData.firstName || !formData.lastName ||
            !formData.city || !formData.district || !formData.position) {
            Alert.alert('Error', 'Please fill all required fields!');
            return;
        }

        try {
            const playerId = await createProfileInFirestore(formData);
            Alert.alert('Success', `Profile created successfully! Your Player ID is: ${playerId}`, [
                {
                    text: 'OK',
                    onPress: async () => {
                        await storePlayerId(playerId);
                        router.back(); // Kayıt sonrası geri dön
                    }
                }
            ]);
            resetForm();
        } catch (error) {
            console.error('Error in handleSubmit:', error);
        }
    };

    // Formu sıfırla
    const resetForm = () => {
        setFormData({
            firstName: '',
            lastName: '',
            city: '',
            district: '',
            position: '',
            about: '',
            isAvailable: false,
            email: email || '',
        });
    };

    // Modal’a hangi seçenekler gelecek?
    const getModalOptions = () => {
        switch (modalType) {
            case 'city':
                return Object.keys(cityDistrictData);
            case 'district':
                return formData.city ? cityDistrictData[formData.city] : [];
            case 'position':
                return positions;
            default:
                return [];
        }
    };

    // Modal başlığı
    const getModalTitle = () => {
        switch (modalType) {
            case 'city':
                return 'Select City';
            case 'district':
                return 'Select District';
            case 'position':
                return 'Select Position';
            default:
                return '';
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            {/* Dıştaki ScrollView (form sayfası uzun olursa dikey kaydırma için) */}
            <ScrollView style={styles.scrollView}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create Your Profile</Text>

                    {/* First Name Input */}
                    <View style={styles.inputGroup}>
                        <Text>
                            <Text style={styles.label}>First Name </Text>
                            <Text style={styles.attention}>* </Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={formData.firstName}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, firstName: text }))
                            }
                            placeholder="Enter your first name"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* Last Name Input */}
                    <View style={styles.inputGroup}>
                        <Text>
                            <Text style={styles.label}>Last Name </Text>
                            <Text style={styles.attention}>* </Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={formData.lastName}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, lastName: text }))
                            }
                            placeholder="Enter your last name"
                            placeholderTextColor="#666"
                        />
                    </View>

                    {/* City Selection */}
                    <View style={styles.inputGroup}>
                        <Text>
                            <Text style={styles.label}>City </Text>
                            <Text style={styles.attention}>* </Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => openModal('city')}
                        >
                            <Text style={styles.selectButtonText}>
                                {formData.city || 'Select a city'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* District Selection */}
                    <View style={styles.inputGroup}>
                        <Text>
                            <Text style={styles.label}>District </Text>
                            <Text style={styles.attention}>* </Text>
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.selectButton,
                                !formData.city && styles.selectButtonDisabled
                            ]}
                            onPress={() => formData.city && openModal('district')}
                            disabled={!formData.city}
                        >
                            <Text
                                style={[
                                    styles.selectButtonText,
                                    !formData.city && styles.selectButtonTextDisabled
                                ]}
                            >
                                {formData.district || 'Select a district'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Position Selection */}
                    <View style={styles.inputGroup}>
                        <Text>
                            <Text style={styles.label}>Desired Playing Position </Text>
                            <Text style={styles.attention}>* </Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.selectButton}
                            onPress={() => openModal('position')}
                        >
                            <Text style={styles.selectButtonText}>
                                {positions.find((p) => p.value === formData.position)?.label ||
                                    'Select a position'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* About Me */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>About Me</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formData.about}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, about: text }))
                            }
                            placeholder="Tell us about yourself, your playing style, and experience..."
                            placeholderTextColor="#666"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <Text>
                        <Text style={styles.attention}>* </Text>
                        <Text style={styles.required}>Required fields</Text>
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Create Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modal (City, District, Position seçimi) */}
            <SelectionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title={getModalTitle()}
                options={getModalOptions()}
                onSelect={handleModalSelect}
                selectedValue={
                    modalType === 'city'
                        ? formData.city
                        : modalType === 'district'
                            ? formData.district
                            : modalType === 'position'
                                ? formData.position
                                : ''
                }
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    attention: {
        color: '#fe1313',
    },
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#166534',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#374151',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    selectButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        justifyContent: 'center',
    },
    selectButtonDisabled: {
        backgroundColor: '#f3f4f6',
        borderColor: '#e5e7eb',
    },
    selectButtonText: {
        fontSize: 16,
        color: '#333',
    },
    selectButtonTextDisabled: {
        color: '#9ca3af',
    },
    required: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: '#7CE279',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#166534',
        marginBottom: 15,
        textAlign: 'center',
    },
    modalOption: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalOptionSelected: {
        backgroundColor: '#dcfce7',
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
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});
