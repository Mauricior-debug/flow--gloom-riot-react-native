import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const COLORS = ['#FFD85C', '#1FA6C9', '#7B3FE4', '#FF6FB5'];

export function ConfettiBurst({ active }: { active: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * Dimensions.get('window').width,
        color: COLORS[i % COLORS.length],
        delay: Math.random() * 400,
        drift: (Math.random() - 0.5) * 120,
        size: 8 + Math.random() * 8,
      })),
    []
  );
  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!active) return;
    anims.forEach((a) => a.setValue(0));
    Animated.stagger(
      30,
      anims.map((a, i) =>
        Animated.timing(a, {
          toValue: 1,
          duration: 1400 + pieces[i].delay,
          useNativeDriver: true,
        })
      )
    ).start();
  }, [active, anims, pieces]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, Dimensions.get('window').height * 0.7],
        });
        const translateX = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.drift],
        });
        const opacity = anims[i].interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0],
        });
        const rotate = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${180 + p.drift}deg`],
        });
        return (
          <Animated.View
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              width: p.size,
              height: p.size * 0.6,
              borderRadius: 2,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateY }, { translateX }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}
