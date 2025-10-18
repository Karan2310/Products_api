import bcrypt from "bcryptjs";

export const verifyPassword = async (candidate, { plain, hash }) => {
  if (hash) {
    return bcrypt.compare(candidate, hash);
  }

  return candidate === plain;
};
