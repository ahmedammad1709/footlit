import type { Theme } from '../engine/types';
import { marquee } from './marquee';
import { terminal } from './terminal';

export const THEMES: Theme[] = [marquee, terminal];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? marquee;
}
