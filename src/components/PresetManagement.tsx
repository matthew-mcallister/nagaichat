import Api, { Preset } from '@/lib/frontend/api'
import { useState } from 'react'
import { FolderOpenIcon, TrashIcon } from '@heroicons/react/24/outline'
import { reportError } from '@/lib/error'
import styles from './PresetManagement.module.scss'

interface PresetListProps {
  selected?: Preset
  presets: Preset[]
  onLoad: (preset: Preset) => void | Promise<void>
  onDelete: (preset: Preset) => void | Promise<void>
  disabled?: boolean
}

/**
 * A list/table of saved presets.
 */
function PresetList(props: PresetListProps) {
  return (
    <div
      className={`${styles.presetList} ${
        props.disabled ? styles.disabled : ''
      }`}
    >
      {props.presets.map(preset => (
        <div
          key={preset.id}
          className={`${styles.presetItem} ${
            props.selected?.id === preset.id ? styles.selected : ''
          }`}
        >
          <span className={styles.presetName} title={preset.name}>
            {preset.name}
          </span>
          <div className={styles.presetActions}>
            <button
              className={styles.actionButton}
              onClick={() => props.onLoad(preset)}
              title='Load preset'
              aria-label={`Load preset ${preset.name}`}
              disabled={props.disabled}
            >
              <FolderOpenIcon className={styles.actionIcon} />
            </button>
            <button
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={() => props.onDelete(preset)}
              title='Delete preset'
              aria-label={`Delete preset ${preset.name}`}
              disabled={props.disabled}
            >
              <TrashIcon className={styles.actionIcon} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

interface CreatePresetProps {
  onCreate: (name: string) => void | Promise<void>
  onCancel: () => void | Promise<void>
  disabled?: boolean
}

/**
 * A small component to save a new preset.
 */
function CreatePreset(props: CreatePresetProps) {
  const [name, setName] = useState<string>('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      props.onCreate(name.trim())
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.createPreset}>
      <input
        type='text'
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder='Enter preset name'
        className={styles.presetNameInput}
        autoFocus
        disabled={props.disabled}
      />
      <div className={styles.createActions}>
        <button
          type='submit'
          className={`${styles.button} ${styles.primary}`}
          disabled={props.disabled || !name.trim()}
        >
          Save
        </button>
        <button
          type='button'
          className={styles.button}
          onClick={() => props.onCancel()}
          disabled={props.disabled}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

interface PresetManagementProps {
  /** Previously loaded preset. */
  preset?: Preset
  /** Applies options from the given preset. */
  onLoad: (preset: Preset) => Promise<void>
  /** Saves current options to the previously chosen preset. */
  onSave: () => Promise<void>
  /** Saves current options to a new preset with the given name. */
  onCreate: (name: string) => Promise<void>
  /** Deletes the given preset. */
  onDelete: (preset: Preset) => Promise<void>
  disabled?: boolean
}

/**
 * Preset management portion of the options sidebar.
 */
export function PresetManagement(props: PresetManagementProps) {
  const api = new Api()
  const presets = api.usePresets()

  const [showCreateNew, setShowCreateNew] = useState<boolean>(false)
  const [processing, setProcessing] = useState<boolean>(false)

  if (!presets) {
    return <div className={styles.loading}>Loading presets...</div>
  }

  const handleLoad = async (preset: Preset) => {
    try {
      setProcessing(true)
      await props.onLoad(preset)
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
    }
  }

  const handleDelete = async (preset: Preset) => {
    try {
      setProcessing(true)
      await props.onDelete(preset)
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
    }
  }

  const handleCreate = async (name: string) => {
    try {
      setProcessing(true)
      await props.onCreate(name)
      setShowCreateNew(false)
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
    }
  }

  const handleCancel = () => {
    setShowCreateNew(false)
  }

  const handleSave = async () => {
    try {
      setProcessing(true)
      await props.onSave()
    } catch (error) {
      reportError(error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className={styles.presetManagement}>
      <PresetList
        selected={props.preset}
        presets={presets}
        onLoad={handleLoad}
        onDelete={handleDelete}
        disabled={processing}
      />

      {!showCreateNew && (
        <button
          className={`${styles.button} ${styles.createNewButton}`}
          onClick={() => setShowCreateNew(true)}
          disabled={processing}
        >
          Create new +
        </button>
      )}

      {showCreateNew && (
        <CreatePreset
          onCreate={handleCreate}
          onCancel={handleCancel}
          disabled={processing}
        />
      )}

      {props.preset && !showCreateNew && (
        <div className={styles.selectedPreset}>
          <div className={styles.selectedPresetName}>{props.preset.name}</div>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleSave}
            disabled={processing}
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
