import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, Navigation, RefreshCw } from 'lucide-react-native';

type StoreLocation = {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

const STORE_LOCATIONS: StoreLocation[] = [
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

const DEFAULT_REGION: Region = {
  latitude: 40.409264,
  longitude: 49.867092,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a2131' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'water', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', stylers: [{ color: '#2a3142' }] },
  { featureType: 'poi', stylers: [{ color: '#182034' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const toRad = (value: number) => (value * Math.PI) / 180;
const haversineDistance = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) => {
  const R = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function BranchesScreen() {
  const mapRef = useRef<MapView | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [userCoordinate, setUserCoordinate] = useState<{ latitude: number; longitude: number } | null>(
    null,
  );

  const locateUser = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const region: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      };
      setUserCoordinate(region);
      mapRef.current?.animateToRegion(region, 800);
    } catch (error) {
      console.warn('Unable to fetch location', error);
    } finally {
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    locateUser();
  }, [locateUser]);

  const storesWithDistance = useMemo(() => {
    return STORE_LOCATIONS.map(store => {
      const distance =
        userCoordinate != null
          ? haversineDistance(userCoordinate, store.coordinates)
          : haversineDistance(DEFAULT_REGION, store.coordinates);
      return { ...store, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [userCoordinate]);

  const handleOpenDirections = (store: StoreLocation) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.latitude},${store.coordinates.longitude}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        initialRegion={DEFAULT_REGION}
        style={StyleSheet.absoluteFill}
        customMapStyle={mapDarkStyle}
        showsUserLocation={false}
        showsCompass={false}
      >
        {userCoordinate && (
          <Marker coordinate={userCoordinate} pinColor="#4ade80">
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}
        {STORE_LOCATIONS.map(store => (
          <Marker
            key={store.id}
            coordinate={store.coordinates}
            title={store.name}
            description={store.address}
          >
            <View style={styles.storeMarker}>
              <MapPin size={18} color="#f97316" />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={styles.overlayCard}>
        <View>
          <Text style={styles.overlayTitle}>Ətrafınızdakı filiallar</Text>
          <Text style={styles.overlaySubtitle}>
            {permissionDenied
              ? 'Lokasiya icazəsi olmadan paytaxta yaxın filialları göstəririk.'
              : 'Yerləşdiyin mövqeyə görə təkliflər yenilənir.'}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={locateUser} disabled={isLocating}>
          {isLocating ? <ActivityIndicator color="#fff" /> : <RefreshCw size={18} color="#fff" />}
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.storeScroll}
        contentContainerStyle={styles.storeScrollContent}
      >
        {storesWithDistance.map(store => (
          <View key={store.id} style={styles.storeCard}>
            <View style={styles.storeCardHeader}>
              <MapPin size={18} color="#4ade80" />
              <Text style={styles.storeName}>{store.name}</Text>
            </View>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <Text style={styles.storeDistance}>{store.distance.toFixed(1)} km uzaqlıqda</Text>
            <TouchableOpacity
              style={styles.directionsButton}
              onPress={() => handleOpenDirections(store)}
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
    bottom: 20,
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
  storeDistance: {
    color: '#FACC15',
    marginTop: 8,
    fontWeight: '600',
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
  userMarker: {
    height: 26,
    width: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(74,222,128,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  userMarkerInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
  },
  storeMarker: {
    height: 26,
    width: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(249,115,22,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.6)',
  },
});
