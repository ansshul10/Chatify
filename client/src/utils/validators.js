export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    symbol:    /[^A-Za-z0-9]/.test(password),
  };
};

export const getPasswordStrength = (password) => {
  const checks = validatePassword(password);
  const passed = Object.values(checks).filter(Boolean).length;
  if (passed <= 2) return { label: "Weak",   color: "bg-red-500",    width: "20%" };
  if (passed === 3) return { label: "Fair",   color: "bg-yellow-500", width: "50%" };
  if (passed === 4) return { label: "Good",   color: "bg-blue-500",   width: "75%" };
  return              { label: "Strong", color: "bg-emerald-500", width: "100%" };
};

export const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return re.test(username);
};

