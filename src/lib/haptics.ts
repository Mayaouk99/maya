/** Petit retour haptique (Android / navigateurs compatibles). Sur iOS natif, on passera par @capacitor/haptics. */
export function tap(ms = 8) {
  try {
    navigator.vibrate?.(ms)
  } catch {
    /* ignoré */
  }
}
