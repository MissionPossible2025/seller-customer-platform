export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.8rem 1rem',
          paddingLeft: '2.5rem',
          borderRadius: '10px',
          border: '1px solid #cbd5e1',
          background: 'white',
          fontSize: '1rem',
          outline: 'none',
          transition: 'border-color 0.2s'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6366f1'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1'
        }}
      />
      <div style={{
        position: 'absolute',
        left: '0.75rem',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#64748b',
        pointerEvents: 'none'
      }}>
        🔍
      </div>
    </div>
  )
}
