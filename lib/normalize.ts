// Shared utility that can be used in both client and server components
export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}
