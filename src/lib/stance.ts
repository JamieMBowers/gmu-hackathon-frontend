export function normalizeStanceKey(stance: string): string {
  return stance.trim().toLowerCase();
}

export function getStanceChipColor(stance: string): string {
  const normalized = normalizeStanceKey(stance);
  switch (normalized) {
    case 'supports':
      return 'green-darken-1';
    case 'opposes':
      return 'red-darken-1';
    case 'mixed':
      return 'amber-darken-1';
    case 'irrelevant':
      return 'blue-grey-darken-1';
    default:
      return 'gray';
  }
}
