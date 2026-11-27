// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardLayout from './DashboardLayout.jsx';

afterEach(() => {
  cleanup();
});

describe('password controls', () => {
  it('keeps recovery password fields disabled until account verification', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <DashboardLayout />
      </MemoryRouter>,
    );

    expect(container.querySelector('#fpNewPassword').disabled).toBe(true);
    expect(container.querySelector('#fpConfirmPassword').disabled).toBe(true);
    expect(container.querySelector('#fpSubmitButton').disabled).toBe(true);
    expect(container.querySelectorAll('#forgotPasswordForm button[aria-pressed]')).toHaveLength(2);
    expect(container.querySelectorAll('#changePasswordForm button[aria-pressed]')).toHaveLength(3);
  });
});
