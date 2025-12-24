import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Only import MapView on native platforms
let MapView: any = View;
let Marker: any = View;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

import { Palette } from '@/constants/theme';
import * as Location from 'expo-location';
import { ChevronRight, Clock, Navigation2, Search, SlidersHorizontal } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type StoreLocation = {
  id: string;
  name: string;
  address: string;
  hours: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
};

const STORE_LOCATIONS: StoreLocation[] = [
  {
    id: 'nerimanov19',
    name: 'OBA-NERIMANOV 19',
    address: 'Nərimanov ray., A.Nemətulla küç. 19',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.394321, longitude: 49.855362 },
  },
  {
    id: 'nerimanov',
    name: 'OBA-NERIMANOV 42',
    address: 'Nərimanov ray., H.Əliyev pr. 42',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.405521, longitude: 49.865362 },
  },
  {
    id: 'nzs15',
    name: 'OBA-NZS 15',
    address: 'Xətai ray., NZS qəsəbəsi 15',
    hours: '09:00 - 21:00',
    coordinates: { latitude: 40.377114, longitude: 49.884929 },
  },
  {
    id: 'xetai',
    name: 'OBA-XETAI 8',
    address: 'Xətai ray., M.Hadi küç. 8',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.384321, longitude: 49.935362 },
  },
  {
    id: 'yasamal1',
    name: 'OBA-YASAMAL 1',
    address: 'Yasamal ray., Şərifzadə küç. 142',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.385, longitude: 49.810 },
  },
  {
    id: 'nasimi1',
    name: 'OBA-NASIMI 4',
    address: 'Nəsimi ray., M.Qaşqay küç. 28',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.395, longitude: 49.835 },
  },
  {
    id: 'sahil1',
    name: 'OBA-SAHIL',
    address: 'Səbail ray., Ü.Hacıbəyov küç. 2',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.370, longitude: 49.850 },
  },
  {
    id: 'genclik1',
    name: 'OBA-GENCLIK',
    address: 'Nərimanov ray., F.X.Xoyski pr. 85',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.399, longitude: 49.849 },
  },
  {
    id: 'bayil1',
    name: 'OBA-BAYIL',
    address: 'Səbail ray., Qurban Abbasov küç. 34',
    hours: '09:00 - 22:00',
    coordinates: { latitude: 40.345, longitude: 49.825 },
  },
  {
    id: 'ehmedli1',
    name: 'OBA-EHMEDLI',
    address: 'Xətai ray., Sarayevo küç. 12',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.385, longitude: 49.950 },
  },
  {
    id: 'neftchiler1',
    name: 'OBA-NEFTCHILER',
    address: 'Nizami ray., Q.Qarayev pr. 65',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.410, longitude: 49.940 },
  },
  {
    id: 'azizbeyov1',
    name: 'OBA-AZIZBEYOV',
    address: 'Sabunçu ray., Heydər Əliyev pr. 108',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.420, longitude: 49.920 },
  },
  {
    id: 'bakmil1',
    name: 'OBA-BAKMIL',
    address: 'Nərimanov ray., 7-ci Bakmil döngəsi',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.400, longitude: 49.880 },
  },
  {
    id: 'nizami1',
    name: 'OBA-NIZAMI',
    address: 'Yasamal ray., Nizami m/s yaxınlığı',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.375, longitude: 49.830 },
  },
  {
    id: 'elmler1',
    name: 'OBA-ELMLER',
    address: 'Yasamal ray., B.Vahabzadə küç. 5',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.370, longitude: 49.815 },
  },
  {
    id: 'memar_ecemi1',
    name: 'OBA-MEMAR ECEMI',
    address: 'Nəsimi ray., Cavadxan küç. 24',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.410, longitude: 49.815 },
  },
  {
    id: 'nesimi_bazari1',
    name: 'OBA-NESIMI BAZARI',
    address: 'Nəsimi ray., S.Vurğun küç. 82',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.385, longitude: 49.840 },
  },
  {
    id: 'genclik_mall1',
    name: 'OBA-GENCLIK MALL',
    address: 'Nərimanov ray., F.Xoyski küç. 14',
    hours: '08:00 - 23:00',
    coordinates: { latitude: 40.400, longitude: 49.852 },
  },
  {
    id: 'port_baku1',
    name: 'OBA-PORT BAKU',
    address: 'Nəsimi ray., Neftçilər pr. 151',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.375, longitude: 49.860 },
  },
  {
    id: 'white_city1',
    name: 'OBA-WHITE CITY',
    address: 'Xətai ray., Ağ Şəhər bulvarı',
    hours: '08:00 - 22:00',
    coordinates: { latitude: 40.380, longitude: 49.890 },
  },
];

const DARK_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8ec3b9" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1a3646" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#64779e" }]
  },
  {
    "featureType": "administrative.province",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#4b6878" }]
  },
  {
    "featureType": "landscape.man_made",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#334e87" }]
  },
  {
    "featureType": "landscape.natural",
    "elementType": "geometry",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#6f9ba5" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3C7680" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#304a7d" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#2c6675" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#255766" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#b0d5ce" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#023e58" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#98a5be" }]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#1d2c4d" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#283d6a" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#3a4762" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#0e1626" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#4e6d70" }]
  }
];

const DEFAULT_REGION = {
  latitude: 40.394321,
  longitude: 49.855362,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Custom Marker Component
const MarkerIcon = () => (
  <View style={styles.markerWrapper}>
    <View style={styles.customMarker}>
      <Text style={styles.markerIconText}>🛒</Text>
    </View>
    <View style={styles.markerTail} />
  </View>
);

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
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function BranchesScreen() {
  const mapRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);
  const [userCoordinate, setUserCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const locateUser = useCallback(async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const region = {
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

  const renderMarketItem = (store: any) => (
    <TouchableOpacity key={store.id} style={styles.marketCard}>
      <View style={styles.marketCardLeft}>
        <View style={styles.obaLogoContainer}>
          <Text style={styles.obaLogoText}>OBA</Text>
        </View>
      </View>
      <View style={styles.marketCardContent}>
        <View style={styles.marketHeaderRow}>
          <Text style={styles.marketName}>{store.name}</Text>
          <Text style={styles.distanceText}>{store.distance.toFixed(2)} km</Text>
        </View>
        <Text style={styles.marketAddress}>{store.address}</Text>
        <View style={styles.marketFooter}>
          <Clock size={14} color="#666" />
          <Text style={styles.hoursText}>{store.hours}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Map Background */}
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={DEFAULT_REGION}
          customMapStyle={DARK_MAP_STYLE}
          showsUserLocation
          loadingEnabled
          loadingIndicatorColor={Palette.primary}
        >
          {STORE_LOCATIONS.map(store => (
            <Marker
              key={store.id}
              coordinate={store.coordinates}
              title={store.name}
              description={store.address}
            >
              <MarkerIcon />
            </Marker>
          ))}
        </MapView>

        {isLocating ? (
          <View style={styles.mapOverlays}>
            <ActivityIndicator size="large" color={Palette.primary} />
          </View>
        ) : (
          <View style={styles.mapOverlays}>
            <TouchableOpacity style={styles.locationFab} onPress={locateUser}>
              <Navigation2 size={24} color={Palette.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Overlay Panel */}
      <View style={styles.panel}>
        <View style={styles.dragHandle} />

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Filial axtar..."
              placeholderTextColor="#ccc"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <SlidersHorizontal size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sortedByText}>Ən yaxın OBA Marketlər</Text>

        <ScrollView
          style={styles.listContent}
          scrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {storesWithDistance.map(renderMarketItem)}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapWrapper: {
    height: SCREEN_HEIGHT * 0.45,
    width: SCREEN_WIDTH,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlays: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 20,
  },
  locationFab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  customMarker: {
    width: 30,
    height: 30,
    borderRadius: 25,
    backgroundColor: Palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  markerIconText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
  },
  markerTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Palette.primary,
    marginTop: -2,
  },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -40,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#e5e5e5',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    marginLeft: 10,
    fontWeight: '500',
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  sortedByText: {
    paddingHorizontal: 28,
    marginTop: 24,
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 60,
  },
  marketCard: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  marketCardLeft: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  obaLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  obaLogoText: {
    color: Palette.secondary,
    fontWeight: '900',
    fontSize: 14,
    fontStyle: 'italic',
  },
  marketCardContent: {
    flex: 1,
  },
  marketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  marketName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  distanceText: {
    color: Palette.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  marketAddress: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  marketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hoursText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});