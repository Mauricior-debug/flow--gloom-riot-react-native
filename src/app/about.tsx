import { router } from 'expo-router';
import { Image, StyleSheet } from 'react-native';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, SecondaryButton, Title } from '../components/ui';
import { Images } from '../data/assets';

export default function AboutScreen() {
  return (
    <Screen scroll>
      <BackRow title="About" onBack={() => router.back()} />
      <Panel style={styles.card}>
        <Image source={Images.logo} style={styles.logo} />
        <Title style={{ textAlign: 'center', fontSize: 26 }}>GLOOM RIOT</Title>
        <Body style={{ marginTop: 12, textAlign: 'center' }}>
          Help Pip dodge the glooms, gather Star Gems, and escape each world before the dark closes
          in.
        </Body>
        <SecondaryButton
          label="Support"
          style={{ marginTop: 18 }}
          onPress={() => router.push('/support')}
        />
        <SecondaryButton label="Back" style={{ marginTop: 10 }} onPress={() => router.back()} />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  logo: { width: 96, height: 96, borderRadius: 28, marginBottom: 10 },
});
