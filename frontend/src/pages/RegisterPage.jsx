import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

const formatPhoneInput = (value) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  const withoutCountry = digits.startsWith('1') ? digits.slice(1) : digits;
  const trimmed = withoutCountry.slice(0, 10);
  const area = trimmed.slice(0, 3);
  const prefix = trimmed.slice(3, 6);
  const lineNumber = trimmed.slice(6, 10);

  let formatted = '+1';

  if (area) {
    formatted += `-${area}`;
  }
  if (prefix) {
    formatted += `-${prefix}`;
  }
  if (lineNumber) {
    formatted += `-${lineNumber}`;
  }

  return formatted;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    profileType: 'traveler',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zipCode: '',
    },
    partnerProfile: {
      companyName: '',
      contactName: '',
      contactEmail: '',
      portfolioSize: '',
      website: '',
    },
  });
  const [errors, setErrors] = useState({});
  const { register, loading, error } = useAuth();
  const roleOptions = [
    {
      id: 'traveler',
      title: 'Traveler',
      description: 'Search and book trips.',
    },
    {
      id: 'property_owner',
      title: 'Property Partner',
      description: 'List rentals and approve bookings.',
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'profileType') {
      setFormData({
        ...formData,
        profileType: value,
      });
      setErrors((prev) => ({
        ...prev,
        partnerCompanyName: undefined,
        partnerContactEmail: undefined,
        partnerPortfolioSize: undefined,
      }));
    } else if (name === 'phoneNumber') {
      setFormData({
        ...formData,
        phoneNumber: formatPhoneInput(value),
      });
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [field]: value,
        },
      });
    } else if (name.startsWith('partnerProfile.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        partnerProfile: {
          ...formData.partnerProfile,
          [field]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!/^\+1-\d{3}-\d{3}-\d{4}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone must be in format +1-XXX-XXX-XXXX';
    }

    if (formData.profileType === 'property_owner') {
      if (!formData.partnerProfile.companyName.trim()) {
        newErrors.partnerCompanyName = 'Company name is required for partners';
      }
      if (!formData.partnerProfile.contactEmail.trim()) {
        newErrors.partnerContactEmail = 'Contact email is required for partners';
      } else if (!/^\S+@\S+\.\S+$/.test(formData.partnerProfile.contactEmail)) {
        newErrors.partnerContactEmail = 'Contact email is invalid';
      }
      if (
        formData.partnerProfile.portfolioSize &&
        (Number.isNaN(Number(formData.partnerProfile.portfolioSize)) ||
          Number(formData.partnerProfile.portfolioSize) < 0)
      ) {
        newErrors.partnerPortfolioSize = 'Portfolio size must be a positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      const { confirmPassword, partnerProfile, ...userData } = formData;
      const payload = {
        ...userData,
        partnerProfile:
          formData.profileType === 'property_owner'
            ? {
                companyName: partnerProfile.companyName.trim(),
                contactName: partnerProfile.contactName.trim(),
                contactEmail: partnerProfile.contactEmail.trim(),
                portfolioSize: partnerProfile.portfolioSize,
                website: partnerProfile.website.trim(),
              }
            : null,
      };
      await register(payload);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content w-full max-w-4xl">
        <div className="card bg-base-100 w-full shadow-2xl">
          <div className="card-body">
            <h1 className="text-3xl font-bold text-center mb-4">Create Account</h1>
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}
            <div className="mb-8">
              <p className="text-sm text-base-content/70 mb-2">Choose the account type that matches your goal.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleOptions.map((option) => {
                  const isActive = formData.profileType === option.id;
                  return (
                    <button
                      type="button"
                      key={option.id}
                      onClick={() => handleChange({ target: { name: 'profileType', value: option.id } })}
                      className={`card border transition text-left ${
                        isActive ? 'border-primary shadow-xl' : 'border-base-200 hover:shadow-lg'
                      }`}
                      disabled={loading}
                    >
                      <div className="card-body">
                        <h2 className="card-title flex items-center justify-between">
                          {option.title}
                          {isActive && <span className="badge badge-primary">Selected</span>}
                        </h2>
                        <p className="text-sm text-base-content/70">{option.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">First Name</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="input input-bordered"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Last Name</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="input input-bordered"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="input input-bordered"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Phone Number</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    placeholder="+1-XXX-XXX-XXXX"
                    className={`input input-bordered ${errors.phoneNumber ? 'input-error' : ''}`}
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {errors.phoneNumber && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.phoneNumber}</span>
                    </label>
                  )}
                </div>
                {formData.profileType === 'property_owner' && (
                  <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Company Name</span>
                        </label>
                        <input
                          type="text"
                          name="partnerProfile.companyName"
                          className={`input input-bordered ${errors.partnerCompanyName ? 'input-error' : ''}`}
                          value={formData.partnerProfile.companyName}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        {errors.partnerCompanyName && (
                          <label className="label">
                            <span className="label-text-alt text-error">{errors.partnerCompanyName}</span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Primary Contact Name</span>
                        </label>
                        <input
                          type="text"
                          name="partnerProfile.contactName"
                          className="input input-bordered"
                          value={formData.partnerProfile.contactName}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Primary Contact Email</span>
                        </label>
                        <input
                          type="email"
                          name="partnerProfile.contactEmail"
                          className={`input input-bordered ${errors.partnerContactEmail ? 'input-error' : ''}`}
                          value={formData.partnerProfile.contactEmail}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        {errors.partnerContactEmail && (
                          <label className="label">
                            <span className="label-text-alt text-error">{errors.partnerContactEmail}</span>
                          </label>
                        )}
                      </div>
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Portfolio Size (properties)</span>
                        </label>
                        <input
                          type="number"
                          name="partnerProfile.portfolioSize"
                          className={`input input-bordered ${errors.partnerPortfolioSize ? 'input-error' : ''}`}
                          value={formData.partnerProfile.portfolioSize}
                          onChange={handleChange}
                          min="0"
                          disabled={loading}
                        />
                        {errors.partnerPortfolioSize && (
                          <label className="label">
                            <span className="label-text-alt text-error">{errors.partnerPortfolioSize}</span>
                          </label>
                        )}
                      </div>
                      <div className="form-control md:col-span-2">
                        <label className="label">
                          <span className="label-text">Company Website (optional)</span>
                        </label>
                        <input
                          type="url"
                          name="partnerProfile.website"
                          className="input input-bordered"
                          value={formData.partnerProfile.website}
                          onChange={handleChange}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {errors.password && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.password}</span>
                    </label>
                  )}
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm Password</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  {errors.confirmPassword && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.confirmPassword}</span>
                    </label>
                  )}
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Address Line 1</span>
                  </label>
                  <input
                    type="text"
                    name="address.line1"
                    className="input input-bordered"
                    value={formData.address.line1}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text">Address Line 2</span>
                  </label>
                  <input
                    type="text"
                    name="address.line2"
                    className="input input-bordered"
                    value={formData.address.line2}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City</span>
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    className="input input-bordered"
                    value={formData.address.city}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">State</span>
                  </label>
                  <select
                    name="address.state"
                    className="select select-bordered"
                    value={formData.address.state}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  >
                    <option value="" disabled hidden>
                      Select state
                    </option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Zip Code</span>
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    className="input input-bordered"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              {formData.profileType === 'property_owner' && (
                <p
                  className="text-xs font-semibold text-rose-500 mt-3"
                  style={{ fontFamily: '"Comic Sans MS", "Trebuchet MS", cursive' }}
                >
                  Property partners can finish SSN verification later, but we need business details to set up your partner workspace.
                </p>
              )}
              <div className="form-control mt-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </div>
              <div className="text-center mt-4">
                <span className="text-sm">
                  Already have an account?{' '}
                  <Link to="/login" className="link link-primary">
                    Login
                  </Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
