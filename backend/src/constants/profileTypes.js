export const PROFILE_TYPES = Object.freeze({
  TRAVELER: 'traveler',
  PROPERTY_OWNER: 'property_owner',
});

export const PROFILE_TYPE_VALUES = Object.values(PROFILE_TYPES);

export const doesProfileRequireSsn = (profileType) =>
  profileType === PROFILE_TYPES.PROPERTY_OWNER;
