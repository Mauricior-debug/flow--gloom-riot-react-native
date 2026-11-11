import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { usePlayer } from '../state/PlayerContext';

export function Screen({
  children,
  scroll,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}) {
  const { player } = usePlayer();
  const pad = player.settings.largeText ? 20 : 16;
  const bg = player.settings.highContrast ? '#FFF8E0' : colors.pageBg;

  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[{ padding: pad, paddingBottom: 36 }, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }, style]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={[{ flex: 1, padding: pad }, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
});
