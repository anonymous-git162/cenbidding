import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useThemeMode } from '../contexts/ThemeContext';

function TestConsumer() {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <button data-testid="toggle" onClick={toggleTheme}>Toggle</button>
    </div>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to light mode', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('light');
  });

  it('should toggle to dark mode', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await user.click(screen.getByTestId('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });

  it('should persist mode in localStorage', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await user.click(screen.getByTestId('toggle'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should restore mode from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
  });
});
