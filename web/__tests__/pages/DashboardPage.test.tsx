import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(app)/dashboard/page';
import { AGENT, MONTHLY_EARNINGS } from '@/lib/data';

describe('DashboardPage', () => {
  beforeEach(() => render(<DashboardPage />));

  // ── Earnings hero card ────────────────────────────────────────────────────
  it('shows This Month\'s Earnings label', () => {
    expect(screen.getByText(/This Month.s Earnings/i)).toBeInTheDocument();
  });

  it('displays current month earnings (₹45,230)', () => {
    expect(screen.getByText(/₹45,230/)).toBeInTheDocument();
  });

  it('displays growth percentage badge', () => {
    expect(screen.getByText(/from last month/i)).toBeInTheDocument();
  });

  it('shows Total Earned in lakhs format', () => {
    expect(screen.getByText(/₹2\.3L/)).toBeInTheDocument();
  });

  it('shows Pending amount', () => {
    expect(screen.getByText(/₹8,400/)).toBeInTheDocument();
  });

  it('shows Total Leads count', () => {
    expect(screen.getByText(AGENT.totalLeads.toString())).toBeInTheDocument();
  });

  // ── 6-Month Trend chart ───────────────────────────────────────────────────
  it('shows 6-Month Trend section', () => {
    expect(screen.getByText(/6-Month Trend/i)).toBeInTheDocument();
  });

  it('renders all 6 month labels', () => {
    MONTHLY_EARNINGS.forEach(m => {
      expect(screen.getByText(m.month)).toBeInTheDocument();
    });
  });

  // ── Stats grid ────────────────────────────────────────────────────────────
  it('shows Active Patients stat', () => {
    expect(screen.getByText(/Active Patients/i)).toBeInTheDocument();
  });

  it('shows Pending Surgeries stat', () => {
    expect(screen.getByText(/Pending Surgeries/i)).toBeInTheDocument();
  });

  it('shows Conversion Rate stat', () => {
    expect(screen.getByText(/Conversion Rate/i)).toBeInTheDocument();
    expect(screen.getByText(`${AGENT.conversionRate}%`)).toBeInTheDocument();
  });

  it('shows Avg Commission stat', () => {
    expect(screen.getByText(/Avg Commission/i)).toBeInTheDocument();
  });

  // ── Recent Activity ───────────────────────────────────────────────────────
  it('shows Recent Activity section', () => {
    expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
  });

  it('shows "View all" link for activity', () => {
    const viewAll = screen.getAllByRole('link', { name: /view all/i });
    expect(viewAll.length).toBeGreaterThanOrEqual(1);
  });

  it('renders recent activity items', () => {
    expect(screen.getByText(/Ramesh Kumar — Surgery completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Commission.*credited/i)).toBeInTheDocument();
  });

  // ── Recent Patients ───────────────────────────────────────────────────────
  it('shows Recent Patients section', () => {
    expect(screen.getByText(/Recent Patients/i)).toBeInTheDocument();
  });

  it('renders at least one recent patient name', () => {
    expect(screen.getByText('Ramesh Kumar')).toBeInTheDocument();
  });

  it('recent patients link to /patients', () => {
    const viewAllLinks = screen.getAllByRole('link', { name: /view all/i });
    const patientsLink = viewAllLinks.find(l => l.getAttribute('href') === '/patients');
    expect(patientsLink).toBeDefined();
  });
});
