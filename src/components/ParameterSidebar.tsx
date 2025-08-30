import Api from '@/lib/frontend/api'
import { Integration } from '@/lib/integration'
import styles from './ParameterSidebar.module.scss'
import { Parameters } from '@/lib/session'
import Select from '@/components/form/Select'

interface Props {
  parameters: Parameters
  setParameters: (parameters: Parameters) => void
}

export default function ParameterSidebar({ parameters, setParameters }: Props) {
  const api = new Api()
  const integrations: Integration[] | null = api.useIntegrations()
  const models = api.useAvailableModels(parameters.integration || null)

  function handleParameterChange(field: keyof Parameters, value: any) {
    parameters = {
      ...parameters,
      [field]: value,
    }
    setParameters(parameters)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Session parameters</h3>

        {/* Integration Selection */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='integration'>
            Integration
          </label>
          <Select
            id='integration'
            placeholder='Select integration...'
            selected={parameters.integration}
            onChange={integrationId => {
              handleParameterChange('integration', integrationId)
              // Reset model when integration changes
              if (integrationId !== parameters.integration) {
                handleParameterChange('model', undefined)
              }
            }}
            options={integrations?.map(integration => ({
              key: integration.id,
              value: integration.name,
            }))}
          />
        </div>

        {/* Model Selection */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='model'>
            Model
          </label>
          <Select
            id='model'
            selected={parameters.model}
            onChange={model => handleParameterChange('model', model)}
            disabled={!parameters.integration || !models}
            options={models?.map(model => ({
              key: model.name,
              value: model.displayName,
            }))}
          />
          {parameters.integration && !models && (
            <span className={styles.loading}>Loading models...</span>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Generation Parameters</h3>

        {/* Temperature */}
        <div className={styles.field}>
          <label className={styles.label} htmlFor='temperature'>
            Temperature: {parameters.temperature.toFixed(2)}
          </label>
          <input
            id='temperature'
            type='range'
            className='slider'
            min='0'
            max='2'
            step='0.05'
            value={parameters.temperature}
            onChange={e =>
              handleParameterChange('temperature', parseFloat(e.target.value))
            }
          />
          <div className={styles.fieldDescription}>
            Higher temperature responses are more varied.
          </div>
        </div>

        {/* Thinking Enabled */}
        <div className={styles.field}>
          <label className='checkboxLabel'>
            <input
              type='checkbox'
              className='checkbox'
              checked={parameters.thinkingEnabled}
              onChange={e =>
                handleParameterChange('thinkingEnabled', e.target.checked)
              }
            />
            <span className='checkboxText'>Enable thinking</span>
          </label>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>System prompt</h3>
        <div className={styles.field}>
          <textarea
            id='systemPrompt'
            className='textarea'
            value={parameters.systemPrompt}
            onChange={e =>
              handleParameterChange('systemPrompt', e.target.value)
            }
            placeholder='Enter prompt (optional)...'
            rows={6}
          />
          <p className={styles.fieldDescription}>
            Provide specific instructions to the model on how to respond.
          </p>
        </div>
      </div>
    </aside>
  )
}
