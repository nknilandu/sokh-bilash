
import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

import { API_URL } from "../utils/siteConfig";

const auth = getAuth(app);



// ========================================
// INITIAL ROLE STATE
// ========================================

const initialRoleState = {
  uid: null,
  role: null,
  status: null,
  checking: true,
};

// ========================================
// AUTH PROVIDER
// ========================================

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profileVersion, setProfileVersion] = useState(0);

  const [roleState, setRoleState] = useState(initialRoleState);

  const roleRequestId = useRef(0);

  // ========================================
  // FIREBASE AUTHENTICATION
  // ========================================

  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const forgotPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const logOut = () => {
    return signOut(auth);
  };

  // ========================================
  // UPDATE FIREBASE PROFILE
  // ========================================

  const updateUserProfile = async (profileData) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    await updateProfile(currentUser, profileData);

    if (auth.currentUser?.uid === currentUser.uid) {
      setUser(auth.currentUser);

      // Notify components when Firebase User
      // object reference stays unchanged.
      setProfileVersion((previous) => previous + 1);
    }
  };

  // ========================================
  // REFRESH USER ROLE
  //
  // IMPORTANT FIX:
  // Existing role is NOT cleared during
  // background refresh for the same user.
  // ========================================

  const refreshRole = useCallback(
    async (firebaseUser = auth.currentUser) => {
      const requestId = ++roleRequestId.current;

      // User logged out
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

      // ====================================
      // FIX: PRESERVE EXISTING ROLE
      // ====================================

      setRoleState((previous) => {
        const sameUser = previous.uid === uid;

        // Same authenticated user already
        // has a loaded role.
        // Keep it while fetching in background.
        if (
          sameUser &&
          previous.role !== null &&
          previous.checking === false
        ) {
          return previous;
        }

        // First login or different user:
        // initial role verification required.
        return {
          uid,
          role: null,
          status: null,
          checking: true,
        };
      });

      try {
        const token = await firebaseUser.getIdToken();

        const response = await fetch(
          `${API_URL}/users/role`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to get user role (${response.status})`
          );
        }

        const data = await response.json();

        if (
          data?.success !== true ||
          typeof data.role !== "string"
        ) {
          throw new Error("Invalid role response");
        }

        // Ignore stale requests and
        // responses for another account.
        if (
          roleRequestId.current !== requestId ||
          auth.currentUser?.uid !== uid
        ) {
          return null;
        }

        // ====================================
        // UPDATE ROLE AFTER FETCH COMPLETES
        // ====================================

        setRoleState({
          uid,
          role: data.role,
          status: data.status || null,
          checking: false,
        });

        return data.role;
      } catch (error) {
        console.error("Role Fetch Error:", error);

        if (
          roleRequestId.current !== requestId ||
          auth.currentUser?.uid !== uid
        ) {
          return null;
        }

        setRoleState((previous) => {
          // Preserve an already verified role
          // during a temporary network failure.
          // Server must still verify permissions.
          if (
            previous.uid === uid &&
            previous.role !== null &&
            previous.checking === false
          ) {
            return previous;
          }

          // Initial role verification failed.
          return {
            uid,
            role: null,
            status: null,
            checking: false,
          };
        });

        return null;
      }
    },
    []
  );

  // ========================================
  // AUTH STATE OBSERVER
  // ========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
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

        // Fetch user's role after login.
        void refreshRole(currentUser);
      }
    );

    return () => {
      ++roleRequestId.current;
      unsubscribe();
    };
  }, [refreshRole]);

  // ========================================
  // REFRESH ROLE ON WINDOW FOCUS
  //
  // FIXED:
  // Returning from File Picker will not
  // reset the existing user's role.
  // ========================================

  useEffect(() => {
    const handleFocus = () => {
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      // Background refresh.
      // Does NOT clear existing role.
      void refreshRole(currentUser);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshRole]);

  // ========================================
  // CURRENT USER ROLE
  // ========================================

  const sameUser =
    Boolean(user?.uid) &&
    roleState.uid === user.uid;

  const role = sameUser ? roleState.role : null;

  const accountStatus = sameUser
    ? roleState.status
    : null;

  // Only block the UI when:
  // - Firebase auth is initially loading
  // - Role for the current UID is missing
  // - Initial role verification is running
  //
  // Background refresh does NOT show loading.

  const roleLoading =
    loading ||
    (Boolean(user) &&
      (
        !sameUser ||
        roleState.checking
      ));

  // ========================================
  // CONTEXT VALUES
  // ========================================

  const authData = {
    user,
    setUser,
    loading,

    role,
    roleLoading,
    accountStatus,
    refreshRole,

    profileVersion,

    createUser,
    loginUser,
    forgotPassword,
    logOut,
    updateUserProfile, 
  };

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
