import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/page';
import { useRouter } from 'next/navigation';

const mockRouter = { push: jest.fn() };
(useRouter as jest.Mock).mockReturnValue(mockRouter);

describe('LoginPage — Phone step', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    render(<LoginPage />);
  });

  it('renders Welcome back heading', () => {
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('renders Phone Number label', () => {
    expect(screen.getByText(/Phone Number/i)).toBeInTheDocument();
  });

  it('renders +91 country code prefix', () => {
    expect(screen.getByText(/\+91/)).toBeInTheDocument();
  });

  it('renders Send OTP button', () => {
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  it('Send OTP button is disabled when phone is empty', () => {
    const btn = screen.getByRole('button', { name: /send otp/i });
    expect(btn.className).toContain('cursor-not-allowed');
  });

  it('only accepts numeric input in phone field', async () => {
    const input = screen.getByPlaceholderText(/98765/i);
    await userEvent.type(input, 'abc123xyz');
    expect(input).toHaveValue('123');
  });

  it('limits phone input to 10 digits', async () => {
    const input = screen.getByPlaceholderText(/98765/i);
    await userEvent.type(input, '12345678901234');
    expect((input as HTMLInputElement).value.length).toBeLessThanOrEqual(10);
  });

  it('advances to OTP step when 10-digit phone is entered and button clicked', async () => {
    const input = screen.getByPlaceholderText(/98765/i);
    await userEvent.type(input, '9876543210');
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    expect(await screen.findByText(/Enter OTP/i)).toBeInTheDocument();
  });

  it('shows feature highlights (Secure OTP, Real-time Tracking, Commission Transparency)', () => {
    expect(screen.getByText(/Secure OTP Login/i)).toBeInTheDocument();
    expect(screen.getByText(/Real-time Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/Commission Transparency/i)).toBeInTheDocument();
  });

  it('shows branding stats on large screen panel', () => {
    expect(screen.getByText(/Active Patients/i)).toBeInTheDocument();
    expect(screen.getByText(/Conversion Rate/i)).toBeInTheDocument();
  });
});

describe('LoginPage — OTP step', () => {
  const setup = async () => {
    render(<LoginPage />);
    const input = screen.getByPlaceholderText(/98765/i);
    await userEvent.type(input, '9876543210');
    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await screen.findByText(/Enter OTP/i);
  };

  beforeEach(() => { jest.clearAllMocks(); });

  it('shows OTP heading and phone hint', async () => {
    await setup();
    expect(screen.getByText(/Enter OTP/i)).toBeInTheDocument();
    expect(screen.getByText(/Sent to/i)).toBeInTheDocument();
  });

  it('renders 6 OTP input boxes', async () => {
    await setup();
    const inputs = screen.getAllByRole('textbox');
    // 6 OTP boxes (phone input is gone in OTP step)
    expect(inputs.length).toBe(6);
  });

  it('Verify & Login button is disabled when OTP is incomplete', async () => {
    await setup();
    const btn = screen.getByRole('button', { name: /verify/i });
    expect(btn).toBeDisabled();
  });

  it('shows demo tip that any 6-digit OTP works', async () => {
    await setup();
    expect(screen.getByText(/any 6-digit OTP/i)).toBeInTheDocument();
  });

  it('Back button returns to phone step', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });

  it('redirects to /dashboard after OTP verified', async () => {
    await setup();
    const otpInputs = screen.getAllByRole('textbox');
    for (const box of otpInputs) {
      await userEvent.type(box, '1');
    }
    fireEvent.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith('/dashboard'), { timeout: 2000 });
  });
});
