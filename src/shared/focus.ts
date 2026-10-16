/** Keep keyboard focus when a settings render replaces an otherwise identical control. */
export function preserveFocus(update: () => void): void {
  const active = document.activeElement as HTMLElement | null;
  const path: number[] = [];
  let node: Element | null = active;
  while (node && node !== document.body) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    path.unshift(Array.from(parent.children).indexOf(node));
    node = parent;
  }
  update();
  if (!active || active === document.body || active.isConnected || node !== document.body) return;
  let replacement: Element | undefined = document.body;
  for (const index of path) replacement = replacement?.children[index];
  if (replacement instanceof HTMLElement) replacement.focus({ preventScroll: true });
}
