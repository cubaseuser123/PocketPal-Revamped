import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSegments } from 'expo-router';

// Screens where offline notice should be shown (financial operations)
const OFFLINE_NOTICE_SCREENS = [
  'transfer-money',
  'load-money',
  'scan-qr',
  'upi',
  'add-money',
  'add-money-limited',
  'payment-method',
];

export function OfflineNotice() {
  const netInfo = useNetInfo();
  const queryClient = useQueryClient();
  const segments = useSegments();

  // Get current screen name from segments
  const currentScreen = segments[segments.length - 1] || '';

  // Only show for specific financial screens
  const shouldShow = OFFLINE_NOTICE_SCREENS.some(screen => 
    currentScreen.toLowerCase().includes(screen.toLowerCase())
  );

  // Don't show if connected, still determining, or not on a relevant screen
  if (netInfo.isConnected === null || netInfo.isConnected || !shouldShow) {
    return null;
  }

  const handleRefresh = () => {
    // Invalidate all queries to trigger refetch when online
    queryClient.invalidateQueries();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={20} color="#FFF" style={styles.icon} />
        <Text style={styles.text}>No Internet Connection</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={18} color="#0F0F14" />
          <Text style={styles.refreshText}>Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above tab bar
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444', // Red background
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  refreshText: {
    color: '#0F0F14',
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});
