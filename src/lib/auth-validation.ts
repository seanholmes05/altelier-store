// Pure: no `@/db` or `@/lib/auth` import, so client forms can share it with the server config.
// The server is still the authority; these give fast, specific feedback before a round trip.

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 100;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Validator = (value: string) => string | null;

export const validateName: Validator = (value) => {
  const v = value.trim();
  if (!v) return "Enter your name.";
  if (v.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  return null;
};

export const validateEmail: Validator = (value) => {
  const v = value.trim();
  if (!v) return "Enter your email address.";
  if (!EMAIL.test(v)) return "Enter a valid email address, like name@example.com.";
  return null;
};

/** Sign-in only checks presence, so a password set under older rules still works. */
export const validateCurrentPassword: Validator = (value) =>
  value ? null : "Enter your password.";

export const validateNewPassword: Validator = (value) => {
  if (!value) return "Enter a password.";
  if (value.length < PASSWORD_MIN) {
    return `Use at least ${PASSWORD_MIN} characters (you have ${value.length}).`;
  }
  if (value.length > PASSWORD_MAX) return `Use ${PASSWORD_MAX} characters or fewer.`;
  return null;
};
