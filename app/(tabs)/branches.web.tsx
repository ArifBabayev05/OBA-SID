import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { MapPin, RefreshCw, Navigation } from 'lucide-react-native';

const STORE_LOCATIONS = [
  {
    id: 'xetai',
    name: 'Xətai Market Mərkəzi',
    address: 'Əhməd Rəcəbli küç. 4',
    coordinates: { latitude: 40.394321, longitude: 49.855362 },
  },
  {
    id: 'port',
    name: 'Port Mall Market',
    address: 'Neftçilər pr. 153',
    coordinates: { latitude: 40.369952, longitude: 49.849912 },
  },
  {
    id: 'may28',
    name: '28 May Ailə Marketi',
    address: '28 May küç. 10',
    coordinates: { latitude: 40.377114, longitude: 49.854929 },
  },
  {
    id: 'genclik',
    name: 'Gənclik Park filialı',
    address: 'F. Xoyski 31',
    coordinates: { latitude: 40.397799, longitude: 49.852947 },
  },
  {
    id: 'yasamal',
    name: 'Yasamal Plaza Market',
    address: 'H. Əliyev pr. 12',
    coordinates: { latitude: 40.38492, longitude: 49.82041 },
  },
  {
    id: 'nizami',
    name: 'Nizami Küçə Market',
    address: 'Nizami 85',
    coordinates: { latitude: 40.37592, longitude: 49.83562 },
  },
  {
    id: 'sumqayit',
    name: 'Sumqayıt Xidmət Mərkəzi',
    address: 'Sülh küç. 9, Sumqayıt',
    coordinates: { latitude: 40.58955, longitude: 49.66827 },
  },
];

export default function BranchesScreenWeb() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.webWarning}>
        <MapPin size={48} color="#4ade80" />
        <Text style={styles.webWarningTitle}>Xəritə yalnız mobil tətbiqdə əlçatandır</Text>
        <Text style={styles.webWarningSubtitle}>
          Veb versiyada hal-hazırda xəritə dəstəklənmir. Filialların siyahısını aşağıda görə bilərsiniz.
        </Text>
      </View>

      <View style={styles.overlayCard}>
        <View>
          <Text style={styles.overlayTitle}>Filiallarımız</Text>
          <Text style={styles.overlaySubtitle}>Bütün mağazalar siyahısı</Text>
        </View>
        <TouchableOpacity style={styles.refreshButton}>
          <RefreshCw size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storeScroll}
        contentContainerStyle={styles.storeScrollContent}
      >
        {STORE_LOCATIONS.map(store => (
          <View key={store.id} style={styles.storeCard}>
            <View style={styles.storeCardHeader}>
              <MapPin size={18} color="#4ade80" />
              <Text style={styles.storeName}>{store.name}</Text>
            </View>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.latitude},${store.coordinates.longitude}`, '_blank')}
            >
              <Navigation size={16} color="#0f172a" />
              <Text style={styles.directionsText}>Xəritədə aç</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050B16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webWarning: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 400,
  },
  webWarningTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    textAlign: 'center',
  },
  webWarningSubtitle: {
    color: '#94A3B8',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  overlayCard: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(5,11,22,0.92)',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  overlayTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  overlaySubtitle: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 13,
  },
  refreshButton: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: '#4ADE80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeScroll: {
    position: 'absolute',
    bottom: 40,
  },
  storeScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  storeCard: {
    width: 260,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  storeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  storeName: {
    color: '#F8FAFC',
    fontWeight: '600',
    fontSize: 15,
    flexShrink: 1,
  },
  storeAddress: {
    color: '#94A3B8',
    fontSize: 13,
  },
  directionsButton: {
    marginTop: 12,
    backgroundColor: '#FACC15',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionsText: {
    color: '#0f172a',
    fontWeight: '600',
  },
});

