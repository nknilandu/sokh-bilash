
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Package,
  CheckCircle2,
  XCircle,
  Star,
  Pencil,
  Trash2,
  Eye,
  X,
  Save,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  Tag,
  Gift,
  ImageOff,
  Check,
  Layers3,
} from "lucide-react";

// ========================================
// DEMO DATA
// Replace with API responses
// ========================================

const demoCategories = [
  { _id: "cat1", name: "ফটো ফ্রেম ও স্মৃতির উপহার", slug: "photo-frames" },
  { _id: "cat2", name: "নিকাহনামা ও বিবাহের উপহার", slug: "nikah-wedding" },
  { _id: "cat3", name: "কাস্টমাইজড উপহার", slug: "personalized-gifts" },
  { _id: "cat4", name: "কম্বো গিফট", slug: "combo-gifts" },
  { _id: "cat5", name: "ফুল ও বুকে", slug: "flowers-bouquets" },
  { _id: "cat6", name: "চকলেট ও গিফট বক্স", slug: "chocolate-gift-boxes" },
  { _id: "cat7", name: "বার্থডে ও সারপ্রাইজ", slug: "birthday-surprise" },
  { _id: "cat8", name: "ইসলামিক উপহার", slug: "islamic-gifts" },
  { _id: "cat9", name: "রোমান্টিক ও কাপল গিফট", slug: "romantic-couple" },
  { _id: "cat10", name: "লাক্সারি গিফট হ্যাম্পার", slug: "luxury-hampers" },
];

const demoOccasions = [
  { _id: "occ1", name: "জন্মদিন", slug: "birthday" },
  { _id: "occ2", name: "বিবাহবার্ষিকী", slug: "anniversary" },
  { _id: "occ3", name: "বিয়ে ও নিকাহ", slug: "wedding-nikah" },
  { _id: "occ4", name: "ভালোবাসা ও রোমান্স", slug: "love-romance" },
  { _id: "occ5", name: "ইসলামিক উপলক্ষ", slug: "islamic" },
  { _id: "occ6", name: "বাবা-মা দিবস", slug: "parents-day" },
  { _id: "occ7", name: "অভিনন্দন ও অর্জন", slug: "congratulations" },
  { _id: "occ8", name: "সারপ্রাইজ ও বিশেষ মুহূর্ত", slug: "surprise" },
];

const demoProducts = [
  {
    _id: "p1",
    name: "Customized Premium Photo Frame",
    slug: "customized-premium-photo-frame",
    sku: "SKB-PF-001",
    description: "Premium personalized photo frame.",
    categoryId: "cat1",
    occasionIds: ["occ2", "occ4"],
    price: 1850,
    salePrice: 1650,
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=500&q=80",
    ],
    isAvailable: true,
    isFeatured: true,
    isCustomizable: true,
    createdAt: "2026-10-24T10:00:00",
  },
  {
    _id: "p2",
    name: "Luxury Birthday Gift Hamper",
    slug: "luxury-birthday-gift-hamper",
    sku: "SKB-LH-002",
    description: "Luxury gift hamper for birthdays.",
    categoryId: "cat10",
    occasionIds: ["occ1", "occ8"],
    price: 3250,
    salePrice: 0,
    images: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&q=80",
    ],
    isAvailable: true,
    isFeatured: true,
    isCustomizable: false,
    createdAt: "2026-10-23T10:00:00",
  },
  {
    _id: "p3",
    name: "Premium Nikah Nama Frame",
    slug: "premium-nikah-nama-frame",
    sku: "SKB-NK-003",
    description: "Beautiful personalized Nikah Nama frame.",
    categoryId: "cat2",
    occasionIds: ["occ3"],
    price: 2450,
    salePrice: 2250,
    images: [],
    isAvailable: false,
    isFeatured: false,
    isCustomizable: true,
    createdAt: "2026-10-22T10:00:00",
  },
  {
    _id: "p4",
    name: "Couple Saree Panjabi Combo",
    slug: "couple-saree-panjabi-combo",
    sku: "SKB-CB-004",
    description: "Matching couple saree and panjabi set.",
    categoryId: "cat4",
    occasionIds: ["occ2", "occ4"],
    price: 4950,
    salePrice: 4650,
    images: [],
    isAvailable: true,
    isFeatured: false,
    isCustomizable: false,
    createdAt: "2026-10-21T10:00:00",
  },
  {
    _id: "p5",
    name: "Premium Flower Bouquet",
    slug: "premium-flower-bouquet",
    sku: "SKB-FL-005",
    description: "Fresh flower bouquet.",
    categoryId: "cat5",
    occasionIds: ["occ1", "occ4"],
    price: 1450,
    salePrice: 0,
    images: [],
    isAvailable: true,
    isFeatured: true,
    isCustomizable: false,
    createdAt: "2026-10-20T10:00:00",
  },
];

const money = (amount) =>
  `৳${Number(amount || 0).toLocaleString("bn-BD")}`;

const formatDate = (value) =>
  new Date(value).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const makeSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const emptyForm = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  categoryId: "",
  occasionIds: [],
  price: "",
  salePrice: "",
  images: [""],
  isAvailable: true,
  isFeatured: false,
  isCustomizable: false,
};

// ========================================
// SMALL COMPONENTS
// ========================================

function StatCard({ title, subtitle, value, icon: Icon, style }) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-primary sm:text-sm">
            {title}
          </p>
          <p className="mt-1 text-[11px] text-muted">{subtitle}</p>
        </div>
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${style}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 text-2xl font-extrabold text-primary sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function AvailabilityBadge({ available }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        available
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {available ? (
        <CheckCircle2 size={12} />
      ) : (
        <XCircle size={12} />
      )}
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function ProductImage({ src, name }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-base-300 bg-base-200 sm:size-14">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageOff size={19} className="text-muted" />
      )}
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-primary">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-base-300 bg-base-200 px-3 py-2.5 text-xs text-primary outline-none focus:border-secondary focus:bg-white";

// ========================================
// ADD / EDIT PRODUCT MODAL
// ========================================

function ProductFormModal({
  product,
  categories,
  occasions,
  onClose,
  onSave,
}) {
  const isEdit = Boolean(product);

  const [form, setForm] = useState(
    product
      ? {
          ...product,
          price: String(product.price),
          salePrice: product.salePrice
            ? String(product.salePrice)
            : "",
          images: product.images.length
            ? [...product.images]
            : [""],
          occasionIds: [...product.occasionIds],
        }
      : { ...emptyForm, images: [""], occasionIds: [] }
  );

  const [error, setError] = useState("");

  const update = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleOccasion = (id) => {
    setForm((prev) => ({
      ...prev,
      occasionIds: prev.occasionIds.includes(id)
        ? prev.occasionIds.filter((item) => item !== id)
        : [...prev.occasionIds, id],
    }));
  };

  const updateImage = (index, value) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? value : img
      ),
    }));
  };

  const addImage = () =>
    update("images", [...form.images, ""]);

  const removeImage = (index) =>
    update(
      "images",
      form.images.filter((_, i) => i !== index)
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      return setError("Product name is required.");
    }

    if (!form.categoryId) {
      return setError("Please select a category.");
    }

    if (
      form.price === "" ||
      !Number.isFinite(Number(form.price)) ||
      Number(form.price) <= 0
    ) {
      return setError("Enter a valid regular price.");
    }

    const sale = form.salePrice === ""
      ? 0
      : Number(form.salePrice);

    if (
      !Number.isFinite(sale) ||
      sale < 0 ||
      (sale > 0 && sale >= Number(form.price))
    ) {
      return setError(
        "Sale price must be lower than regular price."
      );
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      slug: makeSlug(form.slug || form.name),
      sku: form.sku.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      salePrice: sale,
      images: form.images
        .map((url) => url.trim())
        .filter(Boolean),
    };

    onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/60 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-bold text-secondary">
              PRODUCT MANAGEMENT
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-primary">
              {isEdit ? "Edit Product" : "Add New Product"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg bg-base-200"
          >
            <X size={18} />
          </button>
        </div>

        <form
          id="product-form"
          onSubmit={handleSubmit}
          className="space-y-5 overflow-y-auto p-4 sm:p-6"
        >
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* BASIC INFORMATION */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
              <Package size={17} className="text-secondary" />
              Basic Information
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Product Name" required>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug:
                        !isEdit &&
                        (!prev.slug ||
                          prev.slug === makeSlug(prev.name))
                          ? makeSlug(name)
                          : prev.slug,
                    }));
                  }}
                  placeholder="Premium Photo Frame"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Product SKU">
                <input
                  value={form.sku}
                  onChange={(e) => update("sku", e.target.value)}
                  placeholder="SKB-PF-001"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Product Slug">
                <input
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="premium-photo-frame"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Category" required>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    update("categoryId", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category._id}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="mt-3">
              <FormField label="Product Description">
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    update("description", e.target.value)
                  }
                  rows={4}
                  placeholder="Write product description..."
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>

          {/* OCCASIONS */}
          <div className="border-t border-base-300 pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
              <Gift size={17} className="text-secondary" />
              Suitable Occasions
            </h3>

            <div className="grid gap-2 sm:grid-cols-2">
              {occasions.map((occasion) => (
                <label
                  key={occasion._id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${
                    form.occasionIds.includes(occasion._id)
                      ? "border-secondary bg-secondary/10 text-secondary"
                      : "border-base-300 bg-base-200 text-primary"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.occasionIds.includes(
                      occasion._id
                    )}
                    onChange={() =>
                      toggleOccasion(occasion._id)
                    }
                    className="checkbox checkbox-xs checkbox-secondary"
                  />
                  {occasion.name}
                </label>
              ))}
            </div>
          </div>

          {/* PRICING */}
          <div className="border-t border-base-300 pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
              <Tag size={17} className="text-secondary" />
              Product Pricing
            </h3>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Regular Price (৳)" required>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    update("price", e.target.value)
                  }
                  placeholder="1850"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Sale Price (৳)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) =>
                    update("salePrice", e.target.value)
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </FormField>
            </div>
          </div>

          {/* PRODUCT IMAGES */}
          <div className="border-t border-base-300 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-primary">
                <ImagePlus size={17} className="text-secondary" />
                Product Images
              </h3>

              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-1 text-xs font-bold text-secondary"
              >
                <Plus size={15} />
                Add Image
              </button>
            </div>

            <div className="space-y-2">
              {form.images.map((image, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) =>
                      updateImage(index, e.target.value)
                    }
                    placeholder="https://example.com/image.jpg"
                    className={`${inputClass} min-w-0 flex-1`}
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-2 text-[11px] text-muted">
              আপাতত image URL ব্যবহার করা হয়েছে।
              পরে image upload API integrate করা যাবে।
            </p>
          </div>

          {/* PRODUCT SETTINGS */}
          <div className="border-t border-base-300 pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary">
              <Layers3 size={17} className="text-secondary" />
              Product Settings
            </h3>

            <div className="space-y-3">
              {[
                {
                  key: "isAvailable",
                  title: "Available for Purchase",
                  description:
                    "Customer এই product অর্ডার করতে পারবে।",
                },
                {
                  key: "isFeatured",
                  title: "Featured Product",
                  description:
                    "Homepage featured products section-এ দেখানো যাবে।",
                },
                {
                  key: "isCustomizable",
                  title: "Customization Available",
                  description:
                    "Customer personalized details দিতে পারবে।",
                },
              ].map((setting) => (
                <label
                  key={setting.key}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-200 p-3"
                >
                  <div>
                    <p className="text-xs font-bold text-primary">
                      {setting.title}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {setting.description}
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    checked={form[setting.key]}
                    onChange={(e) =>
                      update(setting.key, e.target.checked)
                    }
                    className="toggle toggle-sm toggle-secondary"
                  />
                </label>
              ))}
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 border-t border-base-300 bg-white px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-base-300 px-4 py-2.5 text-xs font-bold text-primary"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="product-form"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white"
          >
            <Save size={16} />
            {isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// DELETE CONFIRMATION MODAL
// ========================================

function DeleteConfirmModal({ product, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-primary/60 p-4 backdrop-blur-sm">
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={24} />
        </div>

        <h2 className="text-lg font-extrabold text-primary">
          Delete Product?
        </h2>

        <p className="mt-2 text-xs leading-6 text-muted">
          আপনি কি নিশ্চিতভাবে{" "}
          <span className="font-bold text-primary">
            {product.name}
          </span>{" "}
          delete করতে চান? এই action undo করা যাবে না।
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-base-300 px-4 py-2.5 text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(product._id)}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            <Trash2 size={15} />
            Delete Product
          </button>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function AdminProductsPage() {
  // DEMO: replace with useQuery and Axios
  const [products, setProducts] = useState(demoProducts);
  const categories = demoCategories;
  const occasions = demoOccasions;

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  const [editingProduct, setEditingProduct] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const perPage = 8;

  const categoryMap = useMemo(
    () =>
      Object.fromEntries(
        categories.map((category) => [
          category._id,
          category.name,
        ])
      ),
    [categories]
  );

  const stats = useMemo(
    () => ({
      total: products.length,
      available: products.filter((p) => p.isAvailable).length,
      unavailable: products.filter((p) => !p.isAvailable).length,
      featured: products.filter((p) => p.isFeatured).length,
    }),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch =
          !term ||
          product.name.toLowerCase().includes(term) ||
          product.sku.toLowerCase().includes(term) ||
          product.slug.toLowerCase().includes(term);

        const matchesStatus =
          activeTab === "all" ||
          (activeTab === "available" && product.isAvailable) ||
          (activeTab === "unavailable" && !product.isAvailable) ||
          (activeTab === "featured" && product.isFeatured);

        const matchesCategory =
          categoryFilter === "all" ||
          product.categoryId === categoryFilter;

        return (
          matchesSearch && matchesStatus && matchesCategory
        );
      })
      .sort((a, b) => {
        if (sortBy === "price_low") {
          return (
            (a.salePrice || a.price) -
            (b.salePrice || b.price)
          );
        }

        if (sortBy === "price_high") {
          return (
            (b.salePrice || b.price) -
            (a.salePrice || a.price)
          );
        }

        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [products, search, activeTab, categoryFilter, sortBy]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / perPage)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const tabs = [
    { value: "all", label: "সব প্রোডাক্ট", count: stats.total },
    {
      value: "available",
      label: "Available",
      count: stats.available,
    },
    {
      value: "unavailable",
      label: "Unavailable",
      count: stats.unavailable,
    },
    {
      value: "featured",
      label: "Featured",
      count: stats.featured,
    },
  ];

  const openAdd = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  // DEMO ONLY: replace with POST/PATCH mutations
  const handleSave = (payload) => {
    if (editingProduct) {
      setProducts((prev) =>
        prev.map((product) =>
          product._id === editingProduct._id
            ? { ...product, ...payload }
            : product
        )
      );
    } else {
      setProducts((prev) => [
        {
          ...payload,
          _id: `local-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    setFormOpen(false);
    setEditingProduct(null);
  };

  // DEMO ONLY: replace with PATCH
  const toggleAvailability = (id) => {
    setProducts((prev) =>
      prev.map((product) =>
        product._id === id
          ? { ...product, isAvailable: !product.isAvailable }
          : product
      )
    );
  };

  // DEMO ONLY: replace with DELETE
  const handleDelete = (id) => {
    setProducts((prev) =>
      prev.filter((product) => product._id !== id)
    );
    setDeletingProduct(null);
  };

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setCategoryFilter("all");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-10">

      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-primary sm:text-2xl">
            প্রোডাক্ট ম্যানেজমেন্ট
          </h1>
          <p className="mt-1 text-xs text-muted">
            প্রোডাক্ট যোগ, সম্পাদনা, availability এবং featured
            products পরিচালনা করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-secondary"
        >
          <Plus size={17} />
          Add New Product
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="মোট প্রোডাক্ট"
          subtitle="Total Products"
          value={stats.total.toLocaleString("bn-BD")}
          icon={Package}
          style="bg-secondary/10 text-secondary"
        />

        <StatCard
          title="Available Products"
          subtitle="Ready for Purchase"
          value={stats.available.toLocaleString("bn-BD")}
          icon={CheckCircle2}
          style="bg-green-100 text-green-700"
        />

        <StatCard
          title="Unavailable Products"
          subtitle="Not Available"
          value={stats.unavailable.toLocaleString("bn-BD")}
          icon={XCircle}
          style="bg-red-100 text-red-700"
        />

        <StatCard
          title="Featured Products"
          subtitle="Homepage Highlights"
          value={stats.featured.toLocaleString("bn-BD")}
          icon={Star}
          style="bg-[#ffe16d]/50 text-primary"
        />
      </div>

      {/* PRODUCT LIST */}
      <div className="overflow-hidden rounded-2xl border border-base-300/70 bg-white shadow-sm">

        {/* SECTION TITLE */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 p-4 sm:p-5">
          <div>
            <h2 className="text-base font-extrabold text-primary">
              প্রোডাক্ট তালিকা
            </h2>
            <p className="mt-1 text-xs text-muted">
              All Products & Availability
            </p>
          </div>

          <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-xs font-bold text-secondary">
            {filteredProducts.length.toLocaleString("bn-BD")} Products
          </span>
        </div>

        {/* TABS */}
        <div className="flex gap-2 overflow-x-auto border-b border-base-300 px-4 py-3 sm:px-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                activeTab === tab.value
                  ? "bg-primary text-white"
                  : "bg-base-200 text-muted hover:bg-secondary/10"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === tab.value
                    ? "bg-white/20"
                    : "bg-white"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* FILTERS */}
        <div className="grid gap-3 border-b border-base-300 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px_170px_auto]">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-base-300 bg-base-200 px-3 focus-within:border-secondary">
            <Search size={17} className="text-muted" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, SKU or slug..."
              className="w-full min-w-0 bg-transparent text-xs text-primary outline-none"
            />
          </label>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="h-11 rounded-xl border border-base-300 bg-base-200 px-3 text-xs font-semibold text-primary outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A–Z</option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-base-300 px-4 text-xs font-bold text-secondary"
          >
            <RefreshCw size={15} />
            Reset
          </button>
        </div>

        {/* DESKTOP ZEBRA TABLE */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f3edf5] text-[11px] font-bold text-primary">
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Price</th>
                <th className="px-4 py-4">Availability</th>
                <th className="px-4 py-4">Featured</th>
                <th className="px-4 py-4">Created</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedProducts.map((product, index) => (
                <tr
                  key={product._id}
                  className={`border-b border-base-300/50 transition hover:bg-purple-50/70 ${
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-[#faf7fb]"
                  }`}
                >
                  {/* PRODUCT */}
                  <td className="px-4 py-4">
                    <div className="flex min-w-[220px] items-center gap-3">
                      <ProductImage
                        src={product.images?.[0]}
                        name={product.name}
                      />

                      <div className="min-w-0">
                        <p className="line-clamp-2 text-xs font-extrabold text-primary">
                          {product.name}
                        </p>
                        <p className="mt-1 text-[10px] text-muted">
                          SKU: {product.sku || "—"}
                        </p>

                        {product.isCustomizable && (
                          <span className="mt-1 inline-flex rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">
                            Customizable
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* CATEGORY */}
                  <td className="px-4 py-4 text-xs font-semibold text-primary">
                    {categoryMap[product.categoryId] || "—"}
                  </td>

                  {/* PRICE */}
                  <td className="px-4 py-4">
                    {product.salePrice > 0 ? (
                      <>
                        <p className="text-sm font-extrabold text-primary">
                          {money(product.salePrice)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted line-through">
                          {money(product.price)}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-extrabold text-primary">
                        {money(product.price)}
                      </p>
                    )}
                  </td>

                  {/* AVAILABILITY TOGGLE */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.isAvailable}
                        onChange={() =>
                          toggleAvailability(product._id)
                        }
                        className="toggle toggle-sm toggle-success"
                        aria-label={`Toggle availability for ${product.name}`}
                      />
                      <AvailabilityBadge
                        available={product.isAvailable}
                      />
                    </div>
                  </td>

                  {/* FEATURED */}
                  <td className="px-4 py-4">
                    {product.isFeatured ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#ffe16d]/40 px-2.5 py-1.5 text-[11px] font-bold text-primary">
                        <Star size={13} />
                        Featured
                      </span>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>

                  {/* DATE */}
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted">
                    {formatDate(product.createdAt)}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-[11px] font-bold text-secondary hover:bg-secondary hover:text-white"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingProduct(product)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-[11px] font-bold text-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="space-y-3 p-3 lg:hidden">
          {paginatedProducts.map((product) => (
            <div
              key={product._id}
              className="rounded-xl border border-base-300 bg-white p-3"
            >
              <div className="flex items-start gap-3">
                <ProductImage
                  src={product.images?.[0]}
                  name={product.name}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold text-primary">
                    {product.name}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {categoryMap[product.categoryId] || "—"}
                  </p>
                  <p className="mt-2 text-sm font-extrabold text-secondary">
                    {money(product.salePrice || product.price)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-base-200 p-3">
                <AvailabilityBadge
                  available={product.isAvailable}
                />

                <input
                  type="checkbox"
                  checked={product.isAvailable}
                  onChange={() =>
                    toggleAvailability(product._id)
                  }
                  className="toggle toggle-sm toggle-success"
                  aria-label={`Toggle availability for ${product.name}`}
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-secondary/10 px-3 py-2.5 text-xs font-bold text-secondary"
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingProduct(product)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* EMPTY STATE */}
        {paginatedProducts.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Package size={32} className="text-secondary" />
            <p className="mt-3 text-sm font-bold text-primary">
              কোনো প্রোডাক্ট পাওয়া যায়নি
            </p>
            <p className="mt-1 text-xs text-muted">
              Search বা filter পরিবর্তন করুন।
            </p>
          </div>
        )}

        {/* PAGINATION */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 p-4">
            <p className="text-xs text-muted">
              Showing{" "}
              {((currentPage - 1) * perPage + 1).toLocaleString("bn-BD")}
              {"–"}
              {Math.min(
                currentPage * perPage,
                filteredProducts.length
              ).toLocaleString("bn-BD")}
              {" of "}
              {filteredProducts.length.toLocaleString("bn-BD")}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setPage((prev) => Math.max(1, prev - 1))
                }
                className="flex size-9 items-center justify-center rounded-lg border border-base-300 disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setPage((prev) =>
                    Math.min(totalPages, prev + 1)
                  )
                }
                className="flex size-9 items-center justify-center rounded-lg border border-base-300 disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {formOpen && (
        <ProductFormModal
          key={editingProduct?._id || "new"}
          product={editingProduct}
          categories={categories}
          occasions={occasions}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}

      {/* DELETE MODAL */}
      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
