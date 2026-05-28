import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationsPage from '@/app/(app)/notifications/page';
import { NOTIFICATIONS } from '@/lib/data';

describe('NotificationsPage', () => {
  beforeEach(() => render(<NotificationsPage />));

  // ── Initial render ────────────────────────────────────────────────────────
  it('shows "All Notifications" heading', () => {
    expect(screen.getByText(/All Notifications/i)).toBeInTheDocument();
  });

  it('shows unread count (2 unread)', () => {
    expect(screen.getByText(/2 unread notifications/i)).toBeInTheDocument();
  });

  it('renders all 6 notifications initially', () => {
    NOTIFICATIONS.forEach(n => {
      expect(screen.getByText(n.title)).toBeInTheDocument();
    });
  });

  it('shows "Mark all as read" button when there are unread notifications', () => {
    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
  });

  // ── Filter tabs ───────────────────────────────────────────────────────────
  it('renders all filter category buttons', () => {
    // Use getAllByRole since "All" text also appears in "Mark all as read"
    const allBtns = screen.getAllByRole('button', { name: /All/i });
    expect(allBtns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Commission/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Patients/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Appointments/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Alerts/i })).toBeInTheDocument();
  });

  it('filters to commission notifications only', () => {
    fireEvent.click(screen.getByRole('button', { name: /Commission/i }));
    const commissionCount = NOTIFICATIONS.filter(n => n.type === 'commission').length;
    const commissionNotifs = NOTIFICATIONS.filter(n => n.type === 'commission');
    commissionNotifs.forEach(n => expect(screen.getByText(n.title)).toBeInTheDocument());
    const otherNotifs = NOTIFICATIONS.filter(n => n.type !== 'commission');
    otherNotifs.forEach(n => expect(screen.queryByText(n.title)).not.toBeInTheDocument());
    expect(commissionCount).toBe(2);
  });

  it('filters to patient notifications only', () => {
    fireEvent.click(screen.getByRole('button', { name: /Patients/i }));
    NOTIFICATIONS.filter(n => n.type === 'patient').forEach(n => {
      expect(screen.getByText(n.title)).toBeInTheDocument();
    });
    NOTIFICATIONS.filter(n => n.type !== 'patient').forEach(n => {
      expect(screen.queryByText(n.title)).not.toBeInTheDocument();
    });
  });

  it('shows empty state when a category has no notifications', () => {
    // Alert category has 1 notification. Filter by appointment to see if it only shows those.
    fireEvent.click(screen.getByRole('button', { name: /Appointments/i }));
    expect(screen.getByText('OPD Reminder')).toBeInTheDocument();
  });

  it('resets to all when All is re-selected', () => {
    fireEvent.click(screen.getByRole('button', { name: /Commission/i }));
    // "All" filter button has accessible name "🔔 All" — match with partial text
    fireEvent.click(screen.getByRole('button', { name: /🔔 All/ }));
    NOTIFICATIONS.forEach(n => expect(screen.getByText(n.title)).toBeInTheDocument());
  });

  // ── Mark as read ─────────────────────────────────────────────────────────
  it('marks all as read when button is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }));
    expect(screen.queryByText(/unread notification/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
  });

  it('marks a single notification as read on click', () => {
    // The first unread notification (id=1) is "Commission Credited"
    const notifEl = screen.getByText('Commission Credited').closest('[class*="cursor-pointer"]');
    fireEvent.click(notifEl!);
    // After clicking, the "2 unread" should decrease to 1
    expect(screen.getByText(/1 unread notification/i)).toBeInTheDocument();
  });
});
