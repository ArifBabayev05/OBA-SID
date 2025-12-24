import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StatusBar, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView 
} from 'react-native';
import { Search, ClipboardList } from 'lucide-react-native';
import { CATEGORIES } from '@/data/mockData';
import { Palette } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Extended categories to match the screenshot more closely
const DISPLAY_CATEGORIES = [
  { id: '1', name: 'Şirniyyat', color: Palette.lightGreen, image: 'https://cdn-icons-png.flaticon.com/512/2953/2953361.png' },
  { id: '2', name: 'Quru qida', color: Palette.lightYellow, image: 'https://cdn-icons-png.flaticon.com/512/1041/1041916.png' },
  { id: '3', name: 'Meyvə-tərəvəz', color: Palette.lightGreen, image: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png' },
  { id: '4', name: 'İçkilər', color: Palette.lightGreen, image: 'https://cdn-icons-png.flaticon.com/512/3050/3050130.png' },
  { id: '5', name: 'Un məmulatları', color: Palette.lightGreen, image: 'https://cdn-icons-png.flaticon.com/512/3014/3014534.png' },
  { id: '6', name: 'Tütün məmulatları', color: Palette.lightYellow, image: 'https://cdn-icons-png.flaticon.com/512/3003/3003194.png' },
  { id: '7', name: 'Təmizlik', color: Palette.lightYellow, image: 'https://cdn-icons-png.flaticon.com/512/2975/2975101.png' },
  { id: '8', name: 'Süd məhsulları', color: Palette.lightGreen, image: 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png' },
  { id: '9', name: 'Ət məhsulları', color: Palette.lightYellow, image: 'https://cdn-icons-png.flaticon.com/512/1134/1134447.png' },
  { id: '10', name: 'Digər', color: Palette.lightGreen, image: 'https://cdn-icons-png.flaticon.com/512/1008/1008017.png' },
];

export default function ProductsScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const renderCategory = ({ item }: { item: typeof DISPLAY_CATEGORIES[0] }) => (
    <TouchableOpacity style={[styles.categoryCard, { backgroundColor: item.color }]}>
      <Image source={{ uri: item.image }} style={styles.categoryImage} resizeMode="contain" />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Products</Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Search Bar Container */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Search" 
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Search size={22} color={Palette.secondary} />
        </View>
      </View>

      {/* Categories Grid */}
      <FlatList
        data={DISPLAY_CATEGORIES}
        renderItem={renderCategory}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
        <ClipboardList size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: Palette.primary,
    paddingBottom: 40,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
  },
  headerContent: {
    paddingHorizontal: 25,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  searchSection: {
    marginTop: -30,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 55,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  gridContent: {
    paddingHorizontal: 15,
    paddingBottom: 100,
  },
  categoryCard: {
    flex: 1,
    margin: 8,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  categoryImage: {
    width: '70%',
    height: '60%',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#7DB08E', // Muted green from screenshot
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
});
