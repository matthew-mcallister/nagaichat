'use client'

import { useState, useEffect } from 'react'
import { Integration, CreateIntegrationRequest } from '@/lib/integration'
import styles from './integrations.module.scss'

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateIntegrationRequest>({
    name: '',
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
  })

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/integrations')
      if (!response.ok) {
        throw new Error('Failed to fetch integrations')
      }
      const data = await response.json()
      setIntegrations(data)
    } catch (err) {
      reportError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update existing integration
        const response = await fetch(`/api/integrations/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to update integration')
        }
      } else {
        // Create new integration
        const response = await fetch('/api/integrations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          throw new Error('Failed to create integration')
        }
      }

      // Reset form and refresh list
      setFormData({ name: '', provider: 'openai', apiKey: '', baseUrl: '' })
      setIsCreating(false)
      setEditingId(null)
      fetchIntegrations()
    } catch (err) {
      reportError(err)
    }
  }

  const handleEdit = (integration: Integration) => {
    setFormData({
      name: integration.name,
      provider: integration.provider,
      apiKey: integration.apiKey,
      baseUrl: integration.baseUrl || '',
    })
    setEditingId(integration.id!)
    setIsCreating(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete integration')
      }

      fetchIntegrations()
    } catch (err) {
      reportError(err)
    }
  }

  const handleCancel = () => {
    setFormData({ name: '', provider: 'openai', apiKey: '', baseUrl: '' })
    setIsCreating(false)
    setEditingId(null)
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>API Integrations</h1>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className={styles.createButton}
          >
            Add Integration
          </button>
        )}
      </div>

      {isCreating && (
        <div className={styles.formContainer}>
          <h2>{editingId ? 'Edit Integration' : 'Create New Integration'}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor='name'>Name</label>
              <input
                type='text'
                id='name'
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder='Enter integration name'
              />
            </div>

            <div className={styles.field}>
              <label htmlFor='provider'>Provider</label>
              <select
                id='provider'
                value={formData.provider}
                onChange={e =>
                  setFormData({
                    ...formData,
                    provider: e.target.value as 'openai' | 'gemini',
                  })
                }
              >
                <option value='openai'>OpenAI</option>
                <option value='gemini'>Gemini</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor='apiKey'>API Key</label>
              <input
                type='password'
                id='apiKey'
                value={formData.apiKey}
                onChange={e =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                required
                placeholder='Enter API key'
              />
            </div>

            <div className={styles.field}>
              <label htmlFor='baseUrl'>Base URL (Optional)</label>
              <input
                type='url'
                id='baseUrl'
                value={formData.baseUrl}
                onChange={e =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                placeholder='Enter base URL (optional)'
              />
            </div>

            <div className={styles.buttons}>
              <button type='submit' className={styles.submitButton}>
                {editingId ? 'Update' : 'Create'} Integration
              </button>
              <button
                type='button'
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.list}>
        {integrations.length === 0 ? (
          <div className={styles.empty}>
            No integrations found. Create your first integration to get started.
          </div>
        ) : (
          integrations.map(integration => (
            <div key={integration.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{integration.name}</h3>
                <span className={styles.provider}>{integration.provider}</span>
              </div>
              <div className={styles.cardBody}>
                <p>
                  <strong>API Key:</strong> {integration.apiKey.substring(0, 8)}
                  ...
                </p>
                {integration.baseUrl && (
                  <p>
                    <strong>Base URL:</strong> {integration.baseUrl}
                  </p>
                )}
                <p className={styles.dates}>
                  <small>
                    Created:{' '}
                    {new Date(integration.createdAt).toLocaleDateString()}
                    {integration.updatedAt !== integration.createdAt && (
                      <span>
                        {' '}
                        • Updated:{' '}
                        {new Date(integration.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </small>
                </p>
              </div>
              <div className={styles.cardActions}>
                <button
                  onClick={() => handleEdit(integration)}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(integration.id!)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
