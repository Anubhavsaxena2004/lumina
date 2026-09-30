import { describe, it, expect } from 'vitest';
import React from 'react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with correct text and classes', () => {
    const btn = Button({
      children: 'Click Me',
      variant: 'primary',
      size: 'md',
    }) as React.ReactElement;
    expect(btn.props.className).toContain('bg-[#9B1C31]');
    expect(btn.props.className).toContain('min-h-[44px]');
  });

  it('renders gold variant correctly', () => {
    const btn = Button({
      children: 'Gold Button',
      variant: 'gold',
    }) as React.ReactElement;
    expect(btn.props.className).toContain('bg-[#B8893B]');
  });

  it('disables button when isLoading is true', () => {
    const btn = Button({
      children: 'Saving...',
      isLoading: true,
    }) as React.ReactElement;
    expect(btn.props.disabled).toBe(true);
  });
});
