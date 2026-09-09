import { createContext, useContext } from "react";

const AuthContext = createContext(null);
const tokenKey = "documind_token";
const useAuth = () => useContext(AuthContext);

export { AuthContext, tokenKey, useAuth };
