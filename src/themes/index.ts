import type { Theme } from '../engine/types';
import { marquee } from './marquee';

export const THEMES: Theme[] = [marquee];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? marquee;
}
