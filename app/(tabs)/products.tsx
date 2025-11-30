import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StatusBar, StyleSheet, Dimensions, Modal } from 'react-native';
import { Search, SlidersHorizontal, Plus, ShoppingCart, X, ArrowUpDown } from 'lucide-react-native';
import { FEATURED_PRODUCTS, RECOMMENDED_PRODUCTS, CATEGORIES } from '@/data/mockData';
import { CustomModal } from '@/components/CustomModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CATEGORY_FILTERS = ['Hamısı', ...CATEGORIES.map(category => category.name)];

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

export default function ProductsScreen() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_FILTERS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [cart, setCart] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ title: '', message: '', type: 'info' });

  const allProducts = useMemo(() => [...FEATURED_PRODUCTS, ...RECOMMENDED_PRODUCTS], []);

  const filteredProducts = useMemo(() => {
    let filtered = allProducts.filter(product => {
      const matchesCategory = selectedCategory === CATEGORY_FILTERS[0] || product.category === selectedCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.store.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, selectedCategory, searchQuery, sortBy]);

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  const handleAddToCart = (productId: string) => {
    const id = parseInt(productId);
    if (!cart.includes(id)) {
      setCart([...cart, id]);
      showModal('Added to Cart', 'Product added to cart successfully!', 'success');
    } else {
      showModal('Already in Cart', 'This product is already in your cart', 'info');
    }
  };

  const handleBasketPress = () => {
    if (cart.length === 0) {
      showModal('Empty Cart', 'Your cart is empty. Add some products!', 'info');
    } else {
      showModal('Cart', `You have ${cart.length} item(s) in your cart`, 'info');
    }
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
      </View>
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.productStore}>{item.store}</Text>
      <View style={styles.productFooter}>
        <View>
          <Text style={styles.productOldPrice}>{(item.price * 1.2).toFixed(2)}₼</Text>
          <Text style={styles.productPrice}>{item.price.toFixed(2)}₼</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addButton, cart.includes(parseInt(item.id)) && styles.addButtonActive]}
          onPress={() => handleAddToCart(item.id)}
        >
          <Plus size={20} color={cart.includes(parseInt(item.id)) ? "#ffffff" : "#365314"} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search products..." 
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(true)}>
          <SlidersHorizontal size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList 
          data={CATEGORY_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          keyExtractor={i => i}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setSelectedCategory(item)}
              style={[styles.categoryButton, item === selectedCategory ? styles.categoryButtonActive : styles.categoryButtonInactive]}
            >
              <Text style={[styles.categoryText, item === selectedCategory ? styles.categoryTextActive : styles.categoryTextInactive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your search or filter</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity style={styles.basketButton} onPress={handleBasketPress}>
        <Text style={styles.basketText}>My basket {cart.length > 0 && `(${cart.length})`}</Text>
        <ShoppingCart size={20} color="white" />
      </TouchableOpacity>

      <Modal
        visible={showFilter}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilter(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortSection}>
              <Text style={styles.sortTitle}>Sort by</Text>
              {[
                { value: 'name-asc', label: 'Name (A-Z)' },
                { value: 'name-desc', label: 'Name (Z-A)' },
                { value: 'price-asc', label: 'Price (Low to High)' },
                { value: 'price-desc', label: 'Price (High to Low)' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sortOption, sortBy === option.value && styles.sortOptionActive]}
                  onPress={() => setSortBy(option.value as SortOption)}
                >
                  <ArrowUpDown size={16} color={sortBy === option.value ? '#1a2e05' : '#9ca3af'} />
                  <Text style={[styles.sortOptionText, sortBy === option.value && styles.sortOptionTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={() => setShowFilter(false)}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 64, 
  },
  header: {
    paddingHorizontal: Math.max(16, SCREEN_WIDTH * 0.04),
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    height: 48,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: 'white',
    fontSize: 14,
  },
  filterButton: {
    height: 48,
    width: 48,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContainer: {
    paddingVertical: 16,
  },
  categoriesList: {
    paddingLeft: Math.max(16, SCREEN_WIDTH * 0.04),
  },
  categoryButton: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#84cc16',
    shadowColor: '#84cc16',
    shadowOpacity: 0.3,
  },
  categoryButtonInactive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryText: {
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#1a2e05',
    fontWeight: 'bold',
  },
  categoryTextInactive: {
    color: '#d1d5db',
  },
  productsList: {
    padding: Math.max(8, SCREEN_WIDTH * 0.02),
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    margin: Math.max(8, SCREEN_WIDTH * 0.02),
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
    maxWidth: (SCREEN_WIDTH - 48) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  productImageContainer: {
    height: Math.min(112, SCREEN_WIDTH * 0.28),
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  productName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    minHeight: 40,
  },
  productStore: {
    color: '#9ca3af',
    fontSize: 11,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productOldPrice: {
    color: '#9ca3af',
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    color: '#84cc16',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addButton: {
    height: 32,
    width: 32,
    backgroundColor: '#d9f99d',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  addButtonActive: {
    backgroundColor: '#84cc16',
  },
  basketButton: {
    position: 'absolute',
    bottom: 96,
    right: 16,
    backgroundColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 50,
  },
  basketText: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 8,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sortSection: {
    marginBottom: 24,
  },
  sortTitle: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#121212',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sortOptionActive: {
    backgroundColor: '#84cc16',
    borderColor: '#84cc16',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sortOptionText: {
    color: '#9ca3af',
    marginLeft: 12,
    fontSize: 16,
  },
  sortOptionTextActive: {
    color: '#1a2e05',
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#84cc16',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: '#1a2e05',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
