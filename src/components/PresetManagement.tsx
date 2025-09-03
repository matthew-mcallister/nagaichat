import { SessionOptionsFields } from '@/components/OptionSidebar'
import { reportError, ValidationError } from '@/lib/error'
import Api, { fromPreset, Preset, validateOptions } from '@/lib/frontend/api'
import { FolderOpenIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
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
      {props.presets.length == 0 ? (
        <em className='description'>No saved presets</em>
      ) : null}
      {props.presets.map(preset => (
        <div
          key={preset.id}
          className={`${styles.presetItem} ${
            props.selected?.id === preset.id ? styles.selected : ''
          }`}
        >
          <span className={styles.presetName}>{preset.name}</span>
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

interface PresetUiProps {
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
  /** Disables saving/creating presets. */
  saveDisabled?: boolean
  /** Globally disables controls. */
  processing: boolean
  /** Globally disables controls. */
  setProcessing: (processing: boolean) => void
}

export function PresetUi(props: PresetUiProps) {
  const api = new Api()
  const presets = api.usePresets()

  const [showCreateNew, setShowCreateNew] = useState<boolean>(false)
  const { processing, setProcessing } = props

  const disabled = processing

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
        disabled={disabled}
      />

      {!showCreateNew && (
        <button
          className={`${styles.button} ${styles.createNewButton}`}
          onClick={() => setShowCreateNew(true)}
          disabled={disabled || props.saveDisabled}
        >
          Create new +
        </button>
      )}

      {showCreateNew && (
        <CreatePreset
          onCreate={handleCreate}
          onCancel={handleCancel}
          disabled={disabled || props.saveDisabled}
        />
      )}

      {props.preset && !showCreateNew && (
        <button
          className={`${styles.button} ${styles.primary}`}
          onClick={handleSave}
          disabled={disabled || props.saveDisabled}
        >
          Save "{props.preset.name}"
        </button>
      )}
    </div>
  )
}

export interface PresetManagementProps {
  /** Previously loaded preset. */
  preset?: Preset
  /** Sets or clears the current preset. */
  setPreset: (preset?: Preset) => void | Promise<void>
  /** Current session options. */
  options: SessionOptionsFields
  /** Updates the current session options. */
  setOptions: (options: SessionOptionsFields) => void | Promise<void>
}

/**
 * Preset management portion of the options sidebar.
 */
export default function PresetManagement({
  preset,
  setPreset,
  options: rawOptions,
  setOptions,
}: PresetManagementProps) {
  const api = new Api()
  const options = validateOptions(rawOptions)
  const [processing, setProcessing] = useState<boolean>(false)

  async function onLoad(preset: Preset): Promise<void> {
    await setOptions(fromPreset(preset.options))
    setPreset(preset)
  }

  async function onSave(): Promise<void> {
    if (!preset || !options) {
      throw new ValidationError("Can't save options")
    }
    await api.updatePreset(preset.id, { options })
  }

  async function onCreate(name: string): Promise<void> {
    if (!options) {
      throw new ValidationError("Can't create preset")
    }
    const preset = await api.createPreset({ name, options })
    setPreset(preset)
  }

  async function onDelete(preset: Preset): Promise<void> {
    await api.deletePreset(preset.id)
  }

  return (
    <PresetUi
      preset={preset}
      onLoad={onLoad}
      onSave={onSave}
      onCreate={onCreate}
      onDelete={onDelete}
      processing={processing}
      setProcessing={setProcessing}
      saveDisabled={!options}
    />
  )
}
