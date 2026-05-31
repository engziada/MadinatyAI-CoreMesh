import { isKnownTenant, resolveSubdomainFromHost, schemaForSubdomain } from './tenant-resolver';

describe('tenant-resolver', () => {
  const root = 'madinatyai.com';

  describe('resolveSubdomainFromHost', () => {
    it('extracts the app subdomain', () => {
      expect(resolveSubdomainFromHost('souq.madinatyai.com', root)).toBe('souq');
      expect(resolveSubdomainFromHost('kitchen.madinatyai.com:443', root)).toBe('kitchen');
    });

    it('takes only the left-most label for nested subdomains', () => {
      expect(resolveSubdomainFromHost('souq.staging.madinatyai.com', root)).toBe('souq');
    });

    it('returns null for apex/www/foreign/undefined hosts', () => {
      expect(resolveSubdomainFromHost('madinatyai.com', root)).toBeNull();
      expect(resolveSubdomainFromHost('www.madinatyai.com', root)).toBeNull();
      expect(resolveSubdomainFromHost('localhost:3000', root)).toBeNull();
      expect(resolveSubdomainFromHost(undefined, root)).toBeNull();
    });
  });

  describe('schemaForSubdomain / isKnownTenant', () => {
    it('maps known subdomains to prefixed schemas', () => {
      expect(schemaForSubdomain('souq')).toBe('tenant_souq');
      expect(schemaForSubdomain('timebank')).toBe('tenant_timebank');
      expect(isKnownTenant('kitchen')).toBe(true);
    });

    it('rejects unknown subdomains', () => {
      expect(schemaForSubdomain('unknown')).toBeNull();
      expect(schemaForSubdomain(null)).toBeNull();
      expect(isKnownTenant('nope')).toBe(false);
    });
  });
});
