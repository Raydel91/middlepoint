import type { FieldAccess } from 'payload'
import { isMarketingRole } from '@middlepoint/shared'

/** Marketing no puede editar este campo (sí puede verlo). */
export const updateUnlessMarketing: FieldAccess = ({ req: { user } }) =>
  !isMarketingRole(user?.role)

/** Marketing y staff pueden editar (descripción, SEO, galería, social). */
export const updateAllowMarketing: FieldAccess = () => true
