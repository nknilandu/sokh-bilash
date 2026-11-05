
import { useContext, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuth,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import Swal from "sweetalert2";

import {
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleAlert,
  Edit3,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { app } from "../../firebase/firebase.config";
import { AuthContext } from "../providers/AuthProvider";
import { profileRequest } from "../utils/profileApi";
import { DIVISIONS } from "../utils/bangladeshRegions";

const auth = getAuth(app);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const fieldClass =
  "mt-2 w-full rounded-xl border border-base-300 bg-base-200/40 px-3.5 py-3 text-sm text-primary outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/10 disabled:opacity-60";

// ========================================
// BANNER DESIGN
// ========================================

const GIFT_PATTERN = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="210" height="170" viewBox="0 0 210 170">
  <defs>
    <g id="gift" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="-20" y="-6" width="40" height="30" rx="3" />
      <rect x="-24" y="-15" width="48" height="10" rx="2" />
      <path d="M0 -15V24" />
      <path d="M0 -15C-13 -15 -16 -29 -7 -31C-1 -32 0 -22 0 -15Z" />
      <path d="M0 -15C13 -15 16 -29 7 -31C1 -32 0 -22 0 -15Z" />
    </g>
    <g id="spark" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
      <path d="M0 -7V7M-7 0H7" />
    </g>
  </defs>
  <use href="#gift" transform="translate(37 39) rotate(-45) scale(.88)" />
  <use href="#gift" transform="translate(139 113) rotate(45) scale(.83)" />
  <use href="#spark" transform="translate(158 24) rotate(45)" />
  <use href="#spark" transform="translate(45 127) rotate(45) scale(.7)" />
</svg>
`)}`;

// ========================================
// EDITOR STATE CACHE
// Survives component remounts within SPA
// ========================================

const profileDraftCache = new Map();

function createForm(profile) {
  return {
    displayName: profile?.displayName || "",
    phone: profile?.phone || "",
    division: profile?.division || "",
    district: profile?.district || "",
    address: profile?.address || "",
  };
}

function createDraft(profile) {
  return {
    editing: false,
    form: createForm(profile),
    photoFile: null,
    previewUrl: "",
    removePhoto: false,
    uploadedPhotoUrl: "",
  };
}

function releasePreview(draft) {
  if (draft?.previewUrl) {
    URL.revokeObjectURL(draft.previewUrl);
  }
}

// ========================================
// HELPERS
// ========================================

function toast(title, icon = "success") {
  void Swal.fire({
    title,
    icon,
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2800,
    timerProgressBar: true,
  });
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function validateForm(form) {
  if (form.displayName.trim().length < 2) {
    return "নাম কমপক্ষে ২ অক্ষরের হতে হবে।";
  }

  if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) {
    return "সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।";
  }

  if (
    form.division ||
    form.district ||
    form.address.trim()
  ) {
    if (
      !DIVISIONS[form.division]?.includes(form.district)
    ) {
      return "সঠিক বিভাগ ও জেলা নির্বাচন করুন।";
    }

    if (form.address.trim().length < 5) {
      return "সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।";
    }
  }

  return "";
}

// ========================================
// IMGBB UPLOAD
// ========================================

async function uploadImageToImgBB(file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_IMGBB_API_KEY পাওয়া যায়নি।");
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(
      result?.error?.message ||
      "ImgBB-তে ছবি আপলোড করা যায়নি।"
    );
  }

  const imageUrl =
    result.data?.display_url || result.data?.url;

  if (!imageUrl) {
    throw new Error("ImgBB থেকে Image URL পাওয়া যায়নি।");
  }

  return imageUrl;
}

// ========================================
// AVATAR
// ========================================

function Avatar({ src, name }) {
  const [brokenSrc, setBrokenSrc] = useState("");

  const fallback =
    Array.from(String(name || "").trim())[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-[5px] border-white bg-[#FFD700] text-[#310039] shadow-lg sm:size-32">
      {src && src !== brokenSrc ? (
        <img
          src={src}
          alt={name || "Profile"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setBrokenSrc(src)}
        />
      ) : (
        <span className="text-5xl font-bold">
          {fallback}
        </span>
      )}
    </div>
  );
}

// ========================================
// REUSABLE COMPONENTS
// ========================================

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3 border-b border-base-300/70 pb-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
        <Icon size={19} />
      </span>

      <div>
        <h2 className="text-sm font-bold text-primary sm:text-base">
          {title}
        </h2>

        <p className="mt-1 text-[11px] text-muted">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-xl border border-base-300/70 bg-base-200/30 p-3.5">
      <p className="flex items-center gap-2 text-[11px] text-muted">
        <Icon size={14} className="text-secondary" />
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold leading-6 text-primary">
        {value || "—"}
      </p>
    </div>
  );
}

function FormField({ icon: Icon, title, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <Icon size={15} className="text-secondary" />
        {title}
      </div>

      {children}

      {hint && (
        <p className="mt-1.5 text-[11px] text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

// ========================================
// PROFILE CONTENT
// ========================================

function ProfileContent({
  profile,
  userUid,
  queryKey,
  isAdminView,
  updateUserProfile,
}) {
  const queryClient = useQueryClient();

  const canEdit = !isAdminView;

  // This key identifies the owner's edit session.
  const draftKey = `self-profile:${userUid}`;

  // Restore a draft after temporary React remount.
  const [draft, setDraft] = useState(
    () =>
      (canEdit && profileDraftCache.get(draftKey)) ||
      createDraft(profile)
  );

  const draftRef = useRef(draft);
  const savingRef = useRef(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const {
    editing,
    form,
    photoFile,
    previewUrl,
    removePhoto,
  } = draft;

  // ======================================
  // UPDATE DRAFT
  // ======================================

  function updateDraft(nextDraft) {
    draftRef.current = nextDraft;

    if (canEdit) {
      profileDraftCache.set(draftKey, nextDraft);
    }

    setDraft(nextDraft);
  }

  // ======================================
  // CLEAR DRAFT
  // ======================================

  function clearDraft(updatedProfile = profile) {
    releasePreview(draftRef.current);

    profileDraftCache.delete(draftKey);

    const nextDraft = createDraft(updatedProfile);

    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }

  // ======================================
  // START EDITING
  // ======================================

  function startEditing() {
    if (!canEdit || savingRef.current) return;

    // Keep only the current account's draft.
    for (const [key, value] of profileDraftCache) {
      if (key !== draftKey) {
        releasePreview(value);
        profileDraftCache.delete(key);
      }
    }

    const nextDraft = {
      ...createDraft(profile),
      editing: true,
    };

    updateDraft(nextDraft);
    setError("");
  }

  // ======================================
  // CANCEL EDITING
  // ======================================

  function cancelEditing() {
    if (savingRef.current) return;

    clearDraft(profile);
    setError("");
  }

  // ======================================
  // UPDATE FORM FIELD
  // ======================================

  function updateField(name, value) {
    if (!editing || savingRef.current) return;

    const current = draftRef.current;

    updateDraft({
      ...current,
      form: {
        ...current.form,
        [name]: value,
      },
    });

    setError("");
  }

  // ======================================
  // PHOTO SELECTION
  // No uploading, no closing edit mode.
  // ======================================

  function selectPhoto(file) {
    if (!file || savingRef.current || !canEdit) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("শুধু JPG, PNG অথবা WebP ছবি দিন।");
      return;
    }

    if (!file.size || file.size > MAX_IMAGE_SIZE) {
      setError("ছবির সাইজ সর্বোচ্চ ৫ MB হতে পারবে।");
      return;
    }

    const nextPreview = URL.createObjectURL(file);

    const previous = draftRef.current;

    releasePreview(previous);

    updateDraft({
      ...previous,
      editing: true,
      photoFile: file,
      previewUrl: nextPreview,
      removePhoto: false,
      uploadedPhotoUrl: "",
    });

    setError("");

    console.log("Profile photo selected:", file.name);
  }

  function handlePhotoChange(event) {
    const file = event.currentTarget.files?.[0];

    // Allows selecting the same image again.
    event.currentTarget.value = "";

    if (!file) return;

    selectPhoto(file);
  }

  // ======================================
  // REMOVE SELECTED PHOTO / CURRENT PHOTO
  // ======================================

  function handleRemovePhoto() {
    if (!canEdit || !editing || savingRef.current) return;

    const current = draftRef.current;

    releasePreview(current);

    updateDraft({
      ...current,
      photoFile: null,
      previewUrl: "",
      removePhoto: true,
      uploadedPhotoUrl: "",
    });

    setError("");
  }

  function cancelPhotoChange() {
    if (savingRef.current) return;

    const current = draftRef.current;

    releasePreview(current);

    updateDraft({
      ...current,
      photoFile: null,
      previewUrl: "",
      removePhoto: false,
      uploadedPhotoUrl: "",
    });

    setError("");
  }

  // ======================================
  // FIREBASE SYNC
  // ======================================

  async function syncFirebase(data) {
    if (typeof updateUserProfile === "function") {
      await updateUserProfile(data);
      return;
    }

    if (!auth.currentUser) {
      throw new Error("Firebase user পাওয়া যায়নি।");
    }

    await firebaseUpdateProfile(auth.currentUser, data);
  }

  // ======================================
  // SAVE ALL CHANGES
  // 1. ImgBB (if new photo)
  // 2. MongoDB
  // 3. Firebase
  // 4. Close edit mode
  // ======================================

  async function handleSave(event) {
    event.preventDefault();

    if (
      !canEdit ||
      !draftRef.current.editing ||
      savingRef.current
    ) {
      return;
    }

    const current = draftRef.current;

    const validationError = validateForm(current.form);

    if (validationError) {
      setError(validationError);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");

    let databaseSaved = false;

    try {
      // Verify account ownership
      if (auth.currentUser?.uid !== userUid) {
        throw new Error(
          "Login session পরিবর্তিত হয়েছে। আবার লগইন করুন।"
        );
      }

      // ----------------------------------
      // STEP 1: PHOTO UPLOAD
      // ----------------------------------

      let photoUrl = profile.photoUrl || "";

      if (current.removePhoto) {
        photoUrl = "";
      } else if (current.photoFile) {
        // Reuse URL if ImgBB upload succeeded
        // during an earlier failed save attempt.
        if (current.uploadedPhotoUrl) {
          photoUrl = current.uploadedPhotoUrl;
        } else {
          photoUrl = await uploadImageToImgBB(
            current.photoFile
          );

          updateDraft({
            ...draftRef.current,
            uploadedPhotoUrl: photoUrl,
          });
        }
      }

      // ----------------------------------
      // STEP 2: MONGODB UPDATE
      // ----------------------------------

      const payload = {
        displayName: current.form.displayName.trim(),
        phone: current.form.phone.trim(),
        division: current.form.division,
        district: current.form.district,
        address: current.form.address.trim(),
        photoUrl,
      };

      const response = await profileRequest("/users/me", {
        method: "PATCH",
        body: payload,
      });

      if (!response?.profile) {
        throw new Error(
          "Server থেকে updated profile পাওয়া যায়নি।"
        );
      }

      databaseSaved = true;

      const updatedProfile = {
        ...profile,
        ...response.profile,
        photoUrl: response.profile.photoUrl ?? photoUrl,
      };

      // ----------------------------------
      // STEP 3: REACT QUERY UPDATE
      // ----------------------------------

      queryClient.setQueryData(
        queryKey,
        updatedProfile
      );

      void queryClient.invalidateQueries({
        queryKey: [
          "checkout-shipping-profile",
          userUid,
        ],
      });

      // ----------------------------------
      // STEP 4: FIREBASE UPDATE
      // ----------------------------------

      await syncFirebase({
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoUrl || null,
      });

      // ----------------------------------
      // STEP 5: SUCCESS
      // ----------------------------------

      clearDraft(updatedProfile);

      toast("প্রোফাইল সফলভাবে আপডেট হয়েছে!");

    } catch (err) {
      console.error("Profile update error:", err);

      const message = databaseSaved
        ? "MongoDB আপডেট হয়েছে, কিন্তু Firebase Sync হয়নি। আবার Save Changes দিন।"
        : err?.message || "Profile update failed";

      setError(message);

      toast(message, "error");

      // Important:
      // Editing remains active on failure.
      // Selected photo and form are preserved.

    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  // ======================================
  // DISPLAY VALUES
  // ======================================

  const displayName = editing
    ? form.displayName
    : profile.displayName;

  const avatarUrl = editing
    ? removePhoto
      ? ""
      : previewUrl || profile.photoUrl || ""
    : profile.photoUrl || "";

  const hasAddress = Boolean(
    profile.division &&
    profile.district &&
    profile.address
  );

  const deliveryFee =
    profile.district === "নরসিংদী" ? 80 : 130;

  // ======================================
  // UI
  // ======================================

  return (
    <main className="page-bg min-h-screen pb-12">
      <div className="page-container pt-6 sm:pt-9">

        {/* BREADCRUMB */}

        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex items-center gap-2 text-xs text-muted"
        >
          <Link
            to="/"
            className="hover:text-secondary"
          >
            হোম
          </Link>

          <span>/</span>

          <span className="font-semibold text-secondary">
            {isAdminView
              ? "User Profile"
              : "আমার প্রোফাইল"}
          </span>
        </nav>

        {/* PAGE HEADING */}

        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-secondary">
              <ShieldCheck size={14} />
              {isAdminView
                ? "ACCOUNT DETAILS"
                : "MY ACCOUNT"}
            </p>

            <h1 className="text-2xl font-bold text-primary sm:text-3xl">
              {isAdminView
                ? "ইউজার প্রোফাইল"
                : "আমার প্রোফাইল"}
            </h1>

            <p className="mt-2 text-xs text-muted sm:text-sm">
              {isAdminView
                ? "ইউজারের ব্যক্তিগত ও ডেলিভারি তথ্য দেখুন।"
                : "আপনার ব্যক্তিগত তথ্য ও ডেলিভারি ঠিকানা পরিচালনা করুন।"}
            </p>
          </div>

          {!isAdminView && !editing && (
            <button
              type="button"
              onClick={startEditing}
              className="btn-outline-brand inline-flex items-center gap-2 rounded-xl  px-4 py-3 text-sm font-semibold transition "
            >
              <Edit3 size={15} />
              Edit Profile
            </button>
          )}

          {editing && (
            <span className="rounded-full border border-secondary/20 bg-secondary/5 px-3 py-2 text-xs font-semibold text-secondary">
              Editing Mode
            </span>
          )}
        </div>

        {/* ADMIN NOTICE */}

        {isAdminView && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-secondary/15 bg-secondary/5 p-4 text-xs leading-5 text-muted">
            <LockKeyhole
              size={17}
              className="shrink-0 text-secondary"
            />
            Admin অন্য ইউজারের প্রোফাইল দেখতে পারবেন,
            পরিবর্তন করতে পারবেন না।
          </div>
        )}

        {/* PROFILE HEADER */}

        <section className="section-card overflow-hidden">

          {/* BANNER */}

          <div className="relative h-40 overflow-hidden bg-[#310039] sm:h-44">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-repeat opacity-30"
              style={{
                backgroundImage: `url("${GIFT_PATTERN}")`,
                backgroundSize: "210px 170px",
                backgroundPosition: "center",
              }}
            />

            <div className="relative flex items-start justify-between gap-3 px-5 pt-5 sm:px-7 sm:pt-6">

              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-[#FFE16D]">
                  শখবিলাস
                </p>

                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-white">
                  প্রিয় মুহূর্তগুলো হোক আরও স্মরণীয়
                </p>
              </div>

              <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[10px] font-semibold text-white">
                MEMBER PROFILE
              </span>

            </div>
          </div>

          {/* AVATAR + IMAGE UPLOAD */}

          <div className="relative px-4 pb-6 sm:px-7">

            <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">

              <div className="flex min-w-0 flex-wrap items-end gap-3 sm:gap-4">

                <Avatar
                  src={avatarUrl}
                  name={displayName}
                />

                {/* UPLOAD BUTTON */}

                {editing && canEdit && (
                  <div className="mb-1 flex flex-col items-start gap-2">

                    <label className="relative inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-secondary/20 bg-white px-4 py-2.5 text-xs font-semibold text-secondary shadow-sm transition hover:border-secondary">

                      <Camera size={16} />

                      {photoFile
                        ? "Change Photo"
                        : "Upload Photo"}

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-label="Choose profile photo"
                        disabled={saving}
                        onChange={handlePhotoChange}
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      />
                    </label>

                   

                    {/* PHOTO REMOVE / CANCEL */}

                    {(photoFile || removePhoto) && (
                      <button
                        type="button"
                        onClick={cancelPhotoChange}
                        disabled={saving}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline text-error"
                      >
                        <X size={13} />
                        Cancel Photo Change
                      </button>
                    )}

                    {!removePhoto &&
                      !photoFile &&
                      !!profile.photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={saving}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 size={13} />
                          Remove Photo
                        </button>
                      )}

                    {(photoFile || removePhoto) && (
                      <span className="text-[10px] font-medium text-emerald-700">
                        Save Changes দিলে ছবি আপডেট হবে।
                      </span>
                    )}

                  </div>
                )}
              </div>

              {/* ROLE AND STATUS */}

              <div className="mb-1 flex flex-wrap gap-2">

                <span className="rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1.5 text-[11px] font-semibold capitalize text-secondary">
                  {profile.role || "customer"}
                </span>

                <span
                  className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize ${
                    profile.status === "active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {profile.status || "—"}
                </span>

              </div>
            </div>

            {/* NAME AND EMAIL */}

            <h2 className="mt-4 break-words text-xl font-bold text-primary sm:text-2xl">
              {displayName || "Unnamed User"}
            </h2>

            <p className="mt-2 flex items-center gap-2 break-all text-xs text-muted">
              <Mail size={14} className="shrink-0" />
              {profile.email}
            </p>

            {/* ACCOUNT META */}

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-base-300/70 pt-4 text-xs text-muted">

              <span className="inline-flex items-center gap-2">
                <CalendarDays
                  size={15}
                  className="text-secondary"
                />
                Joined {formatDate(profile.createdAt)}
              </span>

              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  size={15}
                  className="text-secondary"
                />

                {profile.role === "admin"
                  ? "Administrator Account"
                  : "Registered Customer"}
              </span>

            </div>
          </div>
        </section>

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs leading-6 text-red-700"
          >
            <CircleAlert
              size={17}
              className="shrink-0"
            />

            {error}
          </div>
        )}

        {/* PROFILE FORM */}

        <form
          onSubmit={handleSave}
          noValidate
          className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12"
        >

          {/* PERSONAL INFORMATION */}

          <section className="section-card min-w-0 p-4 sm:p-6 lg:col-span-7">

            <SectionHeader
              icon={UserRound}
              title="ব্যক্তিগত তথ্য"
              subtitle="Personal Information"
            />

            {!editing ? (
              <div className="grid gap-3 sm:grid-cols-2">

                <InfoItem
                  icon={UserRound}
                  label="পূর্ণ নাম"
                  value={profile.displayName}
                />

                <InfoItem
                  icon={Phone}
                  label="মোবাইল নম্বর"
                  value={profile.phone}
                />

                <div className="sm:col-span-2">
                  <InfoItem
                    icon={Mail}
                    label="ইমেইল অ্যাড্রেস"
                    value={profile.email}
                  />
                </div>

                <p className="flex items-start gap-2 rounded-xl bg-secondary/5 p-3.5 text-xs leading-5 text-muted sm:col-span-2">
                  <LockKeyhole
                    size={15}
                    className="shrink-0 text-secondary"
                  />
                  Email Address পরিবর্তন করা যাবে না।
                </p>

              </div>
            ) : (
              <div className="space-y-4">

                {/* NAME */}

                <FormField
                  icon={UserRound}
                  title="পূর্ণ নাম"
                >
                  <input
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={form.displayName}
                    disabled={saving}
                    onChange={(e) =>
                      updateField(
                        "displayName",
                        e.target.value
                      )
                    }
                    placeholder="আপনার সম্পূর্ণ নাম"
                    className={fieldClass}
                  />
                </FormField>

                {/* EMAIL */}

                <FormField
                  icon={Mail}
                  title="ইমেইল অ্যাড্রেস"
                  hint="Email Address পরিবর্তন করা যাবে না।"
                >
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      value={profile.email || ""}
                      className={`${fieldClass} pr-10`}
                    />

                    <LockKeyhole
                      size={15}
                      className="pointer-events-none absolute bottom-3.5 right-3.5 text-muted"
                    />
                  </div>
                </FormField>

                {/* PHONE */}

                <FormField
                  icon={Phone}
                  title="মোবাইল নম্বর"
                >
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={11}
                    value={form.phone}
                    disabled={saving}
                    onChange={(e) =>
                      updateField(
                        "phone",
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 11)
                      )
                    }
                    placeholder="01712345678"
                    className={fieldClass}
                  />
                </FormField>

              </div>
            )}
          </section>

          {/* DELIVERY ADDRESS */}

          <section className="section-card min-w-0 p-4 sm:p-6 lg:col-span-5">

            <SectionHeader
              icon={Truck}
              title="ডেলিভারি ঠিকানা"
              subtitle="Saved Shipping Address"
            />

            {!editing ? (
              hasAddress ? (
                <div className="space-y-4">

                  <div className="rounded-2xl border border-secondary/15 bg-secondary/5 p-4">

                    <div className="flex items-center gap-3">

                      <span className="flex size-10 items-center justify-center rounded-xl bg-white text-secondary">
                        <MapPin size={19} />
                      </span>

                      <div>
                        <p className="text-sm font-bold text-primary">
                          Default Delivery Address
                        </p>

                        <p className="mt-1 text-[11px] text-muted">
                          Checkout-এর জন্য সংরক্ষিত
                        </p>
                      </div>

                    </div>

                    <p className="mt-4 whitespace-pre-wrap break-words border-t border-secondary/10 pt-4 text-sm leading-7 text-primary">
                      {profile.address}
                    </p>

                    <p className="mt-2 text-xs font-semibold text-secondary">
                      {profile.district}, {profile.division}
                    </p>

                  </div>

                  <p className="flex items-start gap-3 rounded-xl bg-base-200/60 p-3.5 text-xs leading-6 text-muted">
                    <Truck
                      size={17}
                      className="shrink-0 text-secondary"
                    />

                    <span>
                      আনুমানিক ডেলিভারি চার্জ{" "}
                      <strong className="text-secondary">
                        ৳{deliveryFee}
                      </strong>
                      । চূড়ান্ত চার্জ Checkout-এ নিশ্চিত হবে।
                    </span>
                  </p>

                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-secondary/25 bg-secondary/5 p-7 text-center">

                  <MapPin
                    size={25}
                    className="mx-auto text-secondary"
                  />

                  <p className="mt-3 text-sm font-bold text-primary">
                    ডেলিভারি ঠিকানা নেই
                  </p>

                  <p className="mt-2 text-xs leading-6 text-muted">
                    ঠিকানা Save করলে পরবর্তী Checkout-এ
                    ব্যবহার করতে পারবেন।
                  </p>

                  {!isAdminView && (
                    <button
                      type="button"
                      onClick={startEditing}
                      className="mt-3 text-xs font-bold text-secondary hover:underline"
                    >
                      ঠিকানা যোগ করুন
                    </button>
                  )}

                </div>
              )
            ) : (
              <div className="space-y-4">

                <p className="rounded-xl bg-secondary/5 p-3 text-xs leading-5 text-muted">
                  এখানে দেওয়া ঠিকানাটি আপনার Default
                  Delivery Address হিসেবে Save হবে।
                </p>

                {/* DIVISION */}

                <FormField
                  icon={MapPin}
                  title="বিভাগ"
                >
                  <select
                    value={form.division}
                    disabled={saving}
                    className={fieldClass}
                    onChange={(e) => {
                      const current = draftRef.current;

                      updateDraft({
                        ...current,
                        form: {
                          ...current.form,
                          division: e.target.value,
                          district: "",
                        },
                      });

                      setError("");
                    }}
                  >
                    <option value="">
                      বিভাগ নির্বাচন করুন
                    </option>

                    {Object.keys(DIVISIONS).map(
                      (division) => (
                        <option
                          key={division}
                          value={division}
                        >
                          {division}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* DISTRICT */}

                <FormField
                  icon={MapPin}
                  title="জেলা"
                >
                  <select
                    value={form.district}
                    disabled={!form.division || saving}
                    className={fieldClass}
                    onChange={(e) =>
                      updateField(
                        "district",
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      জেলা নির্বাচন করুন
                    </option>

                    {(DIVISIONS[form.division] || []).map(
                      (district) => (
                        <option
                          key={district}
                          value={district}
                        >
                          {district}
                        </option>
                      )
                    )}
                  </select>
                </FormField>

                {/* FULL ADDRESS */}

                <FormField
                  icon={MapPin}
                  title="সম্পূর্ণ ডেলিভারি ঠিকানা"
                  hint="বাড়ি, রোড, এলাকা, থানা ও বিস্তারিত ঠিকানা লিখুন।"
                >
                  <textarea
                    rows={5}
                    maxLength={500}
                    value={form.address}
                    disabled={saving}
                    onChange={(e) =>
                      updateField(
                        "address",
                        e.target.value
                      )
                    }
                    placeholder="বাড়ি নং, রোড, এলাকা, থানা..."
                    className={`${fieldClass} resize-y`}
                  />
                </FormField>

              </div>
            )}
          </section>

          {/* SAVE AND CANCEL */}

          {editing && canEdit && (
            <div className="lg:col-span-12">

              <div className="section-card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">

                <p className="flex max-w-md items-start gap-2 text-xs leading-5 text-muted">
                  <ShieldCheck
                    size={17}
                    className="mt-0.5 shrink-0 text-secondary"
                  />

                  Save করলে ছবি, ব্যক্তিগত তথ্য ও
                  ডেলিভারি ঠিকানা আপডেট হবে।
                </p>

                <div className="flex w-full gap-2 sm:w-auto">

                  {/* CANCEL */}

                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-base-300 bg-white px-5 py-3 text-xs font-semibold text-primary hover:border-secondary disabled:opacity-50 sm:flex-none"
                  >
                    <X size={15} />
                    Cancel
                  </button>

                  {/* SAVE CHANGES */}

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-xs font-semibold text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                  >
                    {saving ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={16} />
                    )}

                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>
              </div>
            </div>
          )}

        </form>

        {/* BACK LINK */}

        <Link
          to={
            isAdminView || profile.role === "admin"
              ? "/admin"
              : "/"
          }
          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-secondary hover:text-primary"
        >
          <ArrowLeft size={16} />

          {isAdminView || profile.role === "admin"
            ? "Dashboard-এ ফিরে যান"
            : "হোমে ফিরে যান"}
        </Link>

      </div>
    </main>
  );
}

// ========================================
// MAIN PROFILE PAGE
// ========================================

export default function ProfilePage() {
  const { id } = useParams();

  const {
    user,
    loading,
    role,
    roleLoading,
    accountStatus,
    updateUserProfile,
  } = useContext(AuthContext);

  const isAdminView = Boolean(id);

  const authReady = !loading && !roleLoading;

  const canAccess =
    !!user?.uid &&
    accountStatus === "active" &&
    ["customer", "admin"].includes(role) &&
    (!isAdminView || role === "admin");

  // Separate React Query cache per profile.
  const queryKey = [
    "profile",
    user?.uid || null,
    isAdminView ? `admin:${id}` : "self",
  ];

  const profileQuery = useQuery({
    queryKey,

    enabled: authReady && canAccess,

    queryFn: async ({ signal }) => {
      const path = isAdminView
        ? `/admin/users/${encodeURIComponent(id)}/profile`
        : "/users/me";

      const response = await profileRequest(path, {
        signal,
      });

      return response.profile;
    },

    staleTime: 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // ======================================
  // AUTH LOADING
  // ======================================

  if (!authReady) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={29}
            className="mx-auto animate-spin text-secondary"
          />

          <p className="mt-3 text-sm text-muted">
            প্রোফাইল লোড হচ্ছে...
          </p>
        </div>
      </main>
    );
  }

  // ======================================
  // PERMISSION CHECK
  // ======================================

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  // ======================================
  // DATA LOADING
  // ======================================

  if (profileQuery.isPending && !profileQuery.data) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            size={29}
            className="mx-auto animate-spin text-secondary"
          />

          <p className="mt-3 text-sm text-muted">
            প্রোফাইল লোড হচ্ছে...
          </p>
        </div>
      </main>
    );
  }

  // ======================================
  // ERROR
  // ======================================

  if (!profileQuery.data) {
    return (
      <main className="page-bg flex min-h-[65vh] items-center justify-center px-4">

        <div className="section-card w-full max-w-md p-7 text-center">

          <CircleAlert
            size={32}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-lg font-bold text-primary">
            প্রোফাইল লোড করা যায়নি
          </h2>

          <p className="mt-2 text-xs text-muted">
            {profileQuery.error?.message ||
              "প্রোফাইল পাওয়া যায়নি।"}
          </p>

          <button
            type="button"
            onClick={() => profileQuery.refetch()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-xs font-semibold text-white"
          >
            <RefreshCw size={15} />
            আবার চেষ্টা করুন
          </button>

        </div>
      </main>
    );
  }

  // ======================================
  // PROFILE VIEW
  // ======================================

  return (
    <ProfileContent
      key={
        isAdminView
          ? `admin-view:${user.uid}:${id}`
          : `self:${user.uid}`
      }
      profile={profileQuery.data}
      userUid={user.uid}
      queryKey={queryKey}
      isAdminView={isAdminView}
      updateUserProfile={updateUserProfile}
    />
  );
}
