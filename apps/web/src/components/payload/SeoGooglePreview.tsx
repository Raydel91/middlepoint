'use client'

import type { CSSProperties } from 'react'
import { useFormFields } from '@payloadcms/ui'

type I18n = { es?: string; en?: string }

function asI18n(value: unknown): I18n {
  if (value && typeof value === 'object') return value as I18n
  return {}
}

function countLabel(n: number, min: number, max: number) {
  const ok = n >= min && n <= max
  return (
    <span style={{ color: ok ? 'var(--theme-success-500)' : 'var(--theme-warning-500)' }}>
      {n} caracteres {ok ? '✓' : `(ideal ${min}–${max})`}
    </span>
  )
}

/**
 * Vista previa estilo Google SERP + contadores de Meta Title / Description.
 * `pathKind`: product | category (vía admin.custom).
 */
export function SeoGooglePreview(props: {
  field?: { admin?: { custom?: { pathKind?: 'product' | 'category' } } }
}) {
  const pathKind = props.field?.admin?.custom?.pathKind || 'product'
  const base =
    (typeof window !== 'undefined' && window.location?.origin) ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    'https://middlepointrd.vercel.app'

  const values = useFormFields(([fields]) => {
    const slug = (fields.slug?.value as string) || 'mi-slug'
    const titleEs =
      (fields['seo.meta_title.es']?.value as string) ||
      asI18n(fields['seo.meta_title']?.value).es ||
      (fields['nombre.es']?.value as string) ||
      'Título del producto'
    const titleEn =
      (fields['seo.meta_title.en']?.value as string) ||
      asI18n(fields['seo.meta_title']?.value).en ||
      (fields['nombre.en']?.value as string) ||
      titleEs
    const descEs =
      (fields['seo.meta_description.es']?.value as string) ||
      asI18n(fields['seo.meta_description']?.value).es ||
      (fields['descripcion.es']?.value as string) ||
      ''
    const descEn =
      (fields['seo.meta_description.en']?.value as string) ||
      asI18n(fields['seo.meta_description']?.value).en ||
      (fields['descripcion.en']?.value as string) ||
      descEs

    return { slug, titleEs, titleEn, descEs, descEn }
  })

  const segment = pathKind === 'category' ? 'categorias' : 'productos'
  const urlEs = `${base.replace(/\/$/, '')}/es/${segment}/${values.slug}`
  const urlEn = `${base.replace(/\/$/, '')}/en/${segment}/${values.slug}`

  const cardStyle: CSSProperties = {
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    background: 'var(--theme-elevation-0)',
  }
  const titleStyle: CSSProperties = {
    color: '#1a0dab',
    fontSize: 18,
    lineHeight: 1.3,
    margin: '0 0 4px',
    fontFamily: 'Arial, sans-serif',
  }
  const urlStyle: CSSProperties = {
    color: '#006621',
    fontSize: 14,
    marginBottom: 4,
    wordBreak: 'break-all',
  }
  const descStyle: CSSProperties = {
    color: '#4d5156',
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
  }

  return (
    <div className="field-type seo-google-preview">
      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--theme-elevation-600)' }}>
        Vista previa de Google · Title ES: {countLabel(values.titleEs.length, 50, 60)} · Description
        ES: {countLabel(values.descEs.length, 140, 160)}
      </div>

      <div style={cardStyle}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Español
        </p>
        <p style={titleStyle}>{values.titleEs || 'Meta Title'}</p>
        <p style={urlStyle}>{urlEs}</p>
        <p style={descStyle}>
          {(values.descEs || 'La meta description aparecerá aquí…').slice(0, 160)}
          {values.descEs.length > 160 ? '…' : ''}
        </p>
      </div>

      <div style={cardStyle}>
        <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          English
        </p>
        <p style={titleStyle}>{values.titleEn || 'Meta Title'}</p>
        <p style={urlStyle}>{urlEn}</p>
        <p style={descStyle}>
          {(values.descEn || 'Meta description will appear here…').slice(0, 160)}
          {values.descEn.length > 160 ? '…' : ''}
        </p>
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          Title EN: {countLabel(values.titleEn.length, 50, 60)} · Description EN:{' '}
          {countLabel(values.descEn.length, 140, 160)}
        </p>
      </div>

      <p style={{ fontSize: 12, color: 'var(--theme-elevation-500)', margin: 0 }}>
        Canonical (automático): {urlEs}
      </p>
    </div>
  )
}
