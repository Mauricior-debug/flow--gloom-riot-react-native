import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameModal } from '../components/GameModal';
import { Screen } from '../components/Screen';
import { BackRow, Body, Field, Panel, PrimaryButton, Title } from '../components/ui';
import { AdOfferKind } from '../components/VideoAdCard';
import { getAllLevels } from '../data/levels';
import { usePlayer } from '../state/PlayerContext';
import { colors } from '../theme/colors';

export default function AdminScreen() {
  const { player, update, updateAdOffer } = usePlayer();
  const [banner, setBanner] = useState(player.eventBanner);
  const [mult, setMult] = useState(String(player.coinRewardMultiplier));
  const [toast, setToast] = useState<{ title: string; body: string } | null>(null);
  const [editId, setEditId] = useState<AdOfferKind | null>(null);
  const editing = (player.adOffers ?? []).find((o) => o.id === editId);
  const [draftName, setDraftName] = useState('');
  const [draftReward, setDraftReward] = useState('');
  const [draftLimit, setDraftLimit] = useState('');
  const [draftCool, setDraftCool] = useState('');
  const [draftPlace, setDraftPlace] = useState('');

  const openEdit = (id: AdOfferKind) => {
    const o = (player.adOffers ?? []).find((x) => x.id === id);
    if (!o) return;
    setEditId(id);
    setDraftName(o.name);
    setDraftReward(o.rewardLabel);
    setDraftLimit(String(o.dailyLimit));
    setDraftCool(String(o.cooldownMinutes));
    setDraftPlace(o.placement);
  };

  return (
    <Screen scroll>
      <BackRow title="Admin demo" onBack={() => router.back()} />
      <Body muted style={{ marginBottom: 12 }}>
        Local demo controls. Writes the same on-device save. Not a website.
      </Body>

      <Panel>
        <Title style={{ fontSize: 18 }}>Event banner</Title>
        <Field
          value={banner}
          onChangeText={setBanner}
          placeholder="Weekend gem rush!"
          style={{ marginTop: 8 }}
        />
        <PrimaryButton
          label="Save banner"
          style={{ marginTop: 10 }}
          onPress={() => {
            update((p) => ({ ...p, eventBanner: banner.trim() }));
            setToast({ title: 'Saved', body: 'Event banner updated' });
          }}
        />
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 18 }}>Coin reward multiplier</Title>
        <Field
          value={mult}
          onChangeText={setMult}
          keyboardType="decimal-pad"
          style={{ marginTop: 8 }}
        />
        <PrimaryButton
          label="Save multiplier"
          style={{ marginTop: 10 }}
          onPress={() => {
            const n = Number(mult);
            if (!n || n <= 0) {
              setToast({ title: 'Invalid', body: 'Enter a positive number' });
              return;
            }
            update((p) => ({ ...p, coinRewardMultiplier: n }));
            setToast({ title: 'Saved', body: `Multiplier set to ${n}` });
          }}
        />
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 18, marginBottom: 8 }}>Sandbox ad offers</Title>
        <Body muted style={{ marginBottom: 8 }}>
          Completions today: {player.ads.globalCount ?? 0}/15
        </Body>
        {(player.adOffers ?? []).map((o) => (
          <Pressable key={o.id} style={styles.offerRow} onPress={() => openEdit(o.id)}>
            <View style={{ flex: 1 }}>
              <Body style={{ fontFamily: 'Fredoka_600SemiBold' }}>
                {o.name} {o.active ? '' : '(off)'}
              </Body>
              <Body muted style={{ fontSize: 13 }}>
                {o.placement} · limit {o.dailyLimit} · cool {o.cooldownMinutes}m · {o.rewardLabel}
              </Body>
            </View>
            <Text style={{ color: colors.secondary }}>Edit</Text>
          </Pressable>
        ))}
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Title style={{ fontSize: 18, marginBottom: 8 }}>Unlock levels</Title>
        {getAllLevels().map((lvl) => {
          const unlocked =
            player.unlockedLevels.includes(lvl.id) || player.forceUnlocked.includes(lvl.id);
          return (
            <Pressable
              key={lvl.id}
              style={styles.levelRow}
              onPress={() => {
                update((p) => {
                  const force = new Set(p.forceUnlocked);
                  const unlockedSet = new Set(p.unlockedLevels);
                  if (force.has(lvl.id) || unlockedSet.has(lvl.id)) {
                    force.delete(lvl.id);
                  } else {
                    force.add(lvl.id);
                    unlockedSet.add(lvl.id);
                  }
                  return {
                    ...p,
                    forceUnlocked: Array.from(force),
                    unlockedLevels: Array.from(unlockedSet),
                  };
                });
              }}
            >
              <Body style={{ flex: 1 }}>
                {lvl.id} · {lvl.name}
              </Body>
              <Body style={{ color: unlocked ? colors.primary : colors.danger }}>
                {unlocked ? 'Unlocked' : 'Locked'}
              </Body>
            </Pressable>
          );
        })}
      </Panel>

      <GameModal
        visible={!!toast}
        title={toast?.title ?? ''}
        body={toast?.body}
        primaryLabel="OK"
        onPrimary={() => setToast(null)}
      />

      <GameModal
        visible={!!editing}
        title={editing ? `Edit ${editing.id}` : 'Edit offer'}
        primaryLabel="Save offer"
        onPrimary={() => {
          if (!editId) return;
          updateAdOffer(editId, {
            name: draftName.trim() || editing!.name,
            rewardLabel: draftReward.trim() || editing!.rewardLabel,
            dailyLimit: Math.max(0, Number(draftLimit) || 0),
            cooldownMinutes: Math.max(0, Number(draftCool) || 0),
            placement: draftPlace.trim() || editing!.placement,
          });
          setEditId(null);
          setToast({ title: 'Saved', body: 'Ad offer updated' });
        }}
        secondaryLabel="Toggle active"
        onSecondary={() => {
          if (!editId || !editing) return;
          updateAdOffer(editId, { active: !editing.active });
          setEditId(null);
        }}
        onClose={() => setEditId(null)}
      >
        <Field value={draftName} onChangeText={setDraftName} placeholder="Name" style={{ marginTop: 8 }} />
        <Field
          value={draftReward}
          onChangeText={setDraftReward}
          placeholder="Reward label"
          style={{ marginTop: 8 }}
        />
        <Field
          value={draftLimit}
          onChangeText={setDraftLimit}
          placeholder="Daily limit"
          keyboardType="number-pad"
          style={{ marginTop: 8 }}
        />
        <Field
          value={draftCool}
          onChangeText={setDraftCool}
          placeholder="Cooldown minutes"
          keyboardType="number-pad"
          style={{ marginTop: 8 }}
        />
        <Field
          value={draftPlace}
          onChangeText={setDraftPlace}
          placeholder="Placement"
          style={{ marginTop: 8 }}
        />
      </GameModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    gap: 8,
  },
});
