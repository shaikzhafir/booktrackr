import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth'

// Book interface matching the backend model
interface Book {
  id: number
  user_id: number
  title: string
  author: string
 progress: number
    isbn: string
    description: string
    image_url: string
}

// Form data for creating a new book
interface BookFormData {
  title: string
  isbn: string
  description: string
  author: string
  image_url: string
    progress: number
}

export const Route = createFileRoute('/_auth/books')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<BookFormData>({
    title: '',
    author: '',
    isbn: '',
    description: '',
    image_url: '',
    progress : 0,
  })
  const [formVisible, setFormVisible] = useState(false)

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks()
  }, [])

  // Function to fetch books from API
  const fetchBooks = async () => {
    console.log('fetchBooks called');
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching books for user:', user);
      
      
      const response = await fetch('http://localhost:8080/books', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user}` // Using user ID as token
        }
      })
      

      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error fetching books:', errorData);
        
        throw new Error(errorData.error || 'Failed to fetch books')
      }

      const res = await response.json()
      console.log('Fetched books:', res);
      
      setBooks(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching books')
      console.error('Error fetching books:', err)
    } finally {
      setLoading(false)
    }
  }

  // Function to add a new book
  const addBook = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)
      
      const response = await fetch('http://localhost:8080/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user}` // Using user ID as token
        },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
            description: formData.description,
            image_url: formData.image_url
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add book')
      }

      // API returns updated book list after adding
      const data = await response.json()
      setBooks(data)
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        description: '',
        image_url: '',
        progress: 0,
      })
      setFormVisible(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding book')
      console.error('Error adding book:', err)
    }
  }

  // Update form data
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'total_pages' ? parseInt(value) || 0 : value
    }))
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Books</h1>
        <button 
          onClick={() => setFormVisible(!formVisible)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {formVisible ? 'Cancel' : 'Add Book'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}

      {formVisible && (
        <div className="mb-6 bg-gray-100 p-4 rounded">
          <h2 className="text-xl font-semibold mb-4">Add New Book</h2>
          <form onSubmit={addBook}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Author</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">ISBN</label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Book
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : books.length == 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p className="text-gray-500">You haven't added any books yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map(book => (
            <div key={book.id} className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">{book.title}</h3>
              <p className="text-gray-600 mb-1">By {book.author}</p>
              <div className="mt-3 border-t pt-3">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Progress:s</span>
                  <span>{book.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(book.progress)}%` }}>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}