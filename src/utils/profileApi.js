import { getAuth } from "firebase/auth";
import { app } from "../../firebase/firebase.config";

const auth = getAuth(app);

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

export async function profileRequest(
  path,
  { method = "GET", body, signal } = {},
) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    throw new Error("Invalid API path");
  }

  // Wait for the Firebase session to restore.
  if (typeof auth.authStateReady === "function") {
    await auth.authStateReady();
  }

  const user = auth.currentUser;

  if (!user) {
    throw new Error("Authentication required");
  }

  const token = await user.getIdToken();

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
      credentials: "omit",
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new Error("Network error. Please check your connection.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success !== true) {
    const error = new Error(
      data?.message || `Profile request failed (${response.status})`,
    );

    error.status = response.status;
    throw error;
  }

  return data;
}
