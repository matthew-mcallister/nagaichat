export interface Option<K, V> {
  key: K
  value: V
}

export interface SelectProps<K, V> {
  id?: string
  selected?: K
  placeholder?: string
  options?: Option<K, V>[]
  onChange: (value?: K) => void | Promise<void>
  disabled?: boolean
}

export default function Select<K, V>({
  id,
  selected,
  placeholder,
  options,
  onChange,
  disabled,
}: SelectProps<K, V>) {
  options = options || []

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = event.target.value
    const option = options.find(opt => String(opt.key) === selectedKey)
    if (option) {
      onChange(option.key)
    } else {
      onChange(undefined)
    }
  }

  placeholder = placeholder || 'Select...'

  return (
    <select
      id={id}
      className='select'
      value={selected !== undefined ? String(selected) : ''}
      onChange={handleChange}
      disabled={disabled}
    >
      <option key='' value=''>
        {placeholder}
      </option>
      {options.map(option => (
        <option key={String(option.key)} value={String(option.key)}>
          {String(option.value)}
        </option>
      ))}
    </select>
  )
}
