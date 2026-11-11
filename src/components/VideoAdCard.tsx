import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/colors';
import { Body, PrimaryButton, SecondaryButton, Title } from './ui';

export type AdOfferKind =
  | 'freeCoins'
  | 'freeReroll'
  | 'revive'
  | 'doubleCoins'
  | 'randomBooster';

export function VideoAdOfferCard({
  visible,
  title,
  description,
  blockedReason,
  onWatch,
  onClose,
}: {
  visible: boolean;
  title: string;
  description: string;
  blockedReason?: string | null;
  onWatch: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.offerCard}>
          <View style={styles.tvBadge}>
            <Text style={styles.tvText}>TV</Text>
          </View>
          <Title style={{ fontSize: 22, marginTop: 8 }}>{title}</Title>
          <Body style={{ marginTop: 8 }}>{description}</Body>
          <Body muted style={{ marginTop: 10, fontSize: 13 }}>
            Optional · never required to play · sandbox ad
          </Body>
          {blockedReason ? (
            <Body style={{ marginTop: 12, color: colors.danger }}>{blockedReason}</Body>
          ) : (
            <PrimaryButton label="Watch video" style={{ marginTop: 14 }} onPress={onWatch} />
          )}
          <SecondaryButton label="Close" style={{ marginTop: 10 }} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export function SponsoredVideoPlayer({
  visible,
  onClaim,
  onClose,
}: {
  visible: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const [left, setLeft] = useState(5);
  const [done, setDone] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setLeft(5);
    setDone(false);
    fill.setValue(0);
    Animated.timing(fill, { toValue: 1, duration: 5000, useNativeDriver: false }).start();
    const iv = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(iv);
          setDone(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [visible, fill]);

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <LinearGradient colors={['#7B3FE4', '#1FA6C9']} style={styles.videoCard}>
          <Text style={styles.sponsored}>Sponsored video</Text>
          <Text style={styles.countdown}>{done ? 'Done' : `${left}`}</Text>
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { width }]} />
          </View>
          {done ? (
            <PrimaryButton label="Claim reward" style={{ marginTop: 18 }} onPress={onClaim} />
          ) : (
            <Body style={{ marginTop: 14, color: '#fff', textAlign: 'center' }}>
              Watching… close early gives nothing
            </Body>
          )}
          <Pressable onPress={onClose} style={{ marginTop: 14 }}>
            <Text style={styles.closeEarly}>Close</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.5)',
    justifyContent: 'center',
    padding: 22,
  },
  offerCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: radii.panel,
    borderWidth: 3,
    borderColor: '#fff',
    padding: 18,
  },
  tvBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6FB5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tvText: { color: '#fff', fontFamily: 'Fredoka_700Bold', fontSize: 12 },
  videoCard: {
    borderRadius: radii.panel,
    padding: 22,
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
  },
  sponsored: {
    color: '#fff',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
  },
  countdown: {
    color: '#fff',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 48,
    marginTop: 8,
  },
  barTrack: {
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginTop: 16,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFD85C',
  },
  closeEarly: {
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Fredoka_600SemiBold',
    textAlign: 'center',
  },
});
