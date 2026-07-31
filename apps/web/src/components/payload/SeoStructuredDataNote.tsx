'use client'

export function SeoStructuredDataNote() {
  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 8,
        padding: 14,
        marginBottom: 16,
        background: 'var(--theme-elevation-50)',
        fontSize: 13,
        color: 'var(--theme-elevation-700)',
        lineHeight: 1.5,
      }}
    >
      <strong>Structured Data (JSON-LD)</strong>
      <p style={{ margin: '8px 0 0' }}>
        Se genera automáticamente con Schema.org (Product o CollectionPage). No requiere edición
        manual.
      </p>
    </div>
  )
}
