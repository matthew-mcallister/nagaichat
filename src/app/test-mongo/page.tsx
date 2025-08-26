'use client'

import { useState } from 'react'
import styles from './test-mongo.module.css'

interface MongoResponse {
  success: boolean
  message: string
  documents?: any[]
  insertedId?: string
  error?: string
  [key: string]: any
}

export default function TestMongo() {
  const [response, setResponse] = useState<MongoResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const testConnection = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-mongo')
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        message: 'Failed to connect to API',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const insertDocument = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/test-mongo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      setResponse(data)

      // Clear form on success
      if (data.success) {
        setFormData({ name: '', email: '', message: '' })
      }
    } catch (error) {
      setResponse({
        success: false,
        message: 'Failed to insert document',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteDocuments = async () => {
    if (!formData.email) {
      alert('Please enter an email to delete documents')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/test-mongo?email=${encodeURIComponent(formData.email)}`,
        {
          method: 'DELETE',
        }
      )
      const data = await res.json()
      setResponse(data)
    } catch (error) {
      setResponse({
        success: false,
        message: 'Failed to delete documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h1>MongoDB Test Page</h1>
      <p>Test your MongoDB connection and perform basic operations.</p>

      <div className={styles.section}>
        <h2>Connection Test</h2>
        <button
          onClick={testConnection}
          disabled={loading}
          className={styles.button}
        >
          {loading ? 'Testing...' : 'Test MongoDB Connection'}
        </button>
      </div>

      <div className={styles.section}>
        <h2>Insert Document</h2>
        <div className={styles.form}>
          <input
            type='text'
            placeholder='Name'
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className={styles.input}
          />
          <input
            type='email'
            placeholder='Email'
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className={styles.input}
          />
          <textarea
            placeholder='Message'
            value={formData.message}
            onChange={e =>
              setFormData({ ...formData, message: e.target.value })
            }
            className={styles.textarea}
          />
          <button
            onClick={insertDocument}
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Inserting...' : 'Insert Document'}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Delete Documents</h2>
        <p>Delete all documents with the email specified above.</p>
        <button
          onClick={deleteDocuments}
          disabled={loading || !formData.email}
          className={styles.button}
        >
          {loading ? 'Deleting...' : 'Delete Documents by Email'}
        </button>
      </div>

      {response && (
        <div className={styles.section}>
          <h2>Response</h2>
          <div
            className={`${styles.response} ${
              response.success ? styles.success : styles.error
            }`}
          >
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
