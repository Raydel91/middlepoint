type ContactJson = {
  name?: string;
  phone?: string;
  email?: string;
};

export function getOrderContactPhone(order: {
  contact_primary?: ContactJson | null;
}): string {
  const phone = order.contact_primary?.phone?.trim();
  return phone || '';
}

export function getOrderContactName(order: {
  contact_primary?: ContactJson | null;
}): string {
  return order.contact_primary?.name?.trim() || 'Cliente';
}
