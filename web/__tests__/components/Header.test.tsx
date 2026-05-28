import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '@/components/Header';
import { usePathname } from 'next/navigation';

const mockUsePathname = usePathname as jest.Mock;

describe('Header', () => {
  const cases = [
    ['/dashboard',     'Dashboard'],
    ['/patients',      'My Patients'],
    ['/add-patient',   'Add Patient Lead'],
    ['/earnings',      'Commissions & Earnings'],
    ['/notifications', 'Notifications'],
    ['/profile',       'Profile & Settings'],
    ['/patients/101',  'Patient Details'],
  ] as const;

  cases.forEach(([path, title]) => {
    it(`shows title "${title}" for path "${path}"`, () => {
      mockUsePathname.mockReturnValue(path);
      render(<Header />);
      expect(screen.getByText(title)).toBeInTheDocument();
    });
  });

  it('shows "MediReferral" for unknown paths', () => {
    mockUsePathname.mockReturnValue('/unknown');
    render(<Header />);
    expect(screen.getByText('MediReferral')).toBeInTheDocument();
  });

  it('renders Add Patient button linking to /add-patient', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Header />);
    const btn = screen.getByRole('link', { name: /add patient/i });
    expect(btn).toHaveAttribute('href', '/add-patient');
  });

  it('renders notification bell linking to /notifications', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Header />);
    const notifLinks = screen.getAllByRole('link').filter(
      l => l.getAttribute('href') === '/notifications'
    );
    expect(notifLinks.length).toBeGreaterThanOrEqual(1);
  });

  it('renders profile avatar linking to /profile', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Header />);
    const profileLink = screen.getByRole('link', { name: /^R$/i });
    expect(profileLink).toHaveAttribute('href', '/profile');
  });

  it('shows partner portal subtitle', () => {
    mockUsePathname.mockReturnValue('/dashboard');
    render(<Header />);
    expect(screen.getByText(/Partner Portal/i)).toBeInTheDocument();
  });
});
