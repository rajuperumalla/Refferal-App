import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/StatusBadge';
import { STATUS_CONFIG } from '@/lib/types';

const statuses = ['new','contacted','opd_scheduled','ipd_confirmed','completed','lost'] as const;

describe('StatusBadge', () => {
  statuses.forEach(status => {
    const { label } = STATUS_CONFIG[status];

    it(`renders label "${label}" for status "${status}"`, () => {
      render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    it(`applies correct CSS classes for status "${status}"`, () => {
      const { container } = render(<StatusBadge status={status} />);
      const badge = container.firstChild as HTMLElement;
      const cfg = STATUS_CONFIG[status];
      expect(badge.className).toContain(cfg.bg);
      expect(badge.className).toContain(cfg.color);
      expect(badge.className).toContain(cfg.border);
    });

    it(`renders a dot indicator for status "${status}"`, () => {
      const { container } = render(<StatusBadge status={status} />);
      const dot = container.querySelector('span span');
      expect(dot).toBeInTheDocument();
      expect(dot!.className).toContain(STATUS_CONFIG[status].dot);
    });
  });

  it('renders as a <span> element', () => {
    const { container } = render(<StatusBadge status="new" />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });
});
