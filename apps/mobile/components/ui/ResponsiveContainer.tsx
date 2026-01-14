import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ResponsiveContainer({ children, style }: ResponsiveContainerProps) {
  const { isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.content,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: horizontalPadding,
          },
          isTablet && styles.tabletContent,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
  },
  tabletContent: {
    // Additional tablet-specific styles if needed
  },
});
