import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Easing,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ImageIcon, QrCode, RefreshCw, ArrowLeft, CheckCircle, Zap, Receipt as ReceiptIcon, ShoppingCart, MapPin, Loader2 } from 'lucide-react-native';

import { processReceiptImage, processQRCode } from '@/services/ocrService';
import { saveReceipt } from '@/services/storageService';
import { identifyProductFromImage, ProductAnalysis } from '@/services/aiService';
import { CustomModal } from '@/components/CustomModal';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ScanMode = 'receipt' | 'product';

export default function ScanScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const initialMode: ScanMode = params?.mode === 'product' ? 'product' : 'receipt';
  const [scanMode, setScanMode] = useState<ScanMode>(initialMode);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  
  const [scanAnimation] = useState(new Animated.Value(0));
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>({ title: '', message: '', type: 'info' });
  const [processingHint, setProcessingHint] = useState('');
  const processingAnim = useRef(new Animated.Value(0)).current;

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModalConfig({ title, message, type });
    setModalVisible(true);
  };

  // Scan animation
  const startScanAnimation = useCallback(() => {
    animationRef.current?.stop();
    scanAnimation.setValue(0);
    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    animationRef.current.start();
  }, [scanAnimation]);

  const resetScanner = useCallback(() => {
    setScanned(false);
    setIsProcessing(false);
    setCapturedImage(null);
    setProductAnalysis(null);
    setProcessingHint('');
    startScanAnimation();
  }, [startScanAnimation]);

  useFocusEffect(
    useCallback(() => {
      resetScanner();
      return () => {
        animationRef.current?.stop();
      };
    }, [resetScanner])
  );

  useEffect(() => {
    if (isProcessing) {
      Animated.loop(
        Animated.timing(processingAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.linear,
        })
      ).start();
    } else {
      processingAnim.stopAnimation();
      processingAnim.setValue(0);
    }
  }, [isProcessing, processingAnim]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.permissionTitle}>Camera permission needed</Text>
        <Text style={styles.permissionText}>
          Allow camera access to scan receipts and identify products.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string, data: string }) => {
    if (scanned || scanMode !== 'receipt') return;

    if (!data.startsWith('https://monitoring.e-kassa.gov.az')) {
      showModal('Yanlış QR', 'Bu QR e-kassa formatında deyil.', 'warning');
      setScanned(false);
      setIsProcessing(false);
      setCapturedImage(null);
      return;
    }

    setScanned(true);
    setIsProcessing(true);
    
    try {
      const receiptData = await processQRCode(data);
      const status = await saveReceipt(receiptData as any);

      if (status === 'duplicate') {
        showModal('Already processed', 'This receipt fiscal ID already exists.', 'warning');
        resetScanner();
        return;
      }
      
      showModal(
        'Success!',
        `Receipt processed from QR code.\nTotal: ${receiptData.totalAmount?.toFixed(2)}₼\nItems: ${receiptData.items?.length || 0}`,
        'success'
      );
      
      setTimeout(() => {
        resetScanner();
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error processing QR:', error.message);
      showModal('Error', error.message || 'Failed to process QR code', 'error');
      resetScanner();
    }
  };

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({ quality: 0.5, base64: true });
        if (photo) {
          handleImage(photo.uri);
        }
      } catch (error) {
        console.error('Failed to take picture', error);
        showModal('Error', 'Failed to take picture', 'error');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      handleImage(result.assets[0].uri);
    }
  };

  const handleImage = async (uri: string) => {
    setCapturedImage(uri);
    setIsProcessing(true);
    setProcessingHint(scanMode === 'receipt' ? 'Qəbz detalları oxunur...' : 'Smart Lens məhsulu analiz edir...');
    
    try {
      if (scanMode === 'receipt') {
        // Receipt Logic
        const receiptData = await processReceiptImage(uri);
        
        const totalAmount = receiptData?.totalAmount;

        if (!receiptData || !receiptData.text || !totalAmount || Number(totalAmount) <= 0) {
          showModal('Qəbz tapılmadı', 'Zəhmət olmasa e-kassa qəbzini və QR-ni kameraya yaxınlaşdırın.', 'warning');
          setIsProcessing(false);
          setProcessingHint('');
          setCapturedImage(null);
          return;
        }

        if (receiptData.text) {
          const status = await saveReceipt(receiptData as any);
          if (status === 'duplicate') {
            showModal('Already processed', 'This receipt fiscal ID already exists.', 'warning');
            resetScanner();
            return;
          }
          setProcessingHint('');
          showModal(
            'Success!',
            `Receipt processed.\nTotal: ${receiptData.totalAmount?.toFixed(2)}₼\nItems: ${receiptData.items?.length || 0}`,
            'success'
          );
          
          setTimeout(() => {
            setCapturedImage(null);
            resetScanner();
            router.push('/');
          }, 2000);
        }
      } else {
        // Smart Lens Logic
        const analysis = await identifyProductFromImage(uri);
        setIsProcessing(false);
        if (analysis) {
          setProductAnalysis(analysis);
          setProcessingHint('');
        } else {
          showModal('Not identified', 'Could not identify the product. Try getting closer or better lighting.', 'warning');
          setCapturedImage(null);
          setProcessingHint('');
        }
      }
    } catch (error: any) {
      if (scanMode === 'product') {
        if (error?.code === 'NO_PRODUCT') {
          showModal('Məhsul tapılmadı', 'Yaxın məsafədən yalnız məhsulun şəklini çəkin.', 'warning');
        } else if (error?.code === 'NO_PRICE_DATA') {
          showModal('Qiymət yoxdur', 'Bu məhsul üçün qiymət məlumatı tapılmadı.', 'info');
        } else {
          showModal('Smart Lens xətası', error?.message || 'Məhsulu analiz etmək mümkün olmadı.', 'error');
        }
        setIsProcessing(false);
        setProcessingHint('');
        setCapturedImage(null);
        setProductAnalysis(null);
        return;
      }

      showModal('Error', error?.message || 'Failed to process. Please try again.', 'error');
      resetScanner();
    }
  };

  const scanLineOpacity = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#030617', '#0b1229', '#111827']}
        style={styles.backgroundGradient}
      />
      <StatusBar barStyle="light-content" />
      
      {/* Header & Mode Switcher */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.modeSwitcher}>
          <TouchableOpacity 
            style={[styles.modeBtn, scanMode === 'receipt' && styles.modeBtnActive]}
            onPress={() => { setScanMode('receipt'); resetScanner(); }}
          >
            <ReceiptIcon size={16} color={scanMode === 'receipt' ? '#0f172a' : '#94a3b8'} />
            <Text style={[styles.modeText, scanMode === 'receipt' && styles.modeTextActive]}>Receipt</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeBtn, scanMode === 'product' && styles.modeBtnActive]}
            onPress={() => { setScanMode('product'); resetScanner(); }}
          >
            <Zap size={16} color={scanMode === 'product' ? '#0f172a' : '#94a3b8'} />
            <Text style={[styles.modeText, scanMode === 'product' && styles.modeTextActive]}>Smart Lens</Text>
          </TouchableOpacity>
        </View>
      </View>

      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.preview} resizeMode="contain" />

          {!isProcessing && productAnalysis && (
            <View style={styles.analysisCard}>
              <View style={styles.analysisHeader}>
                <View>
                  <Text style={styles.analysisTitle}>{productAnalysis.detectedName}</Text>
                  <Text style={styles.analysisCategory}>{productAnalysis.category}</Text>
                </View>
                <View style={styles.confidencePill}>
                  <Text style={styles.confidenceText}>
                    {Math.round(productAnalysis.confidence * 100)}% dəqiqlik
                  </Text>
                </View>
              </View>

              {!productAnalysis.isProduct && (
                <View style={styles.warningBanner}>
                  <Text style={styles.warningText}>
                    AI bu obyektin məhsul olduğuna tam əmin deyil, amma yaxın ehtimalları göstərir.
                  </Text>
                </View>
              )}

              {(productAnalysis.bestPrice || productAnalysis.closestStore) && (
                <View style={styles.badgesRow}>
                  {productAnalysis.bestPrice && (
                    <View style={[styles.badgeCard, styles.cheapestBadge]}>
                      <Text style={styles.badgeLabel}>Ən ucuz</Text>
                      <Text style={styles.badgeValue}>
                        {productAnalysis.bestPrice.price.toFixed(2)}₼ • {productAnalysis.bestPrice.store}
                      </Text>
                    </View>
                  )}
                  {productAnalysis.closestStore && (
                    <View style={[styles.badgeCard, styles.closestBadge]}>
                      <Text style={styles.badgeLabel}>Ən yaxın</Text>
                      <Text style={styles.badgeValue}>
                        {productAnalysis.closestStore.distanceKm} km • {productAnalysis.closestStore.store}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              
              <View style={styles.matchesHeaderRow}>
                <Text style={styles.matchesLabel}>Mağaza təklifləri</Text>
                <Text style={styles.matchesCount}>{productAnalysis.matches.length} nəticə</Text>
              </View>

              <ScrollView 
                style={styles.matchesScroll} 
                contentContainerStyle={styles.matchesContent}
                showsVerticalScrollIndicator={false}
              >
                {productAnalysis.matches.map((match, index) => (
                  <View key={`${match.store}-${index}`} style={styles.matchRow}>
                    <View style={styles.storeInfo}>
                      <ShoppingCart size={18} color="#cbd5e1" />
                      <View>
                        <Text style={styles.storeName}>{match.store}</Text>
                        <Text style={styles.matchAddress}>{match.address}</Text>
                      </View>
                    </View>
                    <View style={styles.matchDetails}>
                      <Text style={styles.priceText}>{match.price.toFixed(2)}₼</Text>
                      <View style={styles.distanceRow}>
                        <MapPin size={14} color="#94a3b8" />
                        <Text style={styles.distanceText}>
                          {match.distanceKm} km • {match.eta}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.newScanButton} onPress={resetScanner}>
                <RefreshCw size={18} color="white" />
                <Text style={styles.newScanText}>Yenidən skan et</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isProcessing && !productAnalysis && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.retakeButton} onPress={resetScanner}>
                <RefreshCw size={18} color="#e5e7eb" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={(ref) => {
              setCameraRef(ref);
            }}
            onBarcodeScanned={scanned || scanMode === 'product' ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.topOverlay}>
              <Text style={styles.scanText}>
                {scanMode === 'receipt' ? 'Align receipt or QR code' : 'Point at any product'}
              </Text>
            </View>

            <View style={[styles.scanFrame, scanMode === 'product' && styles.smartFrame]}>
              {/* Animated scan line */}
              {!scanned && (
                <Animated.View
                  style={[
                    styles.scanLine,
                    scanMode === 'product' && styles.smartScanLine,
                    {
                      opacity: scanLineOpacity,
                      transform: [
                        {
                            translateY: scanAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 260],
                            }),
                        },
                      ],
                    },
                  ]}
                />
              )}
              
              {/* Success indicator */}
              {scanned && isProcessing && (
                <View style={styles.successIndicator}>
                  <CheckCircle size={48} color="#84cc16" />
                </View>
              )}

              <View style={[styles.corner, styles.cornerTL, scanMode === 'product' && styles.smartCorner]} />
              <View style={[styles.corner, styles.cornerTR, scanMode === 'product' && styles.smartCorner]} />
              <View style={[styles.corner, styles.cornerBL, scanMode === 'product' && styles.smartCorner]} />
              <View style={[styles.corner, styles.cornerBR, scanMode === 'product' && styles.smartCorner]} />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                <View style={styles.actionIcon}>
                  <ImageIcon size={24} color="#9ca3af" />
                </View>
                <Text style={styles.actionLabel}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.captureButton, 
                  scanned && styles.captureButtonDisabled,
                  scanMode === 'product' && styles.smartCaptureButton
                ]} 
                onPress={takePicture}
                disabled={scanned}
              >
                <View style={[styles.captureInner, scanMode === 'product' && styles.smartCaptureInner]} />
              </TouchableOpacity>

              <View style={[styles.actionButton, { opacity: scanMode === 'receipt' ? 1 : 0.3 }]}>
                <View style={[styles.actionIcon, { opacity: 0.8 }]}>
                  <QrCode size={24} color="#9ca3af" />
                </View>
                <Text style={styles.actionLabel}>QR Auto</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <CustomModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalVisible(false);
          if (modalConfig.type === 'success' && scanMode === 'receipt') {
            router.push('/');
          }
        }}
      />

      {isProcessing && (
        <BlurView intensity={80} tint="dark" style={styles.processingOverlay}>
          <Animated.View
            style={[
              styles.loaderWrapper,
              {
                transform: [
                  {
                    rotate: processingAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            <Loader2 size={36} color="#facc15" />
          </Animated.View>
          <Text style={styles.processingTitle}>
            {scanMode === 'receipt' ? 'Qəbz oxunur' : 'Smart Lens işləyir'}
          </Text>
          <Text style={styles.processingHint}>{processingHint}</Text>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  modeSwitcher: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 22,
    padding: 4,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    borderRadius: 18,
  },
  modeBtnActive: {
    backgroundColor: '#facc15',
  },
  modeText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  modeTextActive: {
    color: '#0f172a',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 24,
  },
  permissionTitle: {
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  permissionText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    color: '#9ca3af',
  },
  permissionButton: {
    borderRadius: 999,
    backgroundColor: '#84cc16',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a2e05',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#1e293b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  retakeText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#e5e7eb',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 110,
    paddingBottom: 40,
  },
  topOverlay: {
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  scanText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  scanFrame: {
    height: 300,
    width: Math.min(300, SCREEN_WIDTH - 80),
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#84cc16',
    backgroundColor: 'rgba(132, 204, 22, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  smartFrame: {
    borderColor: '#facc15',
    backgroundColor: 'rgba(250, 204, 21, 0.05)',
    height: 320,
    width: 320,
    borderRadius: 40,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#84cc16',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  smartScanLine: {
    backgroundColor: '#facc15',
    shadowColor: '#facc15',
  },
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    zIndex: 10,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#84cc16',
    borderWidth: 4,
    zIndex: 5,
  },
  smartCorner: {
    borderColor: '#facc15',
    borderRadius: 12,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    marginBottom: 4,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  captureButton: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: 'white',
    shadowColor: '#84cc16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  smartCaptureButton: {
    shadowColor: '#facc15',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureInner: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: '#121212',
    borderWidth: 4,
    borderColor: '#84cc16',
  },
  smartCaptureInner: {
    borderColor: '#facc15',
  },
  // Analysis Card Styles
  analysisCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#facc15',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  analysisHeader: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  analysisCategory: {
    fontSize: 14,
    color: '#facc15',
    marginTop: 2,
    fontWeight: '600',
  },
  confidencePill: {
    backgroundColor: 'rgba(250,204,21,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.4)',
  },
  confidenceText: {
    color: '#facc15',
    fontWeight: '600',
    fontSize: 12,
  },
  warningBanner: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderColor: '#f87171',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  warningText: {
    color: '#fecaca',
    fontSize: 12,
    lineHeight: 18,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  badgeCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  cheapestBadge: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  closestBadge: {
    borderColor: '#93c5fd',
    backgroundColor: 'rgba(147,197,253,0.1)',
  },
  badgeLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  badgeValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  matchesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchesLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  matchesCount: {
    color: '#94a3b8',
    fontSize: 12,
  },
  matchesScroll: {
    maxHeight: 220,
    marginBottom: 12,
  },
  matchesContent: {
    gap: 10,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  matchAddress: {
    color: '#94a3b8',
    fontSize: 12,
  },
  matchDetails: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priceText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  newScanButton: {
    marginTop: 16,
    backgroundColor: '#facc15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  newScanText: {
    color: '#1a2e05',
    fontWeight: '700',
    fontSize: 15,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loaderWrapper: {
    height: 72,
    width: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(250,204,21,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  processingTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  processingHint: {
    color: '#cbd5f5',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
  },
});

