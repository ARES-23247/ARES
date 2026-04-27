import { render, waitFor } from '@testing-library/react';
import Turnstile from './Turnstile';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Turnstile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bypasses turnstile in local environment and calls onVerify with test token', async () => {
    // Override window.location to simulate localhost if needed, but jsdom already defaults to localhost or 127.0.0.1
    const onVerify = vi.fn();
    render(<Turnstile onVerify={onVerify} />);
    
    await waitFor(() => {
      expect(onVerify).toHaveBeenCalledWith('test-bypass-token');
    });
  });
});
