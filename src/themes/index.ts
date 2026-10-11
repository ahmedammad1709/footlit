import type { Theme } from '../engine/types';
import { marquee } from './marquee';
import { terminal } from './terminal';
import { mission } from './mission';
import { pixel } from './pixel';
import { crawler } from './crawler';
import { quiet } from './quiet';

export const THEMES: Theme[] = [marquee, terminal, mission, pixel, crawler, quiet];

export function getTheme(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? marquee;
}
