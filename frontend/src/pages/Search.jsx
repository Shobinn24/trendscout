import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState({}) // tracks which items are saved

  const { token } = useAuth()

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])

    try {
      const response = await fetch(
        `https://trendscout-production-6bf2.up.railway.app/api/search?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Search failed')
        return
      }

      setResults(data.results)

    } catch (err) {
      setError('Could not connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (item) => {
    try {
      const response = await fetch('https://trendscout-production-6bf2.up.railway.app/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ebay_item_id: item.ebay_item_id,
          title: item.title,
          price: item.price,
          watch_count: item.watch_count,
          image_url: item.image_url
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Mark this item as saved so button updates
        setSaved(prev => ({ ...prev, [item.ebay_item_id]: true }))
      } else {
        alert(data.error || 'Could not save item')
      }

    } catch (err) {
      alert('Could not connect to server')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Search eBay Listings</h1>
        <p>Find trending products and save them to your watchlist</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Search for any product..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {results.length === 0 && !loading && !error && query && (
        <div className="empty-state">No results found for "{query}"</div>
      )}

      <div className="results-grid">
        {results.map((item) => (
          <div key={item.ebay_item_id} className="product-card">
            {item.image_url && (
              <img src={item.image_url} alt={item.title} className="product-image" />
            )}
            <div className="product-info">
              <h3 className="product-title">{item.title}</h3>
              <div className="product-meta">
                {item.price && (
                  <span className="product-price">${item.price}</span>
                )}
                {item.watch_count > 0 && (
                  <span className="product-watches">👁 {item.watch_count} watching</span>
                )}
                {item.condition && (
                  <span className="product-condition">{item.condition}</span>
                )}
              </div>
              <div className="product-actions">
                <a
                  href={item.item_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  View on eBay
                </a>
                <button
                  onClick={() => handleSave(item)}
                  className="btn-primary"
                  disabled={saved[item.ebay_item_id]}
                >
                  {saved[item.ebay_item_id] ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Search