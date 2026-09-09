const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createUser, findUserByEmail, findUserById } = require("../services/userStore");

const publicUser = (user) => ({ id: user.id, name: user.name, email: user.email });
const tokenFor = (user) => jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

const isValidEmail = (value) => {
  const email = String(value || "").trim();
  if (!email || email.includes(" ") || email.includes("..")) return false;
  if (email.startsWith(".") || email.endsWith(".")) return false;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;
  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  if (!localPart || !domainPart) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;
  if (domainPart.startsWith(".") || domainPart.endsWith(".")) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart)) return false;
  const domainSegments = domainPart.split(".");
  if (domainSegments.length < 2) return false;
  if (domainSegments.some((segment) => segment.length < 2 || !/^[A-Za-z0-9-]+$/.test(segment))) return false;
  const tld = domainSegments[domainSegments.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(tld)) return false;
  return true;
};

const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(String(value || ""));

const register = async (req, res) => {
  const name = String(req.body.name || req.body.fullName || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const confirmPassword = String(req.body.confirmPassword || "");

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message: "Password must contain:\n• At least 8 characters\n• One uppercase letter\n• One lowercase letter\n• One number\n• One special character"
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = createUser({ name, email, passwordHash });
  res.status(201).json({ message: "Registration successful.", user: publicUser(user) });
};

const login = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = findUserByEmail(email);

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email address." });
  }

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  res.json({ token: tokenFor(user), user: publicUser(user) });
};

const me = (req, res) => {
  const user = findUserById(req.user.id);
  if (!user) return res.status(401).json({ message: "Authentication required." });
  res.json({ user: publicUser(user) });
};

module.exports = { register, login, me, isValidEmail, isStrongPassword };
