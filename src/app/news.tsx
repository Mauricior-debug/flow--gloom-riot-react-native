import { router } from 'expo-router';
import { Screen } from '../components/Screen';
import { BackRow, Body, Panel, Title } from '../components/ui';
import { NEWS_ITEMS } from '../data/catalog';

export default function NewsScreen() {
  return (
    <Screen scroll>
      <BackRow title="News" onBack={() => router.back()} />
      {NEWS_ITEMS.map((n) => (
        <Panel key={n.id} style={{ marginBottom: 12 }}>
          <Title style={{ fontSize: 20 }}>{n.title}</Title>
          <Body muted style={{ marginTop: 4 }}>{n.date}</Body>
          <Body style={{ marginTop: 8 }}>{n.body}</Body>
        </Panel>
      ))}
    </Screen>
  );
}
