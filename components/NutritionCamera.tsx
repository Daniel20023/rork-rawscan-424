import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, X, Check, RotateCcw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type NutritionCameraProps = {
  onPhotoTaken: (imageBase64: string) => void;
  onClose: () => void;
  isProcessing?: boolean;
};

export default function NutritionCamera({ onPhotoTaken, onClose, isProcessing = false }: NutritionCameraProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#FF3B30" style={{ marginBottom: 24 }} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan nutrition labels and extract nutritional information.
          </Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      });

      if (photo?.base64) {
        setCapturedImage(photo.uri);
        // Don't call onPhotoTaken yet, wait for user confirmation
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };

  const confirmPhoto = () => {
    if (capturedImage && cameraRef.current) {
      // Get the base64 data
      cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
        skipProcessing: false,
      }).then((photo) => {
        if (photo?.base64) {
          onPhotoTaken(photo.base64);
        }
      });
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FF3B30', '#FF6B5A']}
          style={styles.webContainer}
        >
          <Camera size={80} color="white" style={{ marginBottom: 24 }} />
          <Text style={styles.webTitle}>Nutrition Label Scanner</Text>
          <Text style={styles.webText}>
            Camera scanning is only available on mobile devices.
            {'\n'}Please use the RawScan mobile app to scan nutrition labels.
          </Text>
          <TouchableOpacity style={styles.webButton} onPress={onClose}>
            <Text style={styles.webButtonText}>Close</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <SafeAreaView style={styles.previewOverlay}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Review Photo</Text>
              <Text style={styles.previewSubtitle}>
                Make sure the nutrition label is clear and readable
              </Text>
            </View>
            
            <View style={styles.previewControls}>
              <TouchableOpacity 
                style={[styles.previewButton, styles.retakeButton]} 
                onPress={retakePhoto}
                disabled={isProcessing}
              >
                <RotateCcw size={24} color="white" />
                <Text style={styles.previewButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.previewButton, styles.confirmButton]} 
                onPress={confirmPhoto}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size={24} color="white" />
                ) : (
                  <Check size={24} color="white" />
                )}
                <Text style={styles.previewButtonText}>
                  {isProcessing ? 'Processing...' : 'Use Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      ) : (
        <>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={facing}
          />
          
          <SafeAreaView style={styles.overlay}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Scan Nutrition Label</Text>
              <Text style={styles.headerSubtitle}>
                Position the nutrition facts panel in the frame
              </Text>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={styles.scanRectangle}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <Text style={styles.scanHint}>
                  Align nutrition facts within the frame
                </Text>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity 
                style={styles.controlButton} 
                onPress={toggleCameraFacing}
              >
                <RotateCcw size={24} color="white" />
                <Text style={styles.controlText}>Flip</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton} 
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
              
              <View style={styles.controlButton} />
            </View>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFFFFF',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  grantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: width * 0.8,
    height: height * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanRectangle: {
    width: '100%',
    height: '100%',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 59, 48, 0.3)',
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FF3B30',
    borderWidth: 4,
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  controlButton: {
    alignItems: 'center',
    padding: 16,
    width: 80,
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  previewHeader: {
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  previewSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  previewControls: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  previewButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  webText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
  },
  webButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  webButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});