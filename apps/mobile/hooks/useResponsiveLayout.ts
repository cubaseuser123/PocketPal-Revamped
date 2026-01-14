import { useWindowDimensions, Platform } from "react-native";

interface LayoutConfig {
  isTablet: boolean;
  isLargeScreen: boolean;
  screenWidth: number;
  screenHeight: number;
  contentMaxWidth: number;
  horizontalPadding: number;
  cardBorderRadius: number;
  baseFontScale: number;
}

export function useResponsiveLayout(): LayoutConfig {
  const { width, height } = useWindowDimensions();
  
  // Determine device type based on screen width
  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;
  
  // Dynamic content max width for tablets
  const contentMaxWidth = isLargeScreen 
    ? 600 
    : isTablet 
      ? Math.min(500, width * 0.8) 
      : width;
  
  // Responsive horizontal padding
  const horizontalPadding = isTablet ? 32 : 20;
  
  // Responsive border radius
  const cardBorderRadius = isTablet ? 28 : 24;
  
  // Font scale for larger screens
  const baseFontScale = isTablet ? 1.1 : 1;

  return {
    isTablet,
    isLargeScreen,
    screenWidth: width,
    screenHeight: height,
    contentMaxWidth,
    horizontalPadding,
    cardBorderRadius,
    baseFontScale,
  };
}

// Helper to create responsive styles based on device
export function getResponsiveValue<T>(
  baseValue: T,
  tabletValue: T,
  isTablet: boolean
): T {
  return isTablet ? tabletValue : baseValue;
}
