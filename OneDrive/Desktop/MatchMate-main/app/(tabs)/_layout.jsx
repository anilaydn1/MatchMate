import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import Colors from './../../constants/Colors'



export default function TabLayout() {
  return (

    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.PRIMARY
      }}
    >
      <Tabs.Screen name='home'
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen name='MyMatches'
        options={{
          title: 'Matches',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="football" size={24} color={color} />
        }}

      />
      <Tabs.Screen name='profile'
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }}
      />
    </Tabs>
  )
}