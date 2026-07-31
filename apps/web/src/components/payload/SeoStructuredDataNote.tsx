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
        <strong>Qué es:</strong> datos estructurados Schema.org para que Google entienda el producto o
        la categoría (rich results).
      </p>
      <p style={{ margin: '8px 0 0' }}>
        <strong>Ejemplo:</strong> se genera solo como tipo <code>Product</code> o{' '}
        <code>CollectionPage</code>. No hace falta pegar JSON manualmente.
      </p>
    </div>
  )
}
