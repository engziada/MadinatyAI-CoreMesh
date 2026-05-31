import { TENANT_SCHEMA_MAP } from '@madinatyai/common';

/**
 * Pure helpers for resolving a tenant subdomain from request inputs.
 * Kept side-effect free so they are trivially unit-testable.
 */

/**
 * Extract the tenant subdomain from a Host header given the root domain.
 * Returns null when the host is the apex/root or has no app subdomain.
 *
 * @example resolveSubdomainFromHost('souq.madinatyai.com', 'madinatyai.com') -> 'souq'
 * @example resolveSubdomainFromHost('madinatyai.com', 'madinatyai.com')      -> null
 */
export function resolveSubdomainFromHost(
  host: string | undefined,
  rootDomain: string,
): string | null {
  if (!host) return null;
  // Strip port and lowercase.
  const cleanHost = host.split(':')[0].trim().toLowerCase();
  const root = rootDomain.trim().toLowerCase();

  if (cleanHost === root || cleanHost === `www.${root}`) return null;
  if (!cleanHost.endsWith(`.${root}`)) {
    // Not under the root domain (e.g. localhost) — no subdomain tenant.
    return null;
  }
  const sub = cleanHost.slice(0, -1 * (`.${root}`).length);
  // Only take the left-most label (souq.staging.madinatyai.com -> souq).
  const label = sub.split('.')[0];
  return label || null;
}

/** Map a subdomain to its physical PostgreSQL schema, or null if unknown. */
export function schemaForSubdomain(subdomain: string | null): string | null {
  if (!subdomain) return null;
  return TENANT_SCHEMA_MAP[subdomain] ?? null;
}

/** True when the subdomain corresponds to a known ecosystem tenant. */
export function isKnownTenant(subdomain: string | null): boolean {
  return schemaForSubdomain(subdomain) !== null;
}
