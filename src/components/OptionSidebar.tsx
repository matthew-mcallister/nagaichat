import Api, { Integration, ModelOptions } from '@/lib/frontend/api'
import styles from './OptionSidebar.module.scss'
import { SessionOptions } from '@/lib/frontend/api'
import Select from '@/components/form/Select'

interface Props {
  options: SessionOptions
  setOptions: (options: SessionOptions) => void
}

export default function OptionSidebar({ options, setOptions }: Props) {
  const api = new Api()
  const integrations: Integration[] | null = api.useIntegrations()
  const models = api.useAvailableModels(
    options.modelOptions.integration || null
  )

  function handleOptionChange(field: keyof SessionOptions, value: any) {
    options = {
      ...options,
      [field]: value,
    }
    setOptions(options)
  }

  function handleModelOptionChange(field: keyof ModelOptions, value: any) {
    handleOptionChange('modelOptions', {
      ...options.modelOptions,
      [field]: value,
    })
  }

  return (
    <aside className={styles.sidebar}>
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
            selected={options.modelOptions.integration}
            onChange={integrationId => {
              handleModelOptionChange('integration', integrationId)
              // Reset model when integration changes
              if (integrationId !== options.modelOptions.integration) {
                handleModelOptionChange('model', undefined)
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
            selected={options.modelOptions.model}
            onChange={model => handleModelOptionChange('model', model)}
            disabled={!options.modelOptions.integration || !models}
            options={models?.map(model => ({
              key: model.name,
              value: model.displayName,
            }))}
          />
          {options.modelOptions.integration && !models && (
            <span className={styles.loading}>Loading models...</span>
          )}
        </div>

        <hr />

        {/* Temperature */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='temperature'>
            Temperature: {options.modelOptions.temperature.toFixed(2)}
          </label>
          <input
            id='temperature'
            type='range'
            className='slider'
            min='0'
            max='2'
            step='0.05'
            value={options.modelOptions.temperature}
            onChange={e =>
              handleModelOptionChange('temperature', parseFloat(e.target.value))
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
              checked={options.modelOptions.thinkingEnabled}
              onChange={e =>
                handleModelOptionChange('thinkingEnabled', e.target.checked)
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
            value={options.modelOptions.systemPrompt}
            onChange={e =>
              handleModelOptionChange('systemPrompt', e.target.value)
            }
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
