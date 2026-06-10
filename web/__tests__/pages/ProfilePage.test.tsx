import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfilePage from '@/app/(app)/profile/page';
import { AGENT } from '@/lib/data';

describe('ProfilePage', () => {
  beforeEach(() => render(<ProfilePage />));

  // ── Profile hero ──────────────────────────────────────────────────────────
  it('displays agent name', () => {
    expect(screen.getAllByText(AGENT.name).length).toBeGreaterThan(0);
  });

  it('displays agent email', () => {
    // Email appears in both the hero card and the profile info section
    expect(screen.getAllByText(AGENT.email).length).toBeGreaterThanOrEqual(1);
  });

  it('displays agent ID', () => {
    expect(screen.getByText(new RegExp(AGENT.id))).toBeInTheDocument();
  });

  it('displays commission rate badge', () => {
    expect(screen.getByText(new RegExp(`${AGENT.commissionRate}%`))).toBeInTheDocument();
  });

  it('shows first letter avatar', () => {
    expect(screen.getAllByText(AGENT.name[0]).length).toBeGreaterThan(0);
  });

  // ── Performance overview ──────────────────────────────────────────────────
  it('shows Performance Overview section', () => {
    expect(screen.getByText(/Performance Overview/i)).toBeInTheDocument();
  });

  it('shows Total Leads stat', () => {
    expect(screen.getByText(AGENT.totalLeads.toString())).toBeInTheDocument();
    expect(screen.getByText(/Total Leads/i)).toBeInTheDocument();
  });

  it('shows Conversion Rate stat', () => {
    expect(screen.getByText(`${AGENT.conversionRate}%`)).toBeInTheDocument();
  });

  // ── Profile information ───────────────────────────────────────────────────
  it('shows Profile Information section', () => {
    expect(screen.getByText(/Profile Information/i)).toBeInTheDocument();
  });

  it('shows agent phone number', () => {
    expect(screen.getByText(AGENT.phone)).toBeInTheDocument();
  });

  it('shows agent city', () => {
    expect(screen.getByText(AGENT.city)).toBeInTheDocument();
  });

  // ── Settings toggles ─────────────────────────────────────────────────────
  it('shows Notifications toggle (on by default)', () => {
    expect(screen.getByText(/Push Notifications/i)).toBeInTheDocument();
  });

  it('shows Biometric toggle (off by default)', () => {
    expect(screen.getByText(/Biometric/i)).toBeInTheDocument();
  });

  it('shows Dark Mode toggle', () => {
    expect(screen.getByText(/Dark Mode/i)).toBeInTheDocument();
  });

  it('toggles a setting when clicked', () => {
    // The Biometric toggle is off by default; clicking it turns it on
    const toggles = screen.getAllByRole('generic').filter(
      el => el.className?.includes('rounded-full') && el.className?.includes('cursor-pointer')
    );
    expect(toggles.length).toBeGreaterThan(0);
    const biometricToggle = toggles[1]; // second toggle (Biometric)
    expect(biometricToggle.className).toContain('bg-gray-200'); // off
    fireEvent.click(biometricToggle);
    expect(biometricToggle.className).toContain('bg-blue-600'); // on
  });
});
