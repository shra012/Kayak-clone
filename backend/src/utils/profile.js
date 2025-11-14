import {
  PROFILE_TYPES,
  PROFILE_TYPE_VALUES,
} from '../constants/profileTypes.js';

export const normalizeProfileType = (profileType) =>
  PROFILE_TYPE_VALUES.includes(profileType) ? profileType : PROFILE_TYPES.TRAVELER;

export const normalizePartnerDetails = (profileType, partnerDetails) => {
  if (profileType !== PROFILE_TYPES.PROPERTY_OWNER) {
    return null;
  }

  if (!partnerDetails) {
    const error = new Error('Property partner accounts require company details');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const {
    companyName,
    contactName,
    contactEmail,
    portfolioSize,
    website,
  } = partnerDetails;

  if (!companyName || !companyName.trim()) {
    const error = new Error('Company name is required for property partners');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const normalized = {
    companyName: companyName.trim(),
    contactName: contactName?.trim() || null,
    contactEmail: contactEmail?.trim() || null,
    website: website?.trim() || null,
    portfolioSize: null,
  };

  if (portfolioSize !== undefined && portfolioSize !== null && portfolioSize !== '') {
    const parsed = Number(portfolioSize);
    if (Number.isNaN(parsed) || parsed < 0) {
      const error = new Error('Portfolio size must be a positive number');
      error.code = 'VALIDATION_ERROR';
      throw error;
    }
    normalized.portfolioSize = parsed;
  }

  return normalized;
};
