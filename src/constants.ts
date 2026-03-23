/**
 * Known third-party age verification providers
 * Used to detect high-confidence age-gated content
 */

export const AGE_VERIFICATION_PROVIDERS = [
  // Major age verification services
  'agewish.com',
  'ageid.com',
  'yoti.com',
  'agechecker.net',
  'ageverify.com',
  'avs.tech',
  'veriff.com',
  'socure.com',
  'intellicheck.com',
  'greenkey.digital',
  'bbfc.co.uk',
  'agesmart.org',
  'identiq.com',
  'certibankid.com',
  'checknjack.com',
  'liveness.id',
  'authid.ai',
  'idemia.com',
  'gemalto.com',
  'creditcardvalidation.com',
];

/**
 * HTML patterns indicating age verification requirements
 * Multi-level matching for detection confidence
 */

export const AGE_RELATED_KEYWORDS = [
  'age',
  'dob',
  'birthdate',
  'birth date',
  'year of birth',
  'date of birth',
  'over 18',
  'over18',
  'over-18',
  '18+',
  '18 year',
  '18 years',
  '21+',
  '21 year',
  'adult',
  'mature',
  'restricted',
  'verify age',
  'age verification',
  'age confirm',
  'confirm age',
  'age gate',
  'age gated',
];

export const CONSENT_KEYWORDS = [
  'agree',
  'consent',
  'acknowledge',
  'confirm',
  'certify',
  'confirm that you are',
  'i am of legal age',
  'i confirm',
  'i understand',
];

/**
 * Form field patterns that strongly indicate age verification
 */
export const AGE_FIELD_PATTERNS = [
  /day.*month.*year/i,
  /date.*birth/i,
  /birth.*date/i,
  /age.*field/i,
  /select.*age/i,
  /year.*birth/i,
];

/**
 * Meta tag patterns that indicate adult content
 */
export const ADULT_META_TAGS = [
  'rating',
  'classification',
  'age-gate',
  'age-gated',
  'content-rating',
  'maturity-rating',
];
