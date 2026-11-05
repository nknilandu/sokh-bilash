import { createContext, useCallback, useEffect, useRef, useState } from "react";

import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import { app } from "../../firebase/firebase.config";

export const AuthContext = createContext(null);

const auth = getAuth(app);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [roleState, setRoleState] = useState({
    uid: null,
    role: null,
    status: null,
    checking: true,
  });

  const roleRequestId = useRef(0);

  // ========================================
  // FIREBASE AUTHENTICATION
  // ========================================

  const createUser = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const loginUser = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const forgotPassword = (email) => sendPasswordResetEmail(auth, email);

  const logOut = () => signOut(auth);

  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }

    await updateProfile(auth.currentUser, profileData);

    setUser(auth.currentUser);
  };

  // ========================================
  // CENTRALIZED USER ROLE
  // ========================================

  const refreshRole = useCallback(async (firebaseUser = auth.currentUser) => {
    const requestId = ++roleRequestId.current;

    if (!firebaseUser) {
      setRoleState({
        uid: null,
        role: null,
        status: null,
        checking: false,
      });

      return null;
    }

    const uid = firebaseUser.uid;

    // Prevent using a previous account's role.
    setRoleState({
      uid,
      role: null,
      status: null,
      checking: true,
    });

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`${API_URL}/users/role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to get user role (${response.status})`);
      }

      const data = await response.json();

      if (data?.success !== true || typeof data.role !== "string") {
        throw new Error("Invalid role response");
      }

      // Ignore outdated requests.
      if (
        roleRequestId.current === requestId &&
        auth.currentUser?.uid === uid
      ) {
        setRoleState({
          uid,
          role: data.role,
          status: data.status || null,
          checking: false,
        });
      }

      return data.role;
    } catch (error) {
      console.error("Role Fetch Error:", error.message);

      if (
        roleRequestId.current === requestId &&
        auth.currentUser?.uid === uid
      ) {
        setRoleState({
          uid,
          role: null,
          status: null,
          checking: false,
        });
      }

      return null;
    }
  }, []);

  // ========================================
  // AUTH OBSERVER
  // ========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        ++roleRequestId.current;

        setRoleState({
          uid: null,
          role: null,
          status: null,
          checking: false,
        });

        return;
      }

      void refreshRole(currentUser);
    });

    return () => {
      ++roleRequestId.current;
      unsubscribe();
    };
  }, [refreshRole]);

  // ========================================
  // REFRESH ROLE ON WINDOW FOCUS
  // ========================================

  useEffect(() => {
    const handleFocus = () => {
      if (auth.currentUser) {
        void refreshRole(auth.currentUser);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshRole]);

  // ========================================
  // ROLE STATE FOR CURRENT USER ONLY
  // ========================================

  const role = user?.uid === roleState.uid ? roleState.role : null;

  const accountStatus = user?.uid === roleState.uid ? roleState.status : null;

  const roleLoading =
    loading ||
    (Boolean(user) && (roleState.uid !== user.uid || roleState.checking));

  // ========================================
  // CONTEXT
  // ========================================

  const authData = {
    user,
    setUser,
    loading,

    role,
    roleLoading,
    accountStatus,
    refreshRole,

    createUser,
    loginUser,
    forgotPassword,
    logOut,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={authData}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
