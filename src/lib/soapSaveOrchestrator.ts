export type SaveResult = { ok: boolean; letter: string };

export function aggregateSaveResults(
  results: Array<SaveResult | undefined>
): { success: boolean; failedLetters: string[] } {
  const failedLetters = results
    .filter((r): r is SaveResult => !!r)
    .filter(r => !r.ok)
    .map(r => r.letter);
  return { success: failedLetters.length === 0, failedLetters };
}
