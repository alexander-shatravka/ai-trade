/**
 * Light/dark switching. Three states are possible: an explicit choice writes
 * data-theme onto <html> and is remembered, while "system" removes the
 * attribute and lets prefers-color-scheme decide.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ai-trade-theme';

export function useTheme() {
  const theme = useState<Theme>('theme', () => 'light');

  onMounted(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    theme.value =
      stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  function apply(next: Theme) {
    theme.value = next;
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  function toggle() {
    apply(theme.value === 'dark' ? 'light' : 'dark');
  }

  return { theme, toggle };
}
