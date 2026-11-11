import { router } from 'expo-router';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';

export default function SupportScreen() {
  return (
    <Screen scroll>
      <BackRow title="Support" onBack={() => router.back()} />
      <Panel>
        <Title style={{ fontSize: 20 }}>Need a hand?</Title>
        <Body style={{ marginTop: 10 }}>
          GLOOM RIOT runs fully on your phone. Progress is saved locally. Practice store purchases never charge a card.
        </Body>
        <Body style={{ marginTop: 10 }}>
          Tips: use shields before tough boss rooms, flip every switch on locked EXIT boards, and watch for vanishing glass tiles every other two turns.
        </Body>
        <Body muted style={{ marginTop: 12 }}>
          Company: GLOOM RIOT · React Native port
        </Body>
      </Panel>
    </Screen>
  );
}
