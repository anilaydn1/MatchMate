// app/(stack)/_layout.jsx
import { Stack } from 'expo-router';

export default function HiddenStackLayout() {
    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen
                name="MatchCreate"
                options={{ title: 'Create Match' }}
            />
            <Stack.Screen
                name="SearchMatch"
                options={{ title: 'Search Match' }}
            />
            <Stack.Screen
                name="TeamSelectionCreator"
                options={{ title: 'Team Selection (Creator)' }}
            />
            <Stack.Screen
                name="TeamSelectionParticipant"
                options={{ title: 'Team Selection (Participant)' }}
            />
            <Stack.Screen
                name="Inviteplayer"
                options={{ title: 'Invite Player' }}
            />
        </Stack>
    );
}
