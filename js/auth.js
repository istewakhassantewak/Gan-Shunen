const USERS_KEY = "ganshunen.users.v1";
const SESSION_KEY = "ganshunen.session.v1";

function safeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function getUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password) {
  let hash = 2166136261;
  for (let i = 0; i < password.length; i += 1) {
    hash ^= password.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `h${(hash >>> 0).toString(16)}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain letters and numbers.";
  }
  return null;
}

export function signup({ email, password, name }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(name || "").trim();
  const cleanPassword = String(password || "");

  if (!validateEmail(cleanEmail)) {
    throw new Error("Please enter a valid email.");
  }

  const passwordError = validatePassword(cleanPassword);
  if (passwordError) {
    throw new Error(passwordError);
  }

  if (cleanName.length < 2) {
    throw new Error("Display name must be at least 2 characters.");
  }

  const users = getUsers();
  if (users.some((user) => user.email === cleanEmail)) {
    throw new Error("This email is already registered.");
  }

  const newUser = {
    id: `user_${Date.now()}`,
    email: cleanEmail,
    name: cleanName,
    passwordHash: hashPassword(cleanPassword)
  };
  users.push(newUser);
  saveUsers(users);

  const session = { userId: newUser.id, loggedInAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { id: newUser.id, email: newUser.email, name: newUser.name };
}

export function login({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "");

  if (!validateEmail(cleanEmail)) {
    throw new Error("Please enter a valid email.");
  }

  const user = getUsers().find((item) => item.email === cleanEmail);
  if (!user || user.passwordHash !== hashPassword(cleanPassword)) {
    throw new Error("Invalid email or password.");
  }

  const session = { userId: user.id, loggedInAt: Date.now() };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return { id: user.id, email: user.email, name: user.name };
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser() {
  const sessionRaw = localStorage.getItem(SESSION_KEY);
  if (!sessionRaw) return null;
  const session = safeParse(sessionRaw, null);
  if (!session?.userId) return null;

  const user = getUsers().find((item) => item.id === session.userId);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name };
}
