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
  Platform,
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
import { Palette } from '@/constants/theme';

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
        <Text style={styles.permissionTitle}>Kamera icazəsi lazımdır</Text>
        <Text style={styles.permissionText}>
          Qəbzləri skan etmək və məhsulları tanımaq üçün kameraya icazə verin.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>İcazə ver</Text>
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
        showModal('Mövcuddur', 'Bu qəbz artıq bazada var.', 'warning');
        resetScanner();
        return;
      }
      
      showModal(
        'Uğurlu!',
        `Qəbz emal edildi.\nCəmi: ${receiptData.totalAmount?.toFixed(2)}₼\nMəhsul: ${receiptData.items?.length || 0}`,
        'success'
      );
      
      setTimeout(() => {
        resetScanner();
        router.push('/');
      }, 2000);
    } catch (error: any) {
      console.error('Error processing QR:', error.message);
      showModal('Xəta', error.message || 'QR kodu emal etmək mümkün olmadı', 'error');
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
        showModal('Xəta', 'Şəkil çəkmək mümkün olmadı', 'error');
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
    setProcessingHint(scanMode === 'receipt' ? 'Qəbz oxunur...' : 'Məhsul analiz edilir...');
    
    try {
      if (scanMode === 'receipt') {
        const receiptData = await processReceiptImage(uri);
        const totalAmount = receiptData?.totalAmount;

        if (!receiptData || !receiptData.text || !totalAmount || Number(totalAmount) <= 0) {
          showModal('Qəbz tapılmadı', 'Zəhmət olmasa qəbzi kameraya daha yaxın tutun.', 'warning');
          setIsProcessing(false);
          setProcessingHint('');
          setCapturedImage(null);
          return;
        }

        if (receiptData.text) {
          const status = await saveReceipt(receiptData as any);
          if (status === 'duplicate') {
            showModal('Mövcuddur', 'Bu qəbz artıq emal edilib.', 'warning');
            resetScanner();
            return;
          }
          setProcessingHint('');
          showModal(
            'Uğurlu!',
            `Qəbz emal edildi.\nCəmi: ${receiptData.totalAmount?.toFixed(2)}₼\nMəhsul: ${receiptData.items?.length || 0}`,
            'success'
          );
          
          setTimeout(() => {
            setCapturedImage(null);
            resetScanner();
            router.push('/');
          }, 2000);
        }
      } else {
        const analysis = await identifyProductFromImage(uri);
        setIsProcessing(false);
        if (analysis) {
          setProductAnalysis(analysis);
          setProcessingHint('');
        } else {
          showModal('Tapılmadı', 'Məhsul tanınmadı. Daha yaxından çəkməyə çalışın.', 'warning');
          setCapturedImage(null);
          setProcessingHint('');
        }
      }
    } catch (error: any) {
      if (scanMode === 'product') {
        if (error?.code === 'NO_PRODUCT') {
          showModal('Məhsul tapılmadı', 'Yaxın məsafədən yalnız məhsulun şəklini çəkin.', 'warning');
        } else {
          showModal('Smart Lens xətası', error?.message || 'Analiz zamanı xəta baş verdi.', 'error');
        }
        setIsProcessing(false);
        setProcessingHint('');
        setCapturedImage(null);
        setProductAnalysis(null);
        return;
      }

      showModal('Xəta', error?.message || 'Emal zamanı xəta baş verdi.', 'error');
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
        colors={[Palette.primary, '#004d23']}
        style={styles.backgroundGradient}
      />
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
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
            <ReceiptIcon size={16} color={scanMode === 'receipt' ? Palette.primary : '#94a3b8'} />
            <Text style={[styles.modeText, scanMode === 'receipt' && styles.modeTextActive]}>Qəbz</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.modeBtn, scanMode === 'product' && styles.modeBtnActive]}
            onPress={() => { setScanMode('product'); resetScanner(); }}
          >
            <Zap size={16} color={scanMode === 'product' ? Palette.primary : '#94a3b8'} />
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
                      <ShoppingCart size={18} color={Palette.primary} />
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
                          {match.distanceKm} km
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity style={styles.newScanButton} onPress={resetScanner}>
                <RefreshCw size={18} color="#fff" />
                <Text style={styles.newScanText}>Yenidən skan et</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isProcessing && !productAnalysis && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.retakeButton} onPress={resetScanner}>
                <RefreshCw size={18} color="#e5e7eb" />
                <Text style={styles.retakeText}>Yenidən çək</Text>
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
                {scanMode === 'receipt' ? 'Qəbzi və ya QR kodu mərkəzə gətirin' : 'Məhsula tərəf yönəldin'}
              </Text>
            </View>

            <View style={[styles.scanFrame, scanMode === 'product' && styles.smartFrame]}>
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
              
              {scanned && isProcessing && (
                <View style={styles.successIndicator}>
                  <CheckCircle size={48} color={Palette.secondary} />
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
                  <ImageIcon size={24} color="#fff" />
                </View>
                <Text style={styles.actionLabel}>Qalereya</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.captureButton, 
                  scanned && styles.captureButtonDisabled,
                ]} 
                onPress={takePicture}
                disabled={scanned}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>

              <View style={[styles.actionButton, { opacity: scanMode === 'receipt' ? 1 : 0.3 }]}>
                <View style={styles.actionIcon}>
                  <QrCode size={24} color="#fff" />
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
            <Loader2 size={36} color={Palette.secondary} />
          </Animated.View>
          <Text style={styles.processingTitle}>
            {scanMode === 'receipt' ? 'Oxunur...' : 'Analiz edilir...'}
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
    backgroundColor: '#000',
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitcher: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 22,
    padding: 4,
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
    backgroundColor: '#fff',
  },
  modeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTextActive: {
    color: Palette.primary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    paddingHorizontal: 24,
  },
  permissionTitle: {
    marginBottom: 12,
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
  },
  permissionText: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  permissionButton: {
    borderRadius: 20,
    backgroundColor: Palette.secondary,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Palette.primary,
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
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retakeText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
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
    paddingTop: 120,
    paddingBottom: 40,
  },
  topOverlay: {
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scanText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  scanFrame: {
    height: 280,
    width: Math.min(280, SCREEN_WIDTH - 100),
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  smartFrame: {
    borderColor: Palette.secondary,
    borderRadius: 40,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#fff',
  },
  smartScanLine: {
    backgroundColor: Palette.secondary,
  },
  successIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
    borderWidth: 4,
  },
  smartCorner: {
    borderColor: Palette.secondary,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
    borderRadius: 32,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  captureButton: {
    height: 84,
    width: 84,
    borderRadius: 42,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  captureInner: {
    height: 68,
    width: 68,
    borderRadius: 34,
    backgroundColor: Palette.primary,
    borderWidth: 4,
    borderColor: '#eee',
  },
  analysisCard: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  analysisHeader: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  analysisCategory: {
    fontSize: 14,
    color: Palette.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  confidencePill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: Palette.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  matchesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  matchesLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  matchesCount: {
    color: '#999',
    fontSize: 12,
    fontWeight: '700',
  },
  matchesScroll: {
    maxHeight: 200,
  },
  matchesContent: {
    gap: 12,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  storeName: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '800',
  },
  matchAddress: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  matchDetails: {
    alignItems: 'flex-end',
  },
  priceText: {
    color: Palette.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  distanceText: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  newScanButton: {
    marginTop: 20,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 20,
    gap: 10,
  },
  newScanText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrapper: {
    marginBottom: 20,
  },
  processingTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
  },
  processingHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 8,
  },
});
