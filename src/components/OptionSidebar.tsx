import Select from '@/components/form/Select'
import PresetManagement from '@/components/PresetManagement'
import Api, {
  Integration,
  Preset,
  SessionOptionsFields,
} from '@/lib/frontend/api'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import styles from './OptionSidebar.module.scss'

interface Props {
  presets: Preset[] | null
  preset?: Preset
  setPreset: (preset?: Preset) => void
  options: SessionOptionsFields
  setOptions: (options: SessionOptionsFields) => void
  setOpen: (open: boolean) => void
}

export default function OptionSidebar({
  presets,
  preset,
  setPreset,
  options,
  setOptions,
  setOpen,
}: Props) {
  const api = new Api()
  const integrations: Integration[] | null = api.useIntegrations()
  const models = api.useAvailableModels(options.integration || null)
  const reasoningEffortOptions = [
    { key: 'default', value: 'Default' },
    { key: 'none', value: 'None' },
    { key: 'low', value: 'Low' },
    { key: 'medium', value: 'Medium' },
    { key: 'high', value: 'High' },
    { key: 'xhigh', value: 'XHigh' },
  ]

  function handleOptionChange(field: keyof SessionOptionsFields, value: any) {
    options = {
      ...options,
      [field]: value,
    }
    setOptions(options)
  }

  const renderMarkdown = options.renderMarkdown !== false
  const renderMath = options.renderMath !== false
  const useDollarForMath = options.useDollarForMath === true

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <button
          className={styles.closeButton}
          onClick={() => setOpen(false)}
          aria-label='Close sidebar'
        >
          <ChevronRightIcon />
        </button>
      </div>
      {/* Presets section */}
      <div className={styles.section}>
        <input
          type='checkbox'
          id='presets-toggle'
          className={styles.sectionToggle}
          defaultChecked
        />
        <label htmlFor='presets-toggle' className={styles.sectionTitle}>
          <span>Presets</span>
          <span className={styles.chevron}>▼</span>
        </label>
        <div className={styles.sectionContent}>
          <PresetManagement
            presets={presets}
            preset={preset}
            setPreset={setPreset}
            options={options}
            setOptions={setOptions}
          />
        </div>
      </div>

      <div className={styles.section}>
        <input
          type='checkbox'
          id='model-toggle'
          className={styles.sectionToggle}
          defaultChecked
        />
        <label htmlFor='model-toggle' className={styles.sectionTitle}>
          <span>Model</span>
          <span className={styles.chevron}>▼</span>
        </label>
        <div className={styles.sectionContent}>
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
            <div className='description'>
              Higher temperature responses are more varied.
            </div>
          </div>

          {/* Reasoning effort */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor='reasoningEffort'>
              Reasoning effort
            </label>
            <Select
              id='reasoningEffort'
              selected={options.reasoningEffort ?? 'default'}
              placeholder={null}
              onChange={reasoningEffort =>
                handleOptionChange(
                  'reasoningEffort',
                  reasoningEffort === 'default' ? null : reasoningEffort,
                )
              }
              options={reasoningEffortOptions}
            />
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
            <p className='description'>
              Provide specific instructions to the model on how to respond.
            </p>
          </div>
        </div>
      </div>

      {/* Markdown rendering */}
      <div className={styles.section}>
        <input
          type='checkbox'
          id='appearance-toggle'
          className={styles.sectionToggle}
          defaultChecked
        />
        <label htmlFor='appearance-toggle' className={styles.sectionTitle}>
          <span>Appearance</span>
          <span className={styles.chevron}>▼</span>
        </label>
        <div className={styles.sectionContent}>
          <div className={styles.field}>
            <label className='checkboxLabel'>
              <input
                type='checkbox'
                className='checkbox'
                checked={renderMarkdown}
                onChange={e =>
                  handleOptionChange('renderMarkdown', e.target.checked)
                }
              />
              <span className='checkboxText'>Render Markdown</span>
            </label>
          </div>
          <div className={styles.field}>
            <label className='checkboxLabel'>
              <input
                type='checkbox'
                className='checkbox'
                checked={renderMath}
                onChange={e =>
                  handleOptionChange('renderMath', e.target.checked)
                }
                disabled={!renderMarkdown}
              />
              <span className='checkboxText'>Render math</span>
            </label>
          </div>
          <div className={styles.field}>
            <label className='checkboxLabel'>
              <input
                type='checkbox'
                className='checkbox'
                checked={useDollarForMath}
                onChange={e =>
                  handleOptionChange('useDollarForMath', e.target.checked)
                }
                disabled={!renderMarkdown || !renderMath}
              />
              <span className='checkboxText'>Use $ for inline math</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  )
}
