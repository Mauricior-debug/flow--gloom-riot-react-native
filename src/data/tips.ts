export type TipId =
  | 'basics'
  | 'route'
  | 'gloom'
  | 'exit'
  | 'gems'
  | 'water'
  | 'powerups'
  | 'shields'
  | 'rerolls'
  | 'moves'
  | 'switches'
  | 'teleports'
  | 'mystery'
  | 'hazards'
  | 'sticky'
  | 'crumbly'
  | 'arrows'
  | 'hop'
  | 'glass'
  | 'ice'
  | 'cracked'
  | 'personality'
  | 'kingSwitches'
  | 'lava'
  | 'monarchSwitches'
  | 'frostStomp';

export const TIPS: Record<TipId, string> = {
  basics: 'Tap ROLL THE DICE to start your turn.',
  route: 'Tap a glowing tile to move Pip there.',
  gloom: 'Red dashed tiles show where glooms can reach.',
  exit: 'Land on the EXIT to escape!',
  gems: 'Star Gems earn stars and bonus coins.',
  water: 'Water costs 2 moves — plan carefully.',
  powerups: 'Purple power-ups grant a random helpful item.',
  shields: 'Shields protect you from one gloom catch.',
  rerolls: 'Rerolls let you roll the dice again.',
  moves: '+2 Moves give you extra steps this turn.',
  switches: 'Switches flip every bridge open or closed.',
  teleports: 'Teleports warp you to their matching pair.',
  mystery: 'Mystery tiles grant a random surprise!',
  hazards: 'Hazards cost 1 heart when you enter them.',
  sticky: 'Sticky goo lowers your next roll by 2.',
  crumbly: 'Cookie tiles crumble after you leave them.',
  arrows: 'Arrows shove Pip one step if the tile is free.',
  hop: 'Hop pads leap you ahead to their landing.',
  glass: 'Glass tiles vanish every other two turns.',
  ice: 'Ice slides you one more step the same way.',
  cracked: 'Cracked ice breaks the second time you step on it.',
  personality: 'Each gloom has a personality — learn their habits!',
  kingSwitches: 'Both switches unlock the King\'s EXIT.',
  lava: 'Lava costs 2 moves and glooms swim it for 1.',
  monarchSwitches: 'Both switches unlock the Monarch\'s EXIT.',
  frostStomp: 'Frost Stomp cracks ice near you — keep moving!',
};
