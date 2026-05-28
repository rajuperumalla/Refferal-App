import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EarningsPage from '@/app/(app)/earnings/page';
import { COMMISSIONS, MONTHLY_EARNINGS, AGENT } from '@/lib/data';

describe('EarningsPage', () => {
  beforeEach(() => render(<EarningsPage />));

  // ── Tabs ─────────────────────────────────────────────────────────────────
  it('renders 3 tabs: Overview, Pending, Paid', () => {
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pending/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paid/i })).toBeInTheDocument();
  });

  it('shows pending count in Pending tab label', () => {
    const pendingCount = COMMISSIONS.filter(c => c.status === 'pending').length;
    expect(screen.getByRole('button', { name: new RegExp(`Pending.*${pendingCount}`) })).toBeInTheDocument();
  });

  it('shows paid count in Paid tab label', () => {
    const paidCount = COMMISSIONS.filter(c => c.status === 'paid').length;
    expect(screen.getByRole('button', { name: new RegExp(`Paid.*${paidCount}`) })).toBeInTheDocument();
  });

  // ── Overview tab ─────────────────────────────────────────────────────────
  it('shows this month earnings on overview', () => {
    expect(screen.getByText(/₹45,230/)).toBeInTheDocument();
  });

  it('shows growth percentage on overview', () => {
    expect(screen.getByText(/%/)).toBeInTheDocument();
  });

  it('shows Top Procedures section', () => {
    expect(screen.getByText(/Top Procedures/i)).toBeInTheDocument();
  });

  it('lists top procedures', () => {
    expect(screen.getByText(/Knee Replacement/i)).toBeInTheDocument();
    expect(screen.getByText(/Gallbladder/i)).toBeInTheDocument();
    expect(screen.getByText(/Cataract/i)).toBeInTheDocument();
  });

  it('shows Monthly Earnings Breakdown chart', () => {
    expect(screen.getByText(/Monthly Earnings Breakdown/i)).toBeInTheDocument();
  });

  it('renders all month labels in chart', () => {
    MONTHLY_EARNINGS.forEach(m => {
      expect(screen.getByText(m.month)).toBeInTheDocument();
    });
  });

  // ── Pending tab ───────────────────────────────────────────────────────────
  it('switches to Pending tab and shows pending commissions', () => {
    fireEvent.click(screen.getByRole('button', { name: /pending/i }));
    const pendingCommissions = COMMISSIONS.filter(c => c.status === 'pending');
    pendingCommissions.forEach(c => {
      expect(screen.getByText(c.patientName)).toBeInTheDocument();
    });
  });

  it('shows estimated date for pending items', () => {
    fireEvent.click(screen.getByRole('button', { name: /pending/i }));
    // Multiple pending items may show Jun 2024 — just check at least one exists
    expect(screen.getAllByText(/Jun 2024/i).length).toBeGreaterThanOrEqual(1);
  });

  // ── Paid tab ─────────────────────────────────────────────────────────────
  it('switches to Paid tab and shows paid commissions', () => {
    fireEvent.click(screen.getByRole('button', { name: /paid/i }));
    const paidCommissions = COMMISSIONS.filter(c => c.status === 'paid');
    paidCommissions.forEach(c => {
      // Escape special regex chars (parentheses in "Multiple (3 cases)")
      const escaped = c.patientName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(screen.getByText(new RegExp(escaped))).toBeInTheDocument();
    });
  });

  it('shows UTR reference numbers on paid tab', () => {
    fireEvent.click(screen.getByRole('button', { name: /paid/i }));
    expect(screen.getAllByText(/HDFC/i).length).toBeGreaterThan(0);
  });
});
