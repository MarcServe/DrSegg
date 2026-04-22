/**
 * Shared UUID + URL helpers so `?case=uuid` is the source of truth on first paint
 * (avoids a one-frame wrong/null case from React context before setCaseId runs).
 */
export const CASE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getCaseIdFromUrl(searchParams: { get: (name: string) => string | null }): string | null {
  const c = searchParams.get("case");
  return c && CASE_UUID_RE.test(c) ? c : null;
}

export function resolveEffectiveCaseId(
  fromUrl: string | null,
  fromContext: string | null | undefined
): string | null {
  return fromUrl ?? fromContext ?? null;
}
