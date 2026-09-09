const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const dataDirectory = path.join(__dirname, "..", "data");
const usersFile = path.join(dataDirectory, "users.json");

const loadUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, "utf8"));
  } catch {
    return [];
  }
};

let users = loadUsers();

const persistUsers = () => {
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

const findUserByEmail = (email) => users.find((user) => user.email === email.toLowerCase());
const findUserById = (id) => users.find((user) => user.id === id);

const createUser = ({ name, email, passwordHash }) => {
  const user = { id: randomUUID(), name, email: email.toLowerCase(), passwordHash, createdAt: new Date().toISOString() };
  users.push(user);
  persistUsers();
  return user;
};

module.exports = { findUserByEmail, findUserById, createUser };
