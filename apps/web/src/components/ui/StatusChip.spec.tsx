import { describe, it, expect } from 'vitest';
import React from 'react';
import { StatusChip } from './StatusChip';

describe('StatusChip Component', () => {
  it('renders OPEN status correctly', () => {
    const chip = StatusChip({ status: 'OPEN' }) as React.ReactElement;
    expect(chip.props.className).toContain('text-blue-700');
  });

  it('renders PAID status correctly', () => {
    const chip = StatusChip({ status: 'PAID' }) as React.ReactElement;
    expect(chip.props.className).toContain('text-emerald-700');
  });

  it('renders OVERDUE status correctly', () => {
    const chip = StatusChip({ status: 'OVERDUE' }) as React.ReactElement;
    expect(chip.props.className).toContain('text-rose-700');
  });
});
