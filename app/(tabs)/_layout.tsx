import { Tabs } from 'expo-router';
import { Grid, Home, MapPin, Percent, ScanLine } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { Palette } from '../../constants/theme';

export default function TabLayout() {
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: Palette.primary,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            height: 75,
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#f3f4f6',
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          }
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Ana səhifə',
            tabBarIcon: ({ color }) => <Home size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="recommendations"
          options={{
            title: 'Kompaniyalar',
            tabBarIcon: ({ color }) => <Percent size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="scan"
          options={{
            title: '',
            tabBarIcon: () => (
              <View style={styles.scanButtonContainer}>
                <View style={styles.scanButton}>
                  <ScanLine size={26} color="#ffffff" />
                </View>
              </View>
            ),
            tabBarLabel: () => null,
          }}
        />

        <Tabs.Screen
          name="branches"
          options={{
            title: 'Filiallar',
            tabBarIcon: ({ color }) => <MapPin size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Daha çox',
            tabBarIcon: ({ color }) => <Grid size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="products"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scanButtonContainer: {
    position: 'relative',
    top: -12,
  },
  scanButton: {
    height: 74,
    width: 74,
    borderRadius: 47,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});
