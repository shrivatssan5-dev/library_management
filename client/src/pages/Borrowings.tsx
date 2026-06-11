import { useEffect, useState, type FormEvent } from 'react';
import { api, type Book, type Borrowing, type Member } from '../api/client';

export function Borrowings() {
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ book_id: '', member_id: '', due_date: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [borrowingData, bookData, memberData] = await Promise.all([
        api.getBorrowings(statusFilter),
        api.getBooks(),
        api.getMembers(),
      ]);
      setBorrowings(borrowingData);
      setBooks(bookData.filter((b) => b.copies_available > 0));
      setMembers(memberData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function handleIssue(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await api.issueBook({
        book_id: Number(form.book_id),
        member_id: Number(form.member_id),
        due_date: form.due_date,
      });
      setShowForm(false);
      setForm({ book_id: '', member_id: '', due_date: '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to issue book');
    }
  }

  async function handleReturn(id: number) {
    try {
      await api.returnBook(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return book');
    }
  }

  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Borrowings</h2>
          <p>Issue and return books for members</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setShowForm(true);
            setForm({ book_id: '', member_id: '', due_date: defaultDueDate() });
          }}
        >
          + Issue Book
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="returned">Returned</option>
        </select>
      </div>

      {showForm && (
        <form className="panel form-panel" onSubmit={handleIssue}>
          <h3>Issue Book to Member</h3>
          <div className="form-grid">
            <label>
              Book *
              <select
                value={form.book_id}
                onChange={(e) => setForm({ ...form, book_id: e.target.value })}
                required
              >
                <option value="">Select a book</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} — {book.copies_available} available
                  </option>
                ))}
              </select>
            </label>
            <label>
              Member *
              <select
                value={form.member_id}
                onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                required
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.membership_number})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due Date *
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Issue Book
            </button>
          </div>
        </form>
      )}

      <section className="panel">
        {loading ? (
          <p className="loading-inline">Loading borrowings...</p>
        ) : borrowings.length === 0 ? (
          <p className="empty-state">No borrowing records found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Borrowed</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowings.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.book_title}</strong>
                    <br />
                    <small>{row.book_author}</small>
                  </td>
                  <td>
                    {row.member_name}
                    <br />
                    <small>{row.membership_number}</small>
                  </td>
                  <td>{new Date(row.borrowed_at).toLocaleDateString()}</td>
                  <td>{new Date(row.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${row.status}`}>{row.status}</span>
                  </td>
                  <td>
                    {row.status !== 'returned' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => handleReturn(row.id)}
                      >
                        Mark Returned
                      </button>
                    )}
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
