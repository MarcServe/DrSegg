/** Public in-app default when `drug_database.image_url` is null. */
export const DRUG_IMAGE_PLACEHOLDER = "/drug-placeholder.svg";

export function resolveDrugImageUrl(url: string | null | undefined): string {
  const t = url?.trim();
  if (t) return t;
  return DRUG_IMAGE_PLACEHOLDER;
}
