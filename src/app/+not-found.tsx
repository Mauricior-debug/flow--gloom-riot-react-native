import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Body, Title } from '../components/ui';
import { colors } from '../theme/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops' }} />
      <View style={styles.wrap}>
        <Title>Screen not found</Title>
        <Link href="/home" style={styles.link}>
          <Body style={{ color: colors.secondary }}>Back to home</Body>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  link: { marginTop: 16 },
});
