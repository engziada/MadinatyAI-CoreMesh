import { calculateTrustScore } from './trust-score.calculator';

describe('calculateTrustScore', () => {
  const now = new Date('2026-01-01T00:00:00Z');

  it('returns the base score for a brand-new clean account', () => {
    const r = calculateTrustScore({ createdAt: now, reports: [], now });
    expect(r.score).toBe(100);
    expect(r.isBanned).toBe(false);
    expect(r.penalty).toBe(0);
  });

  it('applies severity-weighted penalties', () => {
    const r = calculateTrustScore({
      createdAt: now,
      reports: [{ severity: 5, isPlatformWideBanned: false }],
      now,
    });
    // 100 - (5 * 8) = 60
    expect(r.penalty).toBe(40);
    expect(r.score).toBe(60);
    expect(r.isBanned).toBe(false);
  });

  it('bans when score falls to/below the threshold', () => {
    const r = calculateTrustScore({
      createdAt: now,
      reports: [
        { severity: 5, isPlatformWideBanned: false },
        { severity: 5, isPlatformWideBanned: false },
        { severity: 1, isPlatformWideBanned: false },
      ],
      now,
      banThreshold: 20,
    });
    // 100 - (40 + 40 + 8) = 12 -> banned
    expect(r.score).toBe(12);
    expect(r.isBanned).toBe(true);
  });

  it('hard-bans when any report is platform-wide banned, regardless of score', () => {
    const r = calculateTrustScore({
      createdAt: now,
      reports: [{ severity: 1, isPlatformWideBanned: true }],
      now,
    });
    expect(r.isBanned).toBe(true);
  });

  it('adds a capped longevity bonus and clamps to [0,100]', () => {
    const oldAccount = new Date('2020-01-01T00:00:00Z');
    const r = calculateTrustScore({ createdAt: oldAccount, reports: [], now });
    expect(r.ageBonus).toBe(20); // capped
    expect(r.score).toBe(100); // clamped
  });

  it('never drops below 0', () => {
    const reports = Array.from({ length: 10 }, () => ({
      severity: 5,
      isPlatformWideBanned: false,
    }));
    const r = calculateTrustScore({ createdAt: now, reports, now });
    expect(r.score).toBe(0);
  });
});
