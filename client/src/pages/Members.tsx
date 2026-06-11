import { useEffect, useState, type FormEvent } from 'react';
import { api, type Member } from '../api/client';

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  membership_number: '',
};

export function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await api.getMembers(search);
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadMembers, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function openEdit(member: Member) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      membership_number: member.membership_number,
    });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await api.updateMember(editingId, form);
      } else {
        await api.createMember(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this member?')) return;
    try {
      await api.deleteMember(id);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Members</h2>
          <p>Manage library members and membership IDs</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Member
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name, email, or membership number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Member' : 'Add New Member'}</h3>
          <div className="form-grid">
            <label>
              Full Name *
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label>
              Email *
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Membership Number *
              <input
                value={form.membership_number}
                onChange={(e) => setForm({ ...form, membership_number: e.target.value })}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      )}

      <section className="panel">
        {loading ? (
          <p className="loading-inline">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="empty-state">No members found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Membership #</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.phone || '—'}</td>
                  <td>{member.membership_number}</td>
                  <td className="actions-cell">
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(member)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(member.id)}
                    >
                      Delete
                    </button>
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
