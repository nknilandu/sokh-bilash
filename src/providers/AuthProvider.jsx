
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

export const AuthContext = createContext();

const auth = getAuth(app);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState(null);
  const [accountStatus, setAccountStatus] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const roleRequestId = useRef(0);

  // ================= Firebase Authentication =================

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

  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) {
      throw new Error("No authenticated user found");
    }

    await updateProfile(auth.currentUser, profileData);
    setUser({ ...auth.currentUser });
  };

  // ================= Fetch User Role =================
  const refreshRole = useCallback(async (firebaseUser = auth.currentUser) => {
    const requestId = ++roleRequestId.current;

    if (!firebaseUser) {
      setRole(null);
      setAccountStatus(null);
      return null;
    }

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch(`${API_URL}/users/role`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user role: ${response.status}`);
      }

      const data = await response.json();

      if (
        requestId === roleRequestId.current &&
        auth.currentUser?.uid === firebaseUser.uid
      ) {
        setRole(data.role);
        setAccountStatus(data.status);
      }

      return data.role;

    } catch (error) {
      console.error("Role Fetch Error:", error.message);

      if (
        requestId === roleRequestId.current &&
        auth.currentUser?.uid === firebaseUser.uid
      ) {
        setRole(null);
        setAccountStatus(null);
      }

      return null;
    }
  }, []);

  // ================= Firebase Auth Observer =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        ++roleRequestId.current;

        setRole(null);
        setAccountStatus(null);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);

      refreshRole(currentUser).finally(() => {
        if (auth.currentUser?.uid === currentUser.uid) {
          setRoleLoading(false);
        }
      });
    });

    return unsubscribe;
  }, [refreshRole]);

  // Refresh role when returning to the website
  useEffect(() => {
    const handleFocus = () => {
      if (auth.currentUser) {
        refreshRole(auth.currentUser);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshRole]);

  // ================= Context Data =================

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
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
