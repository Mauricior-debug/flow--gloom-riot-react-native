import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii } from '../theme/colors';
import { Body, Panel, PrimaryButton, SecondaryButton, Title } from './ui';

export function GameModal({
  visible,
  title,
  body,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  body?: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onClose?: () => void;
  children?: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Panel style={styles.card}>
          <Title style={{ fontSize: 22 }}>{title}</Title>
          {body ? <Body style={{ marginTop: 8 }}>{body}</Body> : null}
          {children}
          {primaryLabel && onPrimary ? (
            <PrimaryButton label={primaryLabel} style={{ marginTop: 14 }} onPress={onPrimary} />
          ) : null}
          {secondaryLabel && onSecondary ? (
            <SecondaryButton
              label={secondaryLabel}
              style={{ marginTop: 10 }}
              onPress={onSecondary}
            />
          ) : null}
          {onClose ? (
            <Pressable onPress={onClose} style={{ marginTop: 12 }}>
              <Body style={{ textAlign: 'center', color: colors.secondary }}>Close</Body>
            </Pressable>
          ) : null}
        </Panel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,20,40,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: radii.panel,
  },
});
