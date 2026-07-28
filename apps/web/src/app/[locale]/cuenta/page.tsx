import { setRequestLocale, getTranslations } from 'next-intl/server';
import { getPayloadClient } from '@/lib/payload';
import { type Locale } from '@middlepoint/shared';
import { getStoreContent } from '@/lib/store-content';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { MyReviewCard } from '@/components/reviews/MyReviewCard';
import { ProfilePhotoUpload } from '@/components/account/ProfilePhotoUpload';
import { AccountProfileForm } from '@/components/account/AccountProfileForm';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import { DeliveryProfileForm } from '@/components/account/DeliveryProfileForm';
import { AccountLogoutButton } from '@/components/account/AccountLogoutButton';
import { fetchAccountReviews } from '@/lib/account-data';
import { getMediaUrl } from '@/lib/media';
import { parseUserAccountProfile, parseUserDeliveryProfile } from '@/lib/user-delivery-profile';
import { requireCustomerAccount } from '@/lib/account-auth';
import type { Media } from '@/payload-types';
import { Link } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export default async function AccountProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireCustomerAccount(locale);
  const t = await getTranslations('account');
  const content = await getStoreContent(locale as Locale);

  const userId = Number(session.user.id);
  let avatarUrl: string | undefined;
  let myReviews: Awaited<ReturnType<typeof fetchAccountReviews>> = [];
  let accountProfile = parseUserAccountProfile({});
  let deliveryProfile = parseUserDeliveryProfile({});

  if (Number.isFinite(userId)) {
    const payload = await getPayloadClient();
    const [userDoc, reviews] = await Promise.all([
      payload.findByID({ collection: 'users', id: userId, depth: 1, overrideAccess: true }),
      fetchAccountReviews(payload, userId),
    ]);
    avatarUrl = getMediaUrl(userDoc.avatar as number | Media | null | undefined);
    myReviews = reviews;
    accountProfile = parseUserAccountProfile(userDoc);
    deliveryProfile = parseUserDeliveryProfile(userDoc);
  }

  const displayName = `${accountProfile.nombre} ${accountProfile.apellido}`.trim();

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <ProfilePhotoUpload
          name={displayName}
          avatarUrl={avatarUrl}
          labels={{
            change: t('profilePhotoChange'),
            uploading: t('profilePhotoUploading'),
            error: t('profilePhotoError'),
            hint: t('profilePhotoHint'),
          }}
        />
        <div className="mt-6 border-t border-primary/10 pt-6">
          <h1 className="font-secondary text-2xl font-bold text-secondary">{t('title')}</h1>
        </div>
      </div>

      <AccountProfileForm
        initial={accountProfile}
        labels={{
          title: t('personalDataTitle'),
          firstName: t('firstName'),
          lastName: t('lastName'),
          email: t('email'),
          phone: t('phone'),
          memberSince: t('memberSince'),
          save: t('personalDataSave'),
          success: t('personalDataSuccess'),
          error: t('personalDataError'),
          invalidPhone: t('personalDataInvalidPhone'),
          emailInUse: t('emailInUse'),
        }}
      />

      <ChangePasswordForm
        labels={{
          title: t('passwordTitle'),
          currentPassword: t('currentPassword'),
          newPassword: t('newPassword'),
          confirmPassword: t('confirmPassword'),
          save: t('passwordSave'),
          success: t('passwordSuccess'),
          error: t('passwordError'),
          mismatch: t('passwordMismatch'),
          invalidCurrent: t('passwordInvalidCurrent'),
        }}
      />

      <DeliveryProfileForm
        initial={deliveryProfile}
        labels={{
          title: t('deliveryProfileTitle'),
          addressTitle: t('deliveryAddressTitle'),
          street: t('deliveryStreet'),
          city: t('deliveryCity'),
          province: t('deliveryProvince'),
          reference: t('deliveryReference'),
          secondaryTitle: t('secondaryContactTitle'),
          secondaryHint: t('secondaryContactHint'),
          name: t('secondaryContactName'),
          phone: t('secondaryContactPhone'),
          email: t('secondaryContactEmail'),
          save: t('deliveryProfileSave'),
          success: t('deliveryProfileSuccess'),
          error: t('deliveryProfileError'),
        }}
      />

      <ReviewForm
        googleReviewsUrl={content.home.googleReviewsUrl}
        labels={{
          title: t('reviewTitle'),
          rating: t('reviewRating'),
          comment: t('reviewComment'),
          submit: t('reviewSubmit'),
          success: t('reviewSuccess'),
          pending: t('reviewPending'),
          error: t('reviewError'),
          minLength: t('reviewMinLength'),
          googleReview: content.home.googleReviewsLabel || t('reviewGoogle'),
        }}
      />

      {myReviews.length > 0 && (
        <section>
          <h2 className="mb-4 font-secondary text-xl font-semibold text-secondary">
            {t('myReviews')}
          </h2>
          <div className="space-y-4">
            {myReviews.map((review) => (
              <MyReviewCard
                key={review.id}
                review={review as Parameters<typeof MyReviewCard>[0]['review']}
                labels={{
                  rating: t('reviewRating'),
                  comment: t('reviewComment'),
                  edit: t('reviewEdit'),
                  save: t('reviewSave'),
                  cancel: t('reviewCancel'),
                  delete: t('reviewDelete'),
                  deleteConfirm: t('reviewDeleteConfirm'),
                  awaitingApproval: t('reviewAwaitingApproval'),
                  updateSuccess: t('reviewUpdateSuccess'),
                  updatePending: t('reviewUpdatePending'),
                  deleteSuccess: t('reviewDeleteSuccess'),
                  error: t('reviewError'),
                  minLength: t('reviewMinLength'),
                }}
              />
            ))}
          </div>
        </section>
      )}

      <div className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-secondary text-lg font-semibold text-secondary">{t('logoutTitle')}</h2>
          <p className="mt-1 text-sm text-secondary/60">{t('logoutHint')}</p>
        </div>
        <AccountLogoutButton label={t('logout')} />
      </div>

      <p className="text-sm text-secondary/60">
        <Link href="/" className="text-primary hover:underline">
          ← {t('backHome')}
        </Link>
      </p>
    </div>
  );
}
