export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function middleTruncate(s: string, suffixLen = 16): { prefix: string; suffix: string } {
  if (s.length <= suffixLen) return { prefix: "", suffix: s };
  return {
    prefix: s.slice(0, s.length - suffixLen),
    suffix: s.slice(-suffixLen),
  };
}
