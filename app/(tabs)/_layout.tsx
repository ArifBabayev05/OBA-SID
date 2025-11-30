import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Store, ScanLine, MapPin, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: '#84cc16',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: '#1e293b',
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: 16,
            paddingTop: 12,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            marginTop: 4,
            fontWeight: '500',
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Əsas',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="products"
          options={{
            title: 'Məhsullar',
            tabBarIcon: ({ color }) => <Store size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="scan"
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={styles.scanButtonContainer}>
                <View style={styles.scanButton}>
                  <ScanLine size={28} color="#ffffff" />
                </View>
              </View>
            ),
            tabBarLabel: () => null,
            tabBarStyle: { 
              position: 'absolute',
              height: 0,
              opacity: 0,
              pointerEvents: 'none',
            },
          }}
        />

        <Tabs.Screen
          name="branches"
          options={{
            title: 'Mağazalar',
            tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scanButtonContainer: {
    position: 'relative',
    top: -10,
  },
  scanButton: {
    height: 74,
    width: 74,
    borderRadius: 50,
    backgroundColor: '#84cc16',
    borderWidth: 4,
    borderColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
