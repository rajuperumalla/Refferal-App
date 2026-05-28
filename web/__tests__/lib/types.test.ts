import { STATUS_CONFIG } from '@/lib/types';

describe('STATUS_CONFIG', () => {
  const statuses = ['new','contacted','opd_scheduled','ipd_confirmed','completed','lost'] as const;

  it('defines config for all 6 statuses', () => {
    statuses.forEach(s => expect(STATUS_CONFIG[s]).toBeDefined());
  });

  it('each config has label, color, bg, border, dot', () => {
    statuses.forEach(s => {
      const cfg = STATUS_CONFIG[s];
      expect(cfg.label).toBeTruthy();
      expect(cfg.color).toMatch(/^text-/);
      expect(cfg.bg).toMatch(/^bg-/);
      expect(cfg.border).toMatch(/^border-/);
      expect(cfg.dot).toMatch(/^bg-/);
    });
  });

  it('labels match human-readable strings', () => {
    expect(STATUS_CONFIG.new.label).toBe('New');
    expect(STATUS_CONFIG.contacted.label).toBe('Contacted');
    expect(STATUS_CONFIG.opd_scheduled.label).toBe('OPD Scheduled');
    expect(STATUS_CONFIG.ipd_confirmed.label).toBe('IPD Confirmed');
    expect(STATUS_CONFIG.completed.label).toBe('Completed');
    expect(STATUS_CONFIG.lost.label).toBe('Lost');
  });

  it('all labels are unique', () => {
    const labels = statuses.map(s => STATUS_CONFIG[s].label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
