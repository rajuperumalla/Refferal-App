import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddPatientPage from '@/app/(app)/add-patient/page';
import { useRouter } from 'next/navigation';

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('AddPatientPage — Step 1: Basic Info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<AddPatientPage />);
  });

  it('renders step progress bar with 3 steps', () => {
    expect(screen.getByText(/Step 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 3/i)).toBeInTheDocument();
  });

  it('shows Basic Information heading', () => {
    expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
  });

  it('renders Patient Full Name field', () => {
    expect(screen.getByLabelText(/Patient Full Name/i)).toBeInTheDocument();
  });

  it('renders Phone Number field with +91 prefix', () => {
    expect(screen.getByText(/\+91/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/98765 43210/)).toBeInTheDocument();
  });

  it('renders Age field', () => {
    expect(screen.getByLabelText(/Age/i)).toBeInTheDocument();
  });

  it('renders Gender buttons (Male, Female, Other)', () => {
    expect(screen.getByRole('button', { name: /Male/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Female/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Other/i })).toBeInTheDocument();
  });

  it('renders Cancel button on step 1', () => {
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('renders Next button', () => {
    expect(screen.getByRole('button', { name: /Next/i })).toBeInTheDocument();
  });

  it('Cancel navigates to /patients', () => {
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(mockPush).toHaveBeenCalledWith('/patients');
  });
});

describe('AddPatientPage — Step 2: Medical Details', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<AddPatientPage />);
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
  });

  it('shows Medical Details heading', () => {
    expect(screen.getByText(/Medical Details/i)).toBeInTheDocument();
  });

  it('renders Specialty dropdown', () => {
    expect(screen.getByLabelText(/Specialty/i)).toBeInTheDocument();
  });

  it('renders City dropdown', () => {
    expect(screen.getByLabelText(/City/i)).toBeInTheDocument();
  });

  it('renders Urgency dropdown', () => {
    expect(screen.getByLabelText(/Urgency/i)).toBeInTheDocument();
  });

  it('renders Back button on step 2', () => {
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
  });

  it('Back returns to step 1', () => {
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByText(/Basic Information/i)).toBeInTheDocument();
  });
});

describe('AddPatientPage — Step 3: Financial & Other', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<AddPatientPage />);
    fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i })); // → step 3
  });

  it('shows Financial & Other heading', () => {
    expect(screen.getByText(/Financial/i)).toBeInTheDocument();
  });

  it('renders Budget Range dropdown', () => {
    expect(screen.getByLabelText(/Budget Range/i)).toBeInTheDocument();
  });

  it('renders Insurance Provider field', () => {
    expect(screen.getByLabelText(/Insurance Provider/i)).toBeInTheDocument();
  });

  it('renders Additional Notes textarea', () => {
    expect(screen.getByLabelText(/Additional Notes/i)).toBeInTheDocument();
  });

  it('shows 24-hour contact info banner', () => {
    expect(screen.getByText(/24 hours/i)).toBeInTheDocument();
  });

  it('shows Submit Lead button on step 3', () => {
    expect(screen.getByRole('button', { name: /Submit Lead/i })).toBeInTheDocument();
  });

  it('shows success screen and redirects after submit', async () => {
    fireEvent.click(screen.getByRole('button', { name: /Submit Lead/i }));
    await waitFor(() => expect(screen.getByText(/Lead Submitted/i)).toBeInTheDocument(), { timeout: 2000 });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/patients'), { timeout: 5000 });
  });
});
