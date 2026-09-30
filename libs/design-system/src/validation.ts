export type FieldCheck = {
  value: string;
  required: boolean;
  email: boolean;
  minLength: number;
  error: string;
};

export type FieldValidity = {
  flags: ValidityStateFlags;
  message: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function fieldValidity(check: FieldCheck): FieldValidity {
  if (check.error !== '') {
    return { flags: { customError: true }, message: check.error };
  }
  if (check.required && check.value.trim() === '') {
    return { flags: { valueMissing: true }, message: 'This field is required.' };
  }
  if (check.email && check.value !== '' && !emailPattern.test(check.value)) {
    return { flags: { typeMismatch: true }, message: 'Enter a valid email address.' };
  }
  if (check.minLength > 0 && check.value !== '' && check.value.length < check.minLength) {
    return {
      flags: { tooShort: true },
      message: `Use at least ${check.minLength} characters.`,
    };
  }
  return { flags: {}, message: '' };
}
