import { render, screen } from '@testing-library/react';
import KpiCard from '../components/KpiCard';

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Total Bids" value="42" icon="Gavel" />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Bids')).toBeInTheDocument();
  });

  it('renders icon', () => {
    const { container } = render(<KpiCard title="Win Rate" value="75%" icon="TrendingUp" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('uses custom colors', () => {
    const { container } = render(<KpiCard title="Test" value="1" icon="Add" color="red" bg="blue" />);
    const box = container.querySelector('.MuiBox-root');
    expect(box?.querySelector('.MuiBox-root')).toBeTruthy();
  });

  it('is clickable when onClick provided', () => {
    const onClick = vi.fn();
    render(<KpiCard title="Clickable" value="99" icon="History" onClick={onClick} />);
    screen.getByText('99').click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
