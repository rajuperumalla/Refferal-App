import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { AGENT } from '@/lib/data';

const mockUsePathname = usePathname as jest.Mock;

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Patients',  href: '/patients' },
  { label: 'Add Patient', href: '/add-patient' },
  { label: 'Earnings',  href: '/earnings' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Profile',   href: '/profile' },
];

describe('Sidebar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/dashboard');
  });

  it('renders the MediReferral brand name', () => {
    render(<Sidebar />);
    expect(screen.getAllByText('MediReferral').length).toBeGreaterThan(0);
  });

  it('renders agent name', () => {
    render(<Sidebar />);
    expect(screen.getAllByText(AGENT.name).length).toBeGreaterThan(0);
  });

  it('renders agent ID', () => {
    render(<Sidebar />);
    expect(screen.getAllByText(AGENT.id).length).toBeGreaterThan(0);
  });

  NAV_ITEMS.forEach(({ label, href }) => {
    it(`renders nav link "${label}" pointing to "${href}"`, () => {
      render(<Sidebar />);
      const links = screen.getAllByRole('link', { name: new RegExp(label, 'i') });
      const match = links.find(l => l.getAttribute('href') === href);
      expect(match).toBeDefined();
    });
  });

  it('highlights Dashboard as active on /dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    const { container } = render(<Sidebar />);
    const dashLink = Array.from(container.querySelectorAll('a')).find(
      a => a.getAttribute('href') === '/dashboard'
    );
    expect(dashLink?.className).toContain('text-blue-700');
  });

  it('highlights Patients as active on /patients', () => {
    mockUsePathname.mockReturnValue('/patients');
    const { container } = render(<Sidebar />);
    const patientsLink = Array.from(container.querySelectorAll('a')).find(
      a => a.getAttribute('href') === '/patients'
    );
    expect(patientsLink?.className).toContain('text-blue-700');
  });

  it('shows notification badge with count 2', () => {
    render(<Sidebar />);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('shows commission rate in footer', () => {
    render(<Sidebar />);
    expect(screen.getAllByText(new RegExp(`${AGENT.commissionRate}%`)).length).toBeGreaterThan(0);
  });

  it('shows Active status in footer', () => {
    render(<Sidebar />);
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0);
  });

  it('renders hamburger button on mobile (always in DOM)', () => {
    render(<Sidebar />);
    const hamburger = screen.getByRole('button', { name: /toggle menu/i });
    expect(hamburger).toBeInTheDocument();
  });

  it('opens mobile drawer when hamburger is clicked', () => {
    render(<Sidebar />);
    const hamburger = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(hamburger);
    // After opening, ✕ close button should appear
    expect(hamburger.textContent).toContain('✕');
  });
});
