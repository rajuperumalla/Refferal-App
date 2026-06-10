import React from 'react';
import { render, screen } from '@testing-library/react';
import PatientCard from '@/components/PatientCard';
import { AdminPatient } from '@/lib/admin-data';

// Matches PATIENTS[0] from data.ts plus the agentId/agentName fields required by AdminPatient
const patient: AdminPatient = {
  id: 101, name: 'Ramesh Kumar', phone: '+91 98765 43210', age: 45, gender: 'M',
  specialty: 'Orthopaedics', procedure: 'Knee Replacement', status: 'ipd_confirmed',
  commission: 4500, commPct: 3.75, packageCost: 120000,
  city: 'Hyderabad', hospital: 'Apollo Hospitals',
  agentId: 'AG-HYD-001', agentName: 'Raju Perumalla',
  createdAt: '10 May 2024',
};

describe('PatientCard', () => {
  beforeEach(() => render(<PatientCard patient={patient} />));

  // ── Identity ──────────────────────────────────────────────────────────────
  it('displays patient name', () => {
    expect(screen.getByText(patient.name)).toBeInTheDocument();
  });

  it('displays phone, age, and gender', () => {
    // Escape special regex chars in phone (+91 …)
    const escapedPhone = patient.phone.replace(/[+]/g, '\\+');
    expect(screen.getByText(new RegExp(escapedPhone))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`Age ${patient.age}`))).toBeInTheDocument();
    expect(screen.getByText(/Male/i)).toBeInTheDocument();
  });

  it('shows first letter of patient name as avatar', () => {
    expect(screen.getByText(patient.name[0])).toBeInTheDocument();
  });

  // ── Tags ──────────────────────────────────────────────────────────────────
  it('displays specialty tag', () => {
    expect(screen.getByText(patient.specialty)).toBeInTheDocument();
  });

  it('displays procedure tag', () => {
    expect(screen.getByText(patient.procedure)).toBeInTheDocument();
  });

  it('displays city tag', () => {
    expect(screen.getByText(new RegExp(patient.city))).toBeInTheDocument();
  });

  // ── Financial ─────────────────────────────────────────────────────────────
  it('displays commission amount and percentage', () => {
    expect(screen.getByText(/₹4,500/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${patient.commPct}%`))).toBeInTheDocument();
  });

  it('displays package cost', () => {
    expect(screen.getByText(/₹1,20,000/)).toBeInTheDocument();
  });

  it('displays hospital name when present', () => {
    expect(screen.getByText(patient.hospital!)).toBeInTheDocument();
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  it('renders Call link with tel: href', () => {
    const callLink = screen.getByRole('link', { name: /call/i });
    expect(callLink).toHaveAttribute('href', `tel:${patient.phone}`);
  });

  it('renders WhatsApp link with wa.me href', () => {
    const waLink = screen.getByRole('link', { name: /whatsapp/i });
    const digits = patient.phone.replace(/\D/g, '');
    expect(waLink).toHaveAttribute('href', `https://wa.me/${digits}`);
  });

  it('renders View Details link pointing to /patients/:id', () => {
    const detailsLink = screen.getByRole('link', { name: /view details/i });
    expect(detailsLink).toHaveAttribute('href', `/patients/${patient.id}`);
  });

  // ── Status badge ─────────────────────────────────────────────────────────
  it('shows StatusBadge with correct label', () => {
    expect(screen.getByText('IPD Confirmed')).toBeInTheDocument();
  });

  // ── No hospital case ─────────────────────────────────────────────────────
  it('hides hospital row when hospital is null', () => {
    const noHospitalPatient: AdminPatient = { ...patient, hospital: null };
    const { container } = render(<PatientCard patient={noHospitalPatient} />);
    // "Hospital" label only appears inside this card's container when hospital is set
    expect(container.querySelector('[class*="text-gray-400"]')?.textContent).not.toContain('Hospital');
  });

  it('shows "Female" for female patients', () => {
    const femalePatient: AdminPatient = { ...patient, gender: 'F' };
    render(<PatientCard patient={femalePatient} />);
    expect(screen.getByText(/Female/i)).toBeInTheDocument();
  });
});
