// Cenário de fundo da 4ª casinha ("todos os pets juntos") — escolhido entre os
// mesmos 3 backgrounds usados pelas homes normais (gótico/grego/mad max), mas
// como preferência própria do hub (não pertence a nenhum perfil).
import gothicScene from '../assets/scenes/gothic.png';
import greekScene from '../assets/scenes/greek.png';
import madmaxScene from '../assets/scenes/madmax.png';

export type HubSceneId = 'gothic' | 'greek' | 'madmax';

export const HUB_BACKGROUND_KEY = 'digiapp-hub-background';

export const HUB_SCENES: { id: HubSceneId; namePt: string; nameEn: string; img: string }[] = [
  { id: 'gothic', namePt: 'Gótico', nameEn: 'Gothic', img: gothicScene },
  { id: 'greek', namePt: 'Grécia Antiga', nameEn: 'Ancient Greece', img: greekScene },
  { id: 'madmax', namePt: 'Mad Max', nameEn: 'Mad Max', img: madmaxScene },
];

export function getHubBackground(): HubSceneId {
  const saved = localStorage.getItem(HUB_BACKGROUND_KEY);
  return saved === 'greek' || saved === 'madmax' ? saved : 'gothic';
}

export function setHubBackground(id: HubSceneId): void {
  localStorage.setItem(HUB_BACKGROUND_KEY, id);
}

export function getHubSceneImg(id: HubSceneId): string {
  return HUB_SCENES.find(s => s.id === id)?.img ?? HUB_SCENES[0].img;
}
