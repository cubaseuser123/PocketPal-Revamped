import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertConfig {
  title: string;
  message: string;
  buttons: AlertButton[];
}

interface CustomAlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[]) => void;
}

const CustomAlertContext = createContext<CustomAlertContextType | null>(null);

export function useCustomAlert() {
  const context = useContext(CustomAlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within CustomAlertProvider');
  }
  return context;
}

interface CustomAlertProviderProps {
  children: ReactNode;
}

export function CustomAlertProvider({ children }: CustomAlertProviderProps) {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    setConfig({
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
    setVisible(true);
  }, []);

  const handleButtonPress = (button: AlertButton) => {
    setVisible(false);
    setTimeout(() => {
      button.onPress?.();
      setConfig(null);
    }, 200);
  };

  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return styles.destructiveButton;
      case 'cancel':
        return styles.cancelButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return styles.destructiveButtonText;
      case 'cancel':
        return styles.cancelButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  const getIcon = () => {
    const title = config?.title.toLowerCase() || '';
    if (title.includes('delete') || title.includes('remove')) {
      return <MaterialIcons name="delete-outline" size={32} color="#EF4444" />;
    }
    if (title.includes('error') || title.includes('fail')) {
      return <MaterialIcons name="error-outline" size={32} color="#EF4444" />;
    }
    if (title.includes('success')) {
      return <MaterialIcons name="check-circle-outline" size={32} color="#10B981" />;
    }
    if (title.includes('log out') || title.includes('logout')) {
      return <MaterialIcons name="logout" size={32} color="#FF8C32" />;
    }
    return <MaterialIcons name="info-outline" size={32} color="#FF8C32" />;
  };

  return (
    <CustomAlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <BlurView intensity={20} tint="dark" style={styles.overlay}>
          <View style={styles.alertContainer}>
            <View style={styles.iconContainer}>
              {getIcon()}
            </View>
            <Text style={styles.title}>{config?.title}</Text>
            <Text style={styles.message}>{config?.message}</Text>
            <View style={styles.buttonContainer}>
              {config?.buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.button, getButtonStyle(button.style)]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={[styles.buttonText, getButtonTextStyle(button.style)]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </BlurView>
      </Modal>
    </CustomAlertContext.Provider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  alertContainer: {
    width: width - 48,
    backgroundColor: '#1C1C23',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#B0B0C3',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  defaultButton: {
    backgroundColor: '#FF8C32',
  },
  cancelButton: {
    backgroundColor: '#2A2A35',
  },
  destructiveButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#B0B0C3',
  },
  destructiveButtonText: {
    color: '#EF4444',
  },
});
