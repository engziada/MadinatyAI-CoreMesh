/** Request header used to pass an explicit tenant when no subdomain is present. */
export const TENANT_HEADER = 'x-tenant-id';

/** Key under which the resolved tenant context is attached to the request. */
export const TENANT_REQUEST_KEY = 'tenantContext';

/** Canonical subdomain -> physical PostgreSQL schema mapping (prefixed). */
export const TENANT_SCHEMA_MAP: Readonly<Record<string, string>> = Object.freeze({
  souq: 'tenant_souq',
  kitchen: 'tenant_kitchen',
  tutor: 'tenant_tutor',
  timebank: 'tenant_timebank',
  kanto: 'tenant_soukelkanto',
});
