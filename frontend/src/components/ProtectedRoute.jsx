import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Wraps any route that requires login
// Redirects to /login if no token found
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) return <div className="loading">Loading...</div>
  if (!token) return <Navigate to="/login" replace />

  return children
}

export default ProtectedRoute