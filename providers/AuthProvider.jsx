import { createContext, useEffect, useState } from "react";
import { app } from "../firebase/firebase.config";

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  reload,
} from "firebase/auth";

export const AuthContext = createContext();

const auth = getAuth(app);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  // Create user
  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Login user
  const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Forgot password
  const forgotPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Logout user
  const logOut = () => {
    return signOut(auth);
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }

    await updateProfile(auth.currentUser, profileData);
    setUser(auth.currentUser);
  };

  // Send email verification
  const sendVerificationEmail = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    if (currentUser.emailVerified) {
      return;
    }

    return sendEmailVerification(currentUser);
  };

  // Check latest email verification status
  const checkEmailVerification = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    await reload(currentUser);

    const verified = currentUser.emailVerified;

    setEmailVerified(verified);

    return verified;
  };

  // Firebase auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setEmailVerified(currentUser?.emailVerified ?? false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const authData = {
    user,
    setUser,
    loading,
    emailVerified,

    createUser,
    loginUser,
    forgotPassword,
    logOut,
    updateUserProfile,

    sendVerificationEmail,
    checkEmailVerification,
  };

  return (
    <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
