import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

function Watchlist() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editNote, setEditNote] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { token } = useAuth()

  const fetchWatchlist = async (pageNum = 1) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://trendscout-production-6bf2.up.railway.app/api/watchlist?page=${pageNum}&per_page=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setTotalPages(data.pages)
        setPage(pageNum)
      } else {
        setError(data.error || 'Failed to load watchlist')
      }
    } catch (err) {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWatchlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item from your watchlist?')) return

    try {
      const response = await fetch(`https://trendscout-production-6bf2.up.railway.app/api/watchlist/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
      }
    } catch (err) {
      alert('Could not delete item')
    }
  }

  const handleEditSave = async (id) => {
    try {
      const response = await fetch(`https://trendscout-production-6bf2.up.railway.app/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notes: editNote })
      })

      const data = await response.json()

      if (response.ok) {
        setProducts(prev =>
          prev.map(p => p.id === id ? { ...p, notes: data.product.notes } : p)
        )
        setEditingId(null)
        setEditNote('')
      }
    } catch (err) {
      alert('Could not update notes')
    }
  }

  if (loading) return <div className="loading">Loading your watchlist...</div>
  if (error) return <div className="error-banner">{error}</div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Watchlist</h1>
        <p>Products you are tracking for research</p>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          Your watchlist is empty. Search for products to add them here.
        </div>
      ) : (
        <>
          <div className="watchlist-grid">
            {products.map((product) => (
              <div key={product.id} className="watchlist-card">
                {product.image_url && (
                  <img src={product.image_url} alt={product.title} className="product-image" />
                )}
                <div className="product-info">
                  <h3 className="product-title">{product.title}</h3>
                  <div className="product-meta">
                    {product.price && <span className="product-price">${product.price}</span>}
                    {product.watch_count > 0 && (
                      <span className="product-watches">👁 {product.watch_count} watching</span>
                    )}
                  </div>

                  {editingId === product.id ? (
                    <div className="edit-notes">
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Add your research notes..."
                        rows={3}
                      />
                      <div className="edit-actions">
                        <button onClick={() => handleEditSave(product.id)} className="btn-primary">
                          Save Notes
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="notes-display">
                      <p className="notes-text">
                        {product.notes || 'No notes yet'}
                      </p>
                      <div className="product-actions">
                        <button
                          onClick={() => {
                            setEditingId(product.id)
                            setEditNote(product.notes || '')
                          }}
                          className="btn-secondary"
                        >
                          Edit Notes
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="btn-delete"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => fetchWatchlist(page - 1)}
                disabled={page === 1}
                className="btn-secondary"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                onClick={() => fetchWatchlist(page + 1)}
                disabled={page === totalPages}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Watchlist