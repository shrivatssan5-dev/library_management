import { useEffect, useState, type FormEvent } from 'react';
import { api, type Book } from '../api/client';

const emptyForm = {
  title: '',
  author: '',
  isbn: '',
  genre: '',
  copies_total: 1,
};

export function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadBooks() {
    setLoading(true);
    try {
      const data = await api.getBooks(search);
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadBooks, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function openEdit(book: Book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      genre: book.genre || '',
      copies_total: book.copies_total,
    });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    try {
      if (editingId) {
        await api.updateBook(editingId, form);
      } else {
        await api.createBook(form);
      }
      setShowForm(false);
      setForm(emptyForm);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this book?')) return;
    try {
      await api.deleteBook(id);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Books</h2>
          <p>Manage catalog and inventory</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          + Add Book
        </button>
      </header>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by title, author, ISBN, or genre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {showForm && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Book' : 'Add New Book'}</h3>
          <div className="form-grid">
            <label>
              Title *
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </label>
            <label>
              Author *
              <input
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
            </label>
            <label>
              ISBN
              <input
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              />
            </label>
            <label>
              Genre
              <input
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
            </label>
            <label>
              Total Copies
              <input
                type="number"
                min={editingId ? 0 : 1}
                value={form.copies_total}
                onChange={(e) =>
                  setForm({ ...form, copies_total: Number(e.target.value) })
                }
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
          <p className="loading-inline">Loading books...</p>
        ) : books.length === 0 ? (
          <p className="empty-state">No books found. Add your first book to get started.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>ISBN</th>
                <th>Genre</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {books.map((book) => (
                <tr key={book.id}>
                  <td>{book.title}</td>
                  <td>{book.author}</td>
                  <td>{book.isbn || '—'}</td>
                  <td>{book.genre || '—'}</td>
                  <td>
                    {book.copies_available} / {book.copies_total}
                  </td>
                  <td className="actions-cell">
                    <button type="button" className="btn btn-sm" onClick={() => openEdit(book)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(book.id)}
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
