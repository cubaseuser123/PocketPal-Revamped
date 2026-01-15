import { Image, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

interface PallyIconProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export function PallyIcon({ size = 16, style, imageStyle }: PallyIconProps) {
  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Image
        source={require("../../assets/images/pally-icon.png")}
        style={[{ width: '100%', height: '100%' }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}
