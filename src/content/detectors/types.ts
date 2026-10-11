import type { EventId } from '../../shared/events';
import type { NavInfo } from '../nav';

export interface EmitInfo {
  /** "owner/repo" or "owner/repo #12" */
  subject?: string;
  detail?: string;
  /** de-duplication key; the same key within 20s is ignored */
  key?: string;
}

export interface DetectorApi {
  emit(id: EventId, info?: EmitInfo): void;
  onNav(cb: (n: NavInfo) => void): void;
  /** run fn after the DOM changes (debounced) */
  onMutate(cb: () => void): void;
  log(...a: unknown[]): void;
}

export type Detector = (api: DetectorApi) => void;

/** First path segments on github.com that are never a user or org. */
export const RESERVED_OWNERS = new Set(
  [
    'settings', 'orgs', 'organizations', 'notifications', 'new', 'login', 'logout', 'join', 'signup', 'explore', 'marketplace',
    'sponsors', 'topics', 'collections', 'trending', 'pulls', 'issues', 'codespaces', 'features', 'pricing', 'enterprise', 'about',
    'search', 'apps', 'account', 'dashboard', 'repositories', 'import', 'stars', 'watching', 'readme', 'security', 'contact',
    'customer-stories', 'resources', 'solutions', 'premium-support', 'copilot', 'models', 'sessions', 'password_reset', 'users',
    'discussions', 'projects', 'gist', 'github', 'site', 'git-guides', 'readme', 'events', 'mobile', 'copilot-workspace',
  ].map((s) => s.toLowerCase()),
);
