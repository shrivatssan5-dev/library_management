import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type DashboardStats } from '../api/client';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!stats) {
    return <div className="loading-inline">Loading dashboard...</div>;
  }

  const cards = [
    { label: 'Total Books', value: stats.totalBooks, link: '/books', color: 'blue' },
    { label: 'Members', value: stats.totalMembers, link: '/members', color: 'green' },
    { label: 'Active Loans', value: stats.activeBorrowings, link: '/borrowings', color: 'purple' },
    { label: 'Overdue', value: stats.overdueBorrowings, link: '/borrowings', color: 'red' },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your library at a glance</p>
        </div>
      </header>

      <div className="stat-grid">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className={`stat-card stat-${card.color}`}>
            <span className="stat-label">{card.label}</span>
            <span className="stat-value">{card.value}</span>
          </Link>
        ))}
      </div>

      <section className="panel">
        <h3>Upcoming & Overdue Returns</h3>
        {stats.upcomingDue.length === 0 ? (
          <p className="empty-state">No active borrowings right now.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.upcomingDue.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.member_name}</td>
                  <td>{new Date(item.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${item.status}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
