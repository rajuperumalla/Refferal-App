import {
  PATIENTS, NOTIFICATIONS, COMMISSIONS, MONTHLY_EARNINGS, AGENT,
  fmt, fmtL,
} from '@/lib/data';

// ─── fmt ────────────────────────────────────────────────────────────────────
describe('fmt()', () => {
  it('formats small numbers with ₹ prefix', () => {
    expect(fmt(1500)).toBe('₹1,500');
  });
  it('formats large numbers with Indian locale commas', () => {
    expect(fmt(45230)).toBe('₹45,230');
  });
  it('formats zero correctly', () => {
    expect(fmt(0)).toBe('₹0');
  });
});

// ─── fmtL ───────────────────────────────────────────────────────────────────
describe('fmtL()', () => {
  it('formats numbers ≥ 1L as X.XL', () => {
    expect(fmtL(230000)).toBe('₹2.3L');
    expect(fmtL(100000)).toBe('₹1.0L');
  });
  it('formats numbers ≥ 1000 as XK', () => {
    expect(fmtL(45000)).toBe('₹45K');
    expect(fmtL(1000)).toBe('₹1K');
  });
  it('formats small numbers with plain ₹', () => {
    expect(fmtL(500)).toBe('₹500');
  });
});

// ─── PATIENTS ───────────────────────────────────────────────────────────────
describe('PATIENTS data', () => {
  it('contains 6 patients', () => {
    expect(PATIENTS).toHaveLength(6);
  });
  it('each patient has required fields', () => {
    PATIENTS.forEach(p => {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(p).toHaveProperty('phone');
      expect(p).toHaveProperty('age');
      expect(p).toHaveProperty('gender');
      expect(p).toHaveProperty('status');
      expect(p).toHaveProperty('commission');
      expect(p).toHaveProperty('commPct');
      expect(p).toHaveProperty('packageCost');
    });
  });
  it('has unique IDs', () => {
    const ids = PATIENTS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('commissions are positive numbers', () => {
    PATIENTS.forEach(p => expect(p.commission).toBeGreaterThan(0));
  });
  it('ages are plausible (1–120)', () => {
    PATIENTS.forEach(p => {
      expect(p.age).toBeGreaterThanOrEqual(1);
      expect(p.age).toBeLessThanOrEqual(120);
    });
  });
  it('gender is M or F', () => {
    PATIENTS.forEach(p => expect(['M', 'F']).toContain(p.gender));
  });
  it('statuses are valid PatientStatus values', () => {
    const validStatuses = ['new','contacted','opd_scheduled','ipd_confirmed','completed','lost'];
    PATIENTS.forEach(p => expect(validStatuses).toContain(p.status));
  });
  it('includes all 6 distinct statuses across patients', () => {
    const statuses = new Set(PATIENTS.map(p => p.status));
    expect(statuses.size).toBe(6);
  });
});

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
describe('NOTIFICATIONS data', () => {
  it('contains 6 notifications', () => {
    expect(NOTIFICATIONS).toHaveLength(6);
  });
  it('has 2 unread notifications', () => {
    expect(NOTIFICATIONS.filter(n => !n.read)).toHaveLength(2);
  });
  it('all types are valid', () => {
    const validTypes = ['commission','patient','appointment','alert'];
    NOTIFICATIONS.forEach(n => expect(validTypes).toContain(n.type));
  });
  it('each notification has title and body', () => {
    NOTIFICATIONS.forEach(n => {
      expect(n.title).toBeTruthy();
      expect(n.body).toBeTruthy();
    });
  });
});

// ─── COMMISSIONS ────────────────────────────────────────────────────────────
describe('COMMISSIONS data', () => {
  it('contains 5 commission records', () => {
    expect(COMMISSIONS).toHaveLength(5);
  });
  it('has both pending and paid statuses', () => {
    const statuses = new Set(COMMISSIONS.map(c => c.status));
    expect(statuses).toContain('pending');
    expect(statuses).toContain('paid');
  });
  it('all amounts are positive', () => {
    COMMISSIONS.forEach(c => expect(c.amount).toBeGreaterThan(0));
  });
});

// ─── MONTHLY_EARNINGS ────────────────────────────────────────────────────────
describe('MONTHLY_EARNINGS data', () => {
  it('contains 6 months of data', () => {
    expect(MONTHLY_EARNINGS).toHaveLength(6);
  });
  it('amounts are increasing month over month (growth trend)', () => {
    for (let i = 1; i < MONTHLY_EARNINGS.length; i++) {
      expect(MONTHLY_EARNINGS[i].amount).toBeGreaterThan(MONTHLY_EARNINGS[i - 1].amount);
    }
  });
  it('last month is May with highest amount', () => {
    const last = MONTHLY_EARNINGS[MONTHLY_EARNINGS.length - 1];
    expect(last.month).toBe('May');
    expect(last.amount).toBe(45230);
  });
});

// ─── AGENT ───────────────────────────────────────────────────────────────────
describe('AGENT data', () => {
  it('has required profile fields', () => {
    expect(AGENT.name).toBeTruthy();
    expect(AGENT.id).toBeTruthy();
    expect(AGENT.phone).toBeTruthy();
    expect(AGENT.email).toBeTruthy();
  });
  it('commissionRate is a positive number', () => {
    expect(AGENT.commissionRate).toBeGreaterThan(0);
  });
  it('totalEarned matches thisMonth + implied history', () => {
    expect(AGENT.totalEarned).toBeGreaterThanOrEqual(AGENT.thisMonth);
  });
  it('conversionRate is between 0 and 100', () => {
    expect(AGENT.conversionRate).toBeGreaterThanOrEqual(0);
    expect(AGENT.conversionRate).toBeLessThanOrEqual(100);
  });
});
