import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatientsPage from '@/app/(app)/patients/page';
import { PATIENTS } from '@/lib/data';

describe('PatientsPage', () => {
  beforeEach(() => render(<PatientsPage />));

  // ── Initial render ────────────────────────────────────────────────────────
  it('shows all 6 patients by default', () => {
    expect(screen.getByText(`Showing 6 of ${PATIENTS.length} patients`)).toBeInTheDocument();
  });

  it('renders a card for each patient', () => {
    PATIENTS.forEach(p => {
      expect(screen.getByText(p.name)).toBeInTheDocument();
    });
  });

  it('renders the search input', () => {
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument();
  });

  it('renders all filter chips (All, New, Contacted, OPD, IPD, Completed, Lost)', () => {
    expect(screen.getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Contacted/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /OPD/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /IPD/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Completed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lost/i })).toBeInTheDocument();
  });

  it('renders sort dropdown with 3 options', () => {
    const select = screen.getByRole('combobox');
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(3);
  });

  it('renders Add Patient link', () => {
    const addLinks = screen.getAllByRole('link', { name: /add patient/i });
    expect(addLinks.length).toBeGreaterThanOrEqual(1);
    expect(addLinks[0]).toHaveAttribute('href', '/add-patient');
  });

  // ── Search ────────────────────────────────────────────────────────────────
  it('filters by patient name search', async () => {
    const input = screen.getByPlaceholderText(/search by name/i);
    await userEvent.type(input, 'Ramesh');
    expect(screen.getByText(/Showing 1 of 6 patients/)).toBeInTheDocument();
    expect(screen.getByText('Ramesh Kumar')).toBeInTheDocument();
    expect(screen.queryByText('Priya Sharma')).not.toBeInTheDocument();
  });

  it('filters by specialty search', async () => {
    const input = screen.getByPlaceholderText(/search by name/i);
    await userEvent.type(input, 'Cardiology');
    expect(screen.getByText('Suresh Rao')).toBeInTheDocument();
    expect(screen.queryByText('Ramesh Kumar')).not.toBeInTheDocument();
  });

  it('shows empty state when search has no matches', async () => {
    const input = screen.getByPlaceholderText(/search by name/i);
    await userEvent.type(input, 'zzznomatch');
    expect(screen.getByText(/No patients found/i)).toBeInTheDocument();
  });

  // ── Filter chips ─────────────────────────────────────────────────────────
  it('filters to only "New" patients', () => {
    fireEvent.click(screen.getByRole('button', { name: /New/i }));
    const newPatients = PATIENTS.filter(p => p.status === 'new');
    expect(screen.getByText(new RegExp(`Showing ${newPatients.length} of`))).toBeInTheDocument();
    expect(screen.getByText('Suresh Rao')).toBeInTheDocument();
  });

  it('filters to only "Completed" patients', () => {
    fireEvent.click(screen.getByRole('button', { name: /Completed/i }));
    expect(screen.getByText('Vijay Patel')).toBeInTheDocument();
    expect(screen.queryByText('Ramesh Kumar')).not.toBeInTheDocument();
  });

  it('filters to only "Lost" patients', () => {
    fireEvent.click(screen.getByRole('button', { name: /Lost/i }));
    expect(screen.getByText('Kavitha Reddy')).toBeInTheDocument();
    expect(screen.queryByText('Ramesh Kumar')).not.toBeInTheDocument();
  });

  it('resets to all when "All" chip is clicked', () => {
    fireEvent.click(screen.getByRole('button', { name: /New/i }));
    fireEvent.click(screen.getByRole('button', { name: /^All$/i }));
    expect(screen.getByText(`Showing 6 of ${PATIENTS.length} patients`)).toBeInTheDocument();
  });

  // ── Sort ─────────────────────────────────────────────────────────────────
  it('sorts by Name A–Z', () => {
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'name' } });
    const names = screen.getAllByText(/Kumar|Sharma|Rao|Devi|Patel|Reddy/).map(el => el.textContent);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });
});
