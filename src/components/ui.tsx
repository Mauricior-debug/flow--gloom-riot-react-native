import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radii } from '../theme/colors';

export function Title({
  children,
  style,
  large,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  large?: boolean;
}) {
  return (
    <Text style={[styles.title, large && { fontSize: 36 }, style]}>{children}</Text>
  );
}

export function Body({
  children,
  style,
  muted,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  muted?: boolean;
}) {
  return (
    <Text style={[styles.body, muted && { opacity: 0.72 }, style]}>{children}</Text>
  );
}

export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <LinearGradient
      colors={[colors.panelTop, colors.panelBottom]}
      style={[styles.panel, style]}
    >
      {children}
    </LinearGradient>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryBtn,
        pressed && { opacity: 0.9 },
        style,
      ]}
    >
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function DangerButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.dangerBtn}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function CoinPill({ coins }: { coins: number }) {
  return (
    <View style={styles.coinPill}>
      <Text style={styles.coinIcon}>●</Text>
      <Text style={styles.coinText}>{coins}</Text>
    </View>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="rgba(60,45,80,0.45)"
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

export function BackRow({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.backRow}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button">
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <Title style={{ fontSize: 22, flex: 1, textAlign: 'center' }}>{title}</Title>
      <View style={{ minWidth: 56, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function LoadingBlock() {
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 28,
    color: colors.ink,
  },
  body: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  panel: {
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: colors.panelBorder,
    padding: 16,
    shadowColor: '#5c3a1c',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: 16,
    paddingHorizontal: 22,
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.primaryText,
    fontSize: 18,
  },
  secondaryBtn: {
    backgroundColor: colors.secondary,
    borderRadius: radii.button,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: '#fff',
    fontSize: 16,
  },
  dangerBtn: {
    backgroundColor: colors.danger,
    borderRadius: radii.button,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  coinIcon: {
    color: '#8a5a00',
    fontSize: 14,
    fontFamily: 'Fredoka_600SemiBold',
  },
  coinText: {
    fontFamily: 'Fredoka_600SemiBold',
    color: colors.ink,
    fontSize: 16,
  },
  field: {
    backgroundColor: colors.muted,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: colors.ink,
    borderWidth: 2,
    borderColor: '#fff',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  backText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 18,
    color: colors.secondary,
    minWidth: 56,
  },
});
