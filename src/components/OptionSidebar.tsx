import Api, { Integration, ModelOptions, Preset } from '@/lib/frontend/api'
import styles from './OptionSidebar.module.scss'
import { SessionOptions } from '@/lib/frontend/api'
import Select from '@/components/form/Select'
import { useState } from 'react'
import { reportError } from '@/lib/error'

export interface SessionOptionsFields {
  integration?: number
  model?: string
  systemPrompt: string
  temperature: number
  thinkingEnabled: boolean
  renderMarkdown: boolean
}

interface Props {
  options: SessionOptionsFields
  setOptions: (options: SessionOptionsFields) => void
}

export function validateOptions(
  options: SessionOptionsFields
): SessionOptions | null {
  if (!options.integration || !options.model) return null
  return {
    modelOptions: {
      integration: options.integration,
      model: options.model,
      systemPrompt: options.systemPrompt,
      temperature: options.temperature,
      thinkingEnabled: options.thinkingEnabled,
    },
    renderMarkdown: options.renderMarkdown,
  }
}

function fromPreset(options: SessionOptions): SessionOptionsFields {
  return {
    integration: options.modelOptions.integration,
    model: options.modelOptions.model,
    systemPrompt: options.modelOptions.systemPrompt,
    temperature: options.modelOptions.temperature,
    thinkingEnabled: options.modelOptions.thinkingEnabled,
    renderMarkdown: options.renderMarkdown,
  }
}

export default function OptionSidebar({ options, setOptions }: Props) {
  const api = new Api()
  const integrations: Integration[] | null = api.useIntegrations()
  const models = api.useAvailableModels(options.integration || null)
  const presets: Preset[] | null = api.usePresets()

  const [selectedPreset, setSelectedPreset] = useState<number | undefined>(
    undefined
  )
  const [presetName, setPresetName] = useState('')
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)

  function handleOptionChange(field: keyof SessionOptionsFields, value: any) {
    options = {
      ...options,
      [field]: value,
    }
    setOptions(options)
  }

  function handleLoadPreset(presetId: number | undefined) {
    if (presetId === undefined) return

    const preset = presets?.find(p => p.id === presetId)
    if (preset) {
      setOptions(fromPreset(preset.options))
      setSelectedPreset(presetId)
    }
  }

  async function handleSavePreset() {
    if (!presetName.trim()) {
      reportError('Please enter a preset name')
      return
    }

    const validated = validateOptions(options)
    if (!validated) {
      reportError('Please select an integration and model')
      return
    }

    try {
      setIsCreatingPreset(true)
      await api.createPreset({
        name: presetName,
        options: validated,
      })
      setPresetName('')
    } catch (error) {
      reportError(error)
    } finally {
      setIsCreatingPreset(false)
    }
  }

  async function handleDeletePreset(presetId: number) {
    try {
      await api.deletePreset(presetId)
      if (selectedPreset === presetId) {
        setSelectedPreset(undefined)
      }
    } catch (error) {
      reportError(error)
    }
  }

  return (
    <aside className={styles.sidebar}>
      {/* Presets section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Presets</h3>

        {/* Load preset */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='loadPreset'>
            Load preset
          </label>
          <Select
            id='loadPreset'
            placeholder='Select a preset...'
            selected={selectedPreset}
            onChange={handleLoadPreset}
            options={presets?.map(preset => ({
              key: preset.id,
              value: preset.name,
            }))}
          />
          {presets && presets.length === 0 && (
            <span className={styles.loading}>No presets available</span>
          )}
        </div>

        {/* Save new preset */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='presetName'>
            Save current options
          </label>
          <div className={styles.presetSaveContainer}>
            <input
              id='presetName'
              type='text'
              className='input'
              value={presetName}
              onChange={e => setPresetName(e.target.value)}
              placeholder='Enter preset name...'
              disabled={isCreatingPreset}
            />
            <button
              type='button'
              className='button button-primary'
              onClick={handleSavePreset}
              disabled={!presetName.trim() || isCreatingPreset}
            >
              {isCreatingPreset ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Delete preset */}
        {selectedPreset && (
          <div className={styles.field}>
            <button
              type='button'
              className='button button-destructive'
              onClick={() => handleDeletePreset(selectedPreset)}
            >
              Delete Selected Preset
            </button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Model</h3>

        {/* Integration selection */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='integration'>
            Integration
          </label>
          <Select
            id='integration'
            placeholder='Select integration...'
            selected={options.integration}
            onChange={integrationId => {
              handleOptionChange('integration', integrationId)
              // Reset model when integration changes
              if (integrationId !== options.integration) {
                handleOptionChange('model', undefined)
              }
            }}
            options={integrations?.map(integration => ({
              key: integration.id,
              value: integration.name,
            }))}
          />
        </div>

        {/* Model selection */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='model'>
            Model
          </label>
          <Select
            id='model'
            selected={options.model}
            onChange={model => handleOptionChange('model', model)}
            disabled={!options.integration || !models}
            options={models?.map(model => ({
              key: model.name,
              value: model.displayName,
            }))}
          />
          {options.integration && !models && (
            <span className={styles.loading}>Loading models...</span>
          )}
        </div>

        <hr />

        {/* Temperature */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='temperature'>
            Temperature: {options.temperature.toFixed(2)}
          </label>
          <input
            id='temperature'
            type='range'
            className='slider'
            min='0'
            max='2'
            step='0.05'
            value={options.temperature}
            onChange={e =>
              handleOptionChange('temperature', parseFloat(e.target.value))
            }
          />
          <div className={styles.fieldDescription}>
            Higher temperature responses are more varied.
          </div>
        </div>

        {/* Thinking enabled */}
        <div className={styles.field}>
          <label className='checkboxLabel'>
            <input
              type='checkbox'
              className='checkbox'
              checked={options.thinkingEnabled}
              onChange={e =>
                handleOptionChange('thinkingEnabled', e.target.checked)
              }
            />
            <span className='checkboxText'>Enable thinking</span>
          </label>
        </div>

        <hr />

        {/* System prompt */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='systemPrompt'>
            System prompt
          </label>
          <textarea
            id='systemPrompt'
            className='textarea'
            value={options.systemPrompt}
            onChange={e => handleOptionChange('systemPrompt', e.target.value)}
            placeholder='Enter prompt (optional)...'
            rows={6}
          />
          <p className={styles.fieldDescription}>
            Provide specific instructions to the model on how to respond.
          </p>
        </div>
      </div>

      {/* Markdown rendering */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Appearance</h3>
        <div className={styles.field}>
          <label className='checkboxLabel'>
            <input
              type='checkbox'
              className='checkbox'
              checked={options.renderMarkdown}
              onChange={e =>
                handleOptionChange('renderMarkdown', e.target.checked)
              }
            />
            <span className='checkboxText'>Render Markdown</span>
          </label>
        </div>
      </div>
    </aside>
  )
}
