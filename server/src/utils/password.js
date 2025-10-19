import bcrypt from "bcryptjs";

export const verifyPassword = async (candidate, { plain, hash }) => {
  if (hash) {
    return bcrypt.compare(candidate, hash);
  }

  return candidate === plain;
};

export const hashPassword = async (plain, rounds = 10) => {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("Password must be a non-empty string");
  }

  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(plain, salt);
};
