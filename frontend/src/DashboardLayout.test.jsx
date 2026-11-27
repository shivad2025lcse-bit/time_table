// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardLayout from './DashboardLayout.jsx';

function renderRoute(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DashboardLayout />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  window.__seceLegacyScriptsLoaded = false;
  vi.unstubAllGlobals();
});

describe('DashboardLayout login and admin navigation', () => {
  it('renders login choices for all three account roles', () => {
    const { container } = renderRoute('/login');
    const roleHeadings = [...container.querySelectorAll('.login-role-card h3')]
      .map((heading) => heading.textContent);

    expect(roleHeadings).toEqual([
      'Student Login',
      'Faculty Login',
      'Admin Login',
    ]);
  });

  it('opens the admin login form and rejects missing credentials without a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { container } = renderRoute('/login');
    const openLoginForm = vi.spyOn(window, 'openLoginForm');
    fireEvent.click(container.querySelector('.login-role-card.admin'));

    expect(openLoginForm).toHaveBeenCalledWith('ADMIN');
    expect(container.querySelector('#loginTitle').innerText).toBe('Admin Login');
    expect(container.querySelector('#selectedLoginRole').value).toBe('ADMIN');

    await act(async () => {
      await window.handleRoleLogin({ preventDefault: vi.fn() });
    });

    expect(container.querySelector('#loginErrorBanner').textContent)
      .toBe('Please enter your username and password.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders every admin sidebar module action', () => {
    const { container } = renderRoute('/admin');
    const labels = [...container.querySelectorAll('aside nav .sidebar-nav-link')]
      .map((button) => button.textContent.trim());

    expect(labels.slice(0, 10)).toEqual([
      'Add Students',
      'Announcements',
      'Manage Class Advisors',
      'Manage Roster',
      'Notifications',
      'View Faculty Details',
      'View Faculty Timetable',
      'Upload & Assign Class TT',
      'View Student Timetable',
      'Email Alerts (OTP)',
    ]);
  });
});
