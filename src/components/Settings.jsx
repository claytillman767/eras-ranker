// Settings tab — app-wide display and behaviour preferences.
export default function Settings({ settings, updateSetting }) {
  return (
    <div style={{ paddingTop: 20 }}>

      {/* ── Display section ── */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#6b7280',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        Display
      </div>

      <div style={{
        background: '#ffffff',
        border: '0.5px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <SettingRow
          label="Category breakdown"
          description="Show score bars under each song in the album view."
          value={settings.showCategoryBars}
          onChange={v => updateSetting('showCategoryBars', v)}
        />
      </div>

    </div>
  );
}

// A single toggle row inside the settings card
function SettingRow({ label, description, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 16px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
          {label}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>

      {/* Toggle switch */}
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          background: value ? '#a855f7' : '#d1d5db',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 3,
          left: value ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}
