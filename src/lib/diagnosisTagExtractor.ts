export function extractDiagnosisTags(soap_a: string): string[] {
  if (!soap_a || !soap_a.trim()) return [];

  const tags: string[] = [];
  for (const line of soap_a.split('\n')) {
    if (tags.length >= 3) break;
    const match = line.trim().match(/^\d+\.\s+(.+)/);
    if (match) {
      tags.push(match[1].trim().slice(0, 25));
    }
  }

  return tags;
}
