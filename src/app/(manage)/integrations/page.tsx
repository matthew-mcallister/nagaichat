'use client'

import { useState, useEffect } from 'react'
import { Integration, CreateIntegrationRequest } from '@/lib/frontend/api'
import styles from './integrations.module.scss'
import Api from '@/lib/frontend/api'

export default function IntegrationsPage() {
  const api = new Api()

  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateIntegrationRequest>({
    name: '',
    interface: 'openai',
    apiKey: '',
    baseUrl: '',
  })

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      setIntegrations(await api.listIntegrations())
    } catch (err) {
      reportError(err)
    } finally {
      setLoading(false)
    }
  }

  // TODO: useSWR
  useEffect(() => {
    fetchIntegrations()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        await api.updateIntegration(editingId, formData)
      } else {
        await api.createIntegration(formData)
      }

      // Reset form and refresh list
      setFormData({ name: '', interface: 'openai', apiKey: '', baseUrl: '' })
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
      interface: integration.interface,
      apiKey: '',
      baseUrl: integration.baseUrl || '',
    })
    setEditingId(integration.id!)
    setIsCreating(true)
  }

  const handleDelete = async (id: number) => {
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
    setFormData({ name: '', interface: 'openai', apiKey: '', baseUrl: '' })
    setIsCreating(false)
    setEditingId(null)
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>API integrations</h1>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className='button primary'
          >
            Add integration
          </button>
        )}
      </div>

      {isCreating && (
        <div className={styles.formContainer}>
          <h2>{editingId ? 'Edit integration' : 'Create new integration'}</h2>
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
              <label htmlFor='interface'>Interface</label>
              <select
                id='interface'
                value={formData.interface}
                onChange={e =>
                  setFormData({
                    ...formData,
                    interface: e.target.value as 'openai' | 'gemini',
                  })
                }
              >
                <option value='openai'>OpenAI</option>
                <option value='gemini'>Gemini</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor='apiKey'>API key</label>
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
              <label htmlFor='baseUrl'>Base URL (optional)</label>
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
              <button type='submit' className='button primary'>
                {editingId ? 'Update' : 'Create'}
              </button>
              <button type='button' onClick={handleCancel} className='button'>
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
                <span className={styles.interface}>
                  {integration.interface}
                </span>
              </div>
              <div className={styles.cardBody}>
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
                  className='button primary'
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(integration.id!)}
                  className='button destructive'
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
