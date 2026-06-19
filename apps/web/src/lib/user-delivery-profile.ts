export type DeliveryAddress = {
  street: string;
  city: string;
  province: string;
  reference?: string;
};

export type SecondaryContact = {
  name: string;
  phone: string;
  email?: string;
};

export type UserDeliveryProfile = {
  address: DeliveryAddress;
  contactSecondary?: SecondaryContact;
};

type UserDoc = {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string | null;
  delivery_address?: {
    street?: string | null;
    city?: string | null;
    province?: string | null;
    reference?: string | null;
  } | null;
  contact_secondary?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

export function parseUserDeliveryProfile(user: UserDoc): UserDeliveryProfile {
  const address = user.delivery_address;
  const secondary = user.contact_secondary;

  const profile: UserDeliveryProfile = {
    address: {
      street: address?.street?.trim() || '',
      city: address?.city?.trim() || '',
      province: address?.province?.trim() || '',
      reference: address?.reference?.trim() || '',
    },
  };

  if (secondary?.name?.trim() && secondary?.phone?.trim()) {
    profile.contactSecondary = {
      name: secondary.name.trim(),
      phone: secondary.phone.trim(),
      email: secondary.email?.trim() || undefined,
    };
  }

  return profile;
}

export function parseCheckoutProfilePayload(data: {
  address: DeliveryAddress;
  contactSecondary?: SecondaryContact;
}): {
  delivery_address: DeliveryAddress;
  contact_secondary?: SecondaryContact | null;
} {
  const hasSecondary = Boolean(data.contactSecondary?.name?.trim() && data.contactSecondary?.phone?.trim());

  return {
    delivery_address: {
      street: data.address.street.trim(),
      city: data.address.city.trim(),
      province: data.address.province.trim(),
      reference: data.address.reference?.trim() || undefined,
    },
    contact_secondary: hasSecondary
      ? {
          name: data.contactSecondary!.name.trim(),
          phone: data.contactSecondary!.phone.trim(),
          email: data.contactSecondary!.email?.trim() || undefined,
        }
      : null,
  };
}

export function getCheckoutDefaultsFromUser(user: UserDoc) {
  const profile = parseUserDeliveryProfile(user);
  const displayName = `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim();

  return {
    address: profile.address,
    contactPrimary: {
      name: displayName,
      phone: user.telefono?.trim() || '',
      email: user.email?.trim() || '',
    },
    contactSecondary: profile.contactSecondary,
  };
}
