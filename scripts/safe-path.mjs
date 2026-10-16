import path from 'node:path';

/** Resolve a URL path beneath one preview root, including Windows separators. */
export function safePath(root, pathname) {
  try {
    const decoded = decodeURIComponent(pathname);
    if (decoded.includes('\0') || decoded.includes(':')) return null;
    const file = path.resolve(root, '.' + (decoded.startsWith('/') ? decoded : '/' + decoded));
    const relative = path.relative(path.resolve(root), file);
    if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) return null;
    return file;
  } catch { return null; }
}
