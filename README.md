# শখবিলাস | Sokhbilash
### Premium Personalized Gifts & E-commerce Platform

> **Brand tagline:** শখের উপহার, মনের অনুভূতি

Sokhbilash is a Bangladeshi personalized-gift e-commerce project focused on thoughtful gifting, customization, curated gift boxes, and a polished customer shopping experience. The project is planned as a real, API-ready application—not merely a landing page or a disposable demo.

This README is the **single source of project context** for design and development work. Keep it updated as decisions change.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Project Status and Scope](#2-project-status-and-scope)
- [3. Brand and Design System](#3-brand-and-design-system)
- [4. Technology Direction](#4-technology-direction)
- [5. Global Website Layout](#5-global-website-layout)
- [6. Storefront Pages](#6-storefront-pages)
- [7. Product Catalog](#7-product-catalog)
- [8. Product Details and Personalization](#8-product-details-and-personalization)
- [9. Gift Box Builder](#9-gift-box-builder)
- [10. Cart and Wishlist](#10-cart-and-wishlist)
- [11. Checkout and Payment Rules](#11-checkout-and-payment-rules)
- [12. Customer Account and Profile](#12-customer-account-and-profile)
- [13. Order Status Timeline](#13-order-status-timeline)
- [14. Informational Pages](#14-informational-pages)
- [15. Admin Panel](#15-admin-panel)
- [16. Data Models](#16-data-models)
- [17. Architecture and Utilities](#17-architecture-and-utilities)
- [18. Responsive Design and Accessibility](#18-responsive-design-and-accessibility)
- [19. API and Backend Readiness](#19-api-and-backend-readiness)
- [20. Development Roadmap](#20-development-roadmap)
- [21. Quality Checklist](#21-quality-checklist)
- [22. AI Assistant Handoff Context](#22-ai-assistant-handoff-context)

---

## 1. Project Overview

| Item | Details |
|---|---|
| Brand name | **Sokhbilash (শখবিলাস)** |
| Tagline | শখের উপহার, মনের অনুভূতি |
| Market | Bangladesh |
| Business | Personalized gifts and e-commerce |
| Currency | Bangladeshi Taka (BDT / ৳) |
| Current design tool | Stitch AI |
| Planned frontend | React + TypeScript + Tailwind CSS |
| Routing | React Router or equivalent |
| Icon system | Lucide icons |
| Future direction | API-ready frontend with real backend integrations |

### Product types

The store will offer personalized photo frames, Nikah gifts, customized mugs, clothing gift combos, bouquets, chocolates, gift hampers, Islamic gifts, and custom gift boxes.

### Core goals

- Create a premium, consistent, responsive shopping experience.
- Design every required customer-facing and admin page.
- Support product customization and grouped gift-box purchases.
- Provide a clear checkout and payment-policy experience.
- Show order progress within customer account/order details.
- Prepare the UI and frontend architecture for future APIs.
- Avoid claiming that unconnected services are already operational.

---

## 2. Project Status and Scope

The current stage is **UI/UX design with Stitch AI**. React/TypeScript implementation and real API/backend integration are separate subsequent stages.

### Important decisions

1. The brand is **Sokhbilash (শখবিলাস)**, not Momento.
2. Use burgundy and warm ivory as the two brand colors.
3. Design this as a real project, not a generic demo storefront.
4. Product cards must show an original price with a strikethrough and a prominent offer price.
5. Show a discount percentage when applicable.
6. Original price and offer price must be separate data fields.
7. Customer profile/account pages are required.
8. A comprehensive admin panel is required.
9. The order progress timeline belongs inside **My Orders** and **Order Details**.
10. **Do not create a separate Track Order page or navigation item.**
11. No major page or flow should be silently omitted.
12. Design/API readiness does not mean that a real API is already connected.
13. Customer photographs must not be stored as publicly accessible URLs.
14. Authentication, payments, WhatsApp messaging, and notifications must not be described as connected until actually integrated.

---

## 3. Brand and Design System

### Brand colors

| Role | Color | Hex |
|---|---|---|
| Primary | Burgundy | `#6E2438` |
| Secondary | Warm Ivory | `#FAF7F2` |

Use white, charcoal, and neutral greys for readable text, surfaces, and borders. Do not add unrelated accent colors, neon colors, or excessive gradients.

### Visual direction

- Premium, minimalist gift boutique.
- Warm, emotional, elegant, and trustworthy.
- Generous whitespace and editorial typography.
- High-quality, consistently cropped product photography.
- Subtle shadows and soft borders.
- Refined hover and transition states.
- Consistent spacing and reusable components.
- Mobile-first, responsive layouts.

### Typography

- Bengali: Noto Sans Bengali or a comparable Bengali-friendly font.
- English: Inter or a comparable modern sans-serif.
- Customer-facing content should primarily be natural Bangla.
- Prices should use Bangladeshi formatting, such as `৳350` and `৳1,070`.

---

## 4. Technology Direction

### Planned frontend stack

- React
- TypeScript
- Tailwind CSS
- React Router or equivalent
- Lucide icons
- Existing project-compatible UI libraries
- React Context, Zustand, or an equivalent lightweight state solution where appropriate

### Engineering principles

- Reusable components and feature modules.
- Typed product, cart, customer, order, payment, and settings models.
- Separation of UI, business calculations, and data/service layers.
- Clear API boundaries for future integration.
- Useful loading, empty, success, validation-error, network-error, and permission-denied states.
- Reuse the existing project setup when implementation begins; inspect it before changing dependencies or architecture.

---

## 5. Global Website Layout

### Announcement bar

Example:

> প্রিয় মানুষের জন্য বেছে নিন মনের মতো উপহার

The announcement text should be configurable from admin settings.

### Desktop header

- Sokhbilash logo and Bangla brand name
- Home
- Shop
- Categories
- Occasions
- Build Your Gift Box
- Offers
- Search
- Wishlist with item count
- Cart with item count
- Account/Profile

### Navigation behavior

- Category mega menu
- Occasion dropdown
- Search overlay with suggestions
- Mobile hamburger menu
- Mobile bottom navigation: Home, Categories, Gift Box, Wishlist, Cart
- Account menu: Profile, My Orders, Addresses, Wishlist, Settings, Logout
- Responsive footer
- Toast notifications, confirmation dialogs, breadcrumbs, loading skeletons, and empty states

**Track Order must not appear as a separate page or menu item.**

---

## 6. Storefront Pages

Every page below must be designed and later implemented.

### Homepage

- Premium hero banner
- Shop by category
- Shop by occasion
- Bestselling products
- Personalized gifts
- Gift Box Builder promotion
- Offers and discounts
- Curated collections
- How it works
- Customer reviews
- Newsletter subscription
- Footer

**Hero headline:** শখের উপহার, মনের অনুভূতি

**Supporting copy:** প্রিয় মানুষের বিশেষ দিনটিকে আরও স্মরণীয় করে তুলুন আপনার পছন্দের উপহারে।

**Primary CTA:** সব উপহার দেখুন  
**Secondary CTA:** নিজের গিফট বক্স তৈরি করুন

### Shopping pages

- [ ] All Products / Shop
- [ ] Category listing
- [ ] Occasion listing
- [ ] Offers and discounted products
- [ ] Search results
- [ ] Gift collections
- [ ] Product details
- [ ] Personalized product customization
- [ ] Wishlist
- [ ] Cart
- [ ] Gift Box Builder

### Product listing features

- Search by product name
- Category and occasion filters
- Minimum and maximum price
- Availability filter
- Discount-only filter
- Featured, newest, price low-to-high, and price high-to-low sorting
- Grid/list toggle
- Product count
- Clear filters
- Pagination or load more
- Responsive mobile filter drawer

Filters must actually change the displayed products in the implemented application.

---

## 7. Product Catalog

The following catalog is initial content. **Prices are illustrative until the business confirms real pricing.**

### Photo Frames & Nikah Gifts

| Product | Illustrative price |
|---|---:|
| Customized Couple Photo Frame | ৳890 |
| LED Photo Frame | ৳1,290 |
| PVC Zigzag Photo Frame | ৳750 |
| Magic Mirror Frame | ৳1,100 |
| Nikah Mirror | ৳1,500 |
| Nikah Booklet | ৳990 |

### Personalized Gifts

| Product | Illustrative price |
|---|---:|
| Custom Mug | ৳350 |
| Personalized T-shirt | ৳650 |
| Customized Keyring | ৳180 |
| Personalized Cushion | ৳550 |
| Customized Water Bottle | ৳450 |
| Personalized Diary | ৳420 |

### Birthday & Surprise Gifts

| Product | Illustrative price |
|---|---:|
| Birthday Gift Box | ৳1,250 |
| Chocolate Gift Box | ৳450 |
| Teddy Bear | ৳390 |
| Balloon Set | ৳250 |
| Birthday Hamper | ৳1,490 |
| Customized Birthday Card | ৳120 |

### Flowers & Bouquets

| Product | Illustrative price |
|---|---:|
| Rose Bouquet | ৳650 |
| Chocolate Bouquet | ৳850 |
| Money Bouquet | ৳1,200 |
| Customized Name Bouquet | ৳950 |

### Couple & Romantic Gifts

| Product | Illustrative price |
|---|---:|
| Couple Gift Set | ৳1,450 |
| Matching Couple Mugs | ৳650 |
| Romantic Memory Box | ৳990 |

### Clothing & Gift Combos

| Product | Illustrative price |
|---|---:|
| Panjabi Gift Combo | ৳1,850 |
| Saree Gift Combo | ৳2,450 |
| Couple Outfit Combo | ৳3,500 |

### Islamic Gifts

| Product | Illustrative price |
|---|---:|
| Islamic Calligraphy Frame | ৳890 |
| Ayatul Kursi Wall Art | ৳1,100 |
| Prayer Gift Set | ৳750 |

### Chocolates & Hampers

| Product | Illustrative price |
|---|---:|
| Premium Chocolate Hamper | ৳1,250 |
| Chocolate and Rose Set | ৳990 |

### Required product fields

Each product should have:

- Unique ID and slug
- Name and SKU
- Category and occasion tags
- Description
- Original price and offer price as separate numeric fields
- Stock quantity
- Featured and bestseller flags
- Image gallery
- Customization settings
- Product type: `photo_frame` or `standard`
- `allowGiftBox` flag
- Availability status

Cards should show the original price crossed out, offer price prominently, and a discount badge when applicable. Never represent an unverified offer as a confirmed real-world discount.

---

## 8. Product Details and Personalization

Every product details page should contain:

- Image gallery
- Product name and description
- Original crossed-out price and offer price
- Discount percentage where applicable
- Stock/availability
- Quantity selector
- Customization form
- Wishlist and add-to-cart actions
- Delivery information
- Related products
- Reviews

### Customization fields

**Photo frames**
- Photo upload
- Customer name
- Partner/family names
- Date
- Frame size and color
- Printed message
- Special instructions

**Nikah mirror/booklet**
- Groom name
- Bride name
- Nikah date
- Design and size
- Custom text
- Special instructions

**Clothing combos**
- Clothing type
- Size and color
- Combo selection
- Gift packaging
- Special instructions

**Bouquets**
- Bouquet type and contents
- Quantity/size
- Preferred color
- Card message
- Packaging

**Mugs**
- Optional photo
- Name
- Design
- Mug type
- Printed message

**General personalized products**
- Name/custom text
- Design/color
- Optional image
- Message
- Special instructions

Required fields must validate before adding the item to the cart. Upload controls must support local preview, replace/remove actions, and file type/size validation. Customer photos must be treated as private user-selected files, not public remote URLs.

---

## 9. Gift Box Builder

This is a core feature. Create a complete five-step flow.

**Page title:** নিজেই তৈরি করুন আপনার মনের মতো গিফট বক্স

### Step 1 — Choose occasion

- Birthday
- Anniversary
- Couple
- Nikah
- Islamic
- Parents
- Custom occasion

### Step 2 — Choose products

- Show active, in-stock products where `allowGiftBox = true`.
- Add and remove products.
- Increase/decrease quantities.
- Show unit prices and line totals.
- Display a compact selected-product summary.
- Calculate the subtotal dynamically.

### Step 3 — Choose packaging

- Standard packaging — ৳0
- Premium wrapping — ৳150
- Luxury gift box — ৳250

### Step 4 — Personalize

- Recipient name
- Card message
- Special instructions
- Optional budget

### Step 5 — Review

Show occasion, selected products and quantities, product subtotal, packaging, discount, estimated total, budget comparison, and validation messages.

### Calculation rules

```text
Product subtotal = sum(unit price × quantity)

Gift box total = product subtotal + packaging charge − discount
```

- Never allow a negative total.
- A budget is a target, not an automatic discount.
- Warn when the total exceeds the budget.
- Preserve products, quantities, customization, packaging, and messages in the cart bundle.
- Gift boxes and ordinary products must use the same cart and checkout.

### Required test scenario

- Custom Mug — ৳350
- Chocolate Gift Box — ৳450
- Customized Birthday Card — ৳120
- Premium packaging — ৳150
- Product subtotal including packaging — ৳1,070
- Illustrative 50% advance — ৳535
- Remaining merchandise balance — ৳535
- Delivery charge — separate

Do not hardcode this scenario's total in checkout. Calculate it from selected products and packaging.

---

## 10. Cart and Wishlist

### Cart

Support ordinary products and multiple gift box bundles together.

Show:

- Product image and name
- Customization summary
- Quantity controls
- Unit price and line total
- Remove action
- Gift box grouping and packaging
- Subtotal and discount
- Delivery charge state
- Estimated/final total

Different customizations of the same product must remain separate cart lines. Recalculate totals after quantity or selection changes.

Provide a useful empty-cart state. During the pre-backend stage, use appropriate local persistence for non-sensitive cart data.

### Wishlist

- Add/remove products
- Wishlist count in navigation
- Persistence through refresh
- Empty state with return-to-shopping CTA

---

## 11. Checkout and Payment Rules

Guest checkout is mandatory. Customers should not need an account to place an order.

### Step 1 — Customer details

Required:
- Full name
- Bangladeshi phone number
- Delivery address
- District/city
- Area

Optional:
- Email
- Delivery instructions
- Gift recipient name

### Step 2 — Delivery and review

- Delivery area selection
- Configurable delivery charge
- Products and customization summary
- Packaging and discounts
- Estimated/final total
- Delivery-charge confirmation state

If the delivery charge is pending, label the amount as estimated and explain that the order is awaiting delivery-charge confirmation.

### Step 3 — Payment selection

- bKash
- Nagad
- Card
- Cash on Delivery (COD)

These are future integrations. Never request actual card details, wallet PINs, passwords, or OTPs in a prototype.

### Payment policy

**Photo-frame-only order**
- Advance payment is optional.
- COD is allowed without advance.
- If advance is selected, calculate 50% of the approved order base.

**Standard-product order**
- Require 50% advance under the configured policy.

**Mixed order**
- Calculate 50% of the entire approved merchandise base, not only the standard-product portion.

**Default advance base**

```text
Advance base = product subtotal after discount + packaging charge
```

Delivery charges are excluded from the advance base.

Keep the advance calculation in one reusable utility. Show remaining merchandise balance and delivery charge separately.

COD must not be recorded as a successful online payment. Simulated payment success must not be confused with real money collection.

### Order confirmation

Show:

- Order number
- Customer details
- Products and customizations
- Subtotal and discount
- Packaging
- Delivery charge
- Advance paid
- Remaining balance
- Payment method/status
- Order status
- View order details
- Continue shopping

Persist the order and clear the cart only after order creation succeeds.

---

## 12. Customer Account and Profile

Customer account pages are mandatory.

### Required pages

- Sign in
- Register
- Forgot password
- Reset password
- My Profile
- Edit Profile
- My Orders
- Order Details
- Saved Addresses
- Add/Edit Address
- Account Settings
- Change Password
- Notification Preferences
- Wishlist
- Logout confirmation

### Profile contents

- Customer name and avatar
- Email and phone
- Account navigation
- Recent orders and order history
- Saved addresses
- Wishlist shortcut
- Order status summaries

Authentication and account data must not be described as connected until a real authentication/backend service is implemented.

---

## 13. Order Status Timeline

There is **no separate Track Order page**.

Show the order timeline inside **My Orders** and **Order Details**.

1. অর্ডার গ্রহণ করা হয়েছে
2. অর্ডার নিশ্চিত করা হয়েছে
3. প্রস্তুত করা হচ্ছে
4. ডেলিভারির জন্য প্রস্তুত
5. পথে আছে
6. ডেলিভারি সম্পন্ন

Also support cancelled and refunded states. Payment status must remain separate from fulfillment status. When connected to APIs, the timeline must reflect the actual order status rather than being a static decoration.

---

## 14. Informational Pages

Create complete pages for:

- About Sokhbilash
- Contact Us
- FAQ
- Shipping and Delivery Policy
- Return and Refund Policy
- Privacy Policy
- Terms and Conditions
- Personalization and Photo Guidelines
- Help and Support

Do not leave blank or unfinished pages. Contact details must be configurable; do not invent a real address or verified phone number.

---

## 15. Admin Panel

**Route:** `/admin`

Create a separate, responsive admin interface with a sidebar, top bar, searchable tables, filters, forms, drawers, status badges, and confirmation dialogs.

The interface is intended for future real administration. Until authentication and authorization exist, do not claim that the admin route is secure or protected.

### Admin navigation

- Overview
- Orders
- Products
- Categories
- Occasions
- Gift Box Configuration
- Customers
- Discounts and Offers
- Reviews
- Delivery Settings
- Payment Settings
- Homepage Content
- Notifications
- Reports and Analytics
- Store Settings
- Admin Profile
- Audit Log

### Dashboard

Show total orders, pending orders, production orders, completed orders, gross sales, outstanding balances, bestselling products, low-stock alerts, sales charts, order-status charts, and recent orders.

### Order management

- Search and filter orders
- Order details and customer information
- Full delivery address
- Products and customizations
- Gift box details
- Uploaded photo previews
- Payment breakdown and delivery charge
- Admin notes and audit timeline

Actions to support in the future implementation:
- Update order status
- Set/revise delivery charge
- Record customer acceptance of quoted delivery charge
- Verify payment with confirmation
- Add admin notes
- Approve/reject customization photos
- Attach a photo submitted through a future WhatsApp workflow
- Cancel an order
- Record full/partial refunds

Sensitive actions must require confirmation and produce an audit record.

### Product management

- Product list
- Add/edit product
- Image management
- SKU
- Category and occasion
- Variants
- Original price and offer price
- Stock
- Active/inactive state
- Product type
- Gift Box eligibility
- Customization configuration
- Delete/archive with confirmation

Product changes must eventually affect storefront listings, details, search, and Gift Box Builder.

### Category and occasion management

List, add, edit, image selection, visibility, sorting, and delete confirmation.

### Gift Box administration

Packaging prices, eligible products, available occasions, bundle rules, discounts, and customer-facing builder preview.

### Customer management

Customer list, search/filter, details, contact information, order history, total purchases, addresses, internal notes, and account status. Never expose passwords.

### Discounts and offers

Create/edit offers, percentage/fixed discounts, start/end dates, eligible products/categories, coupon configuration, activation, and discount summary.

### Reviews

Review list, product reference, rating, review text, moderation state, and approve/hide/reject actions.

### Delivery settings

District/area, delivery charge, estimated delivery time, free-delivery threshold, rules/exclusions, and pending/quoted/accepted charge states.

### Payment settings

Available methods, advance percentage, photo-frame-only policy, mixed-order policy, manual verification, payment statuses, and refund records.

### Homepage/content management

Announcement bar, hero text/images, featured categories, bestsellers, collections, promotional banners, footer, and social links.

### Reports and analytics

Date filters, sales, order volume, payment breakdown, outstanding balances, product/category performance, and CSV export interface.

### Store settings

Store name/logo/tagline, brand colors, contact details, currency, delivery policy, packaging options, advance-payment rules, payment methods, SEO defaults, and store availability.

### Audit log

Record action, related order/product, timestamp, and before/after values when appropriate.

Any local prototype reset feature must require confirmation and restore initial data only when explicitly requested. Never reset data automatically on refresh.

---

## 16. Data Models

Use TypeScript interfaces for future API compatibility.

### Product type

```ts
type ProductType = "photo_frame" | "standard";
```

### Order status

```ts
type OrderStatus =
  | "pending"
  | "awaiting_payment"
  | "confirmed"
  | "in_production"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
```

### Payment status

```ts
type PaymentStatus =
  | "unpaid"
  | "pending"
  | "partially_paid"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";
```

### Cart item

```ts
interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productType: ProductType;
  unitPrice: number;
  quantity: number;
  customization: Record<string, unknown>;
  image?: string;
  bundleId?: string;
}
```

### Order

```ts
interface DemoOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  packagingAmount: number;
  deliveryCharge: number | null;
  grandTotal: number;
  advanceRequired: number;
  advancePaid: number;
  balanceDue: number;
  paymentMethod: "bkash" | "nagad" | "card" | "cod";
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  customerNote?: string;
  createdAt: string;
}
```

The `DemoOrder` name above is an initial example interface, not a requirement to keep production order types named “demo”. Extend and rename models appropriately as the actual implementation evolves.

Other entities: Product, Category, Occasion, ProductVariant, Customization, GiftBox, Customer, Address, OrderItem, Payment, Delivery, Discount, Review, StoreSettings, and AuditLog.

---

## 17. Architecture and Utilities

Suggested organization:

```text
src/
├── components/
│   ├── layout/
│   ├── products/
│   ├── cart/
│   ├── checkout/
│   ├── forms/
│   └── ui/
├── pages/
├── features/
│   ├── gift-box/
│   ├── orders/
│   └── admin/
├── data/
├── lib/
├── hooks/
├── services/
└── types/
```

Adapt this to the existing repository rather than forcing a rewrite.

Reusable utilities should include:

- BDT currency formatting
- Product price calculation
- Discount calculation
- Cart subtotal
- Gift Box totals
- Advance payment calculation
- Remaining balance
- Bangladeshi phone validation
- Order number generation
- Local persistence
- API service boundaries

Keep calculations centralized. Avoid giant components and duplicated business rules.

---

## 18. Responsive Design and Accessibility

Design and test around:

- Desktop: approximately 1440px
- Tablet: approximately 768px
- Mobile: approximately 390px

Requirements:

- No horizontal overflow
- Responsive tables and mobile order cards
- Collapsible admin sidebar
- Mobile filter drawers
- Touch-friendly buttons
- Readable Bengali typography
- Keyboard-accessible controls
- Visible focus states
- Accessible labels and meaningful image alt text
- Consistent BDT and date formatting
- Helpful Bangla validation messages
- Loading, empty, success, error, and permission-denied states

---

## 19. API and Backend Readiness

The current work can be design-only or frontend-only depending on the stage. Future integration may include:

- Product/catalog APIs
- Customer authentication and profile APIs
- Cart/checkout/order APIs
- Payment provider integration
- Delivery/shipping integration
- Image upload/storage
- Notifications
- Admin authorization
- Reports and analytics

Do not assume a backend, database, Supabase, payment gateway, authentication service, or API is connected unless it has actually been configured and verified.

Sensitive photographs and credentials must not be persisted in unsafe local storage. Local persistence can be used for suitable non-sensitive prototype state while APIs are unavailable.

---

## 20. Development Roadmap

Work in logical stages and keep the design system consistent.

### Stage 1 — Stitch AI design
- [ ] Storefront and global design system
- [ ] Product listing and product detail pages
- [ ] Customization and Gift Box Builder
- [ ] Cart and wishlist
- [ ] Checkout and payment states
- [ ] Customer account and profile
- [ ] Order details and timeline
- [ ] Informational pages
- [ ] Admin dashboard and order management
- [ ] Product/category/customer/offer administration
- [ ] Delivery/payment/settings/reports/audit screens

### Stage 2 — Frontend implementation
- [ ] Inspect existing project setup
- [ ] Implement routing and shared layouts
- [ ] Build reusable UI components
- [ ] Add product catalog and filters
- [ ] Add product customization
- [ ] Implement Gift Box Builder calculations
- [ ] Implement shared cart and wishlist
- [ ] Implement checkout and payment-policy calculations
- [ ] Implement customer profile and order timeline
- [ ] Implement admin screens and shared state
- [ ] Add suitable local persistence where appropriate
- [ ] Test responsive behavior and all major flows

### Stage 3 — Backend/API integration
- [ ] Confirm backend and database architecture
- [ ] Integrate real product/catalog APIs
- [ ] Integrate authentication and authorization
- [ ] Integrate cart, checkout, and order APIs
- [ ] Integrate secure image upload/storage
- [ ] Integrate payment providers
- [ ] Integrate delivery workflows
- [ ] Integrate notifications where required
- [ ] Protect admin routes and APIs
- [ ] Test errors, permissions, security, and edge cases

Do not claim a stage is complete until it has been implemented and checked.

---

## 21. Quality Checklist

Before calling the project complete, verify:

- [ ] Every navigation destination works.
- [ ] Homepage CTAs navigate correctly.
- [ ] Search, filters, sorting, and pagination work.
- [ ] Product details show correct pricing.
- [ ] Required customization fields validate.
- [ ] Photo upload preview and remove/replace work.
- [ ] Gift Box Builder dynamically calculates totals.
- [ ] Multiple bundles and ordinary products coexist in the cart.
- [ ] Quantity changes recalculate totals.
- [ ] Cart and wishlist persist appropriately.
- [ ] Guest checkout works without registration.
- [ ] Delivery charge and advance calculations are consistent.
- [ ] Photo-frame-only, standard, and mixed-order policies are applied correctly.
- [ ] Payment cancellation/failure/success states are handled.
- [ ] COD is not incorrectly marked as online payment.
- [ ] Orders appear in the customer profile and admin system.
- [ ] Order timeline reflects actual status.
- [ ] Admin product changes affect the storefront.
- [ ] Admin delivery settings affect checkout.
- [ ] Reset actions require confirmation.
- [ ] All pages work on desktop, tablet, and mobile.
- [ ] No broken images, dead buttons, blank pages, or runtime errors.
- [ ] No false claims of real payment, security, messaging, or API integration.

---

## 22. AI Assistant Handoff Context

When continuing this project in a new ChatGPT conversation, use this README as the project source of truth.

The assistant should:

1. Acknowledge the Sokhbilash requirements.
2. Identify the current stage: Stitch design, frontend implementation, code review/debugging, or API planning.
3. Inspect relevant existing files/designs before making implementation changes.
4. Explain the next step in simple Bangla.
5. Provide complete, usable code when requested.
6. Preserve existing working functionality.
7. Keep the brand colors, pricing display, customer profile, order timeline, and admin requirements consistent.
8. Never silently omit a required page or feature.
9. Never claim an integration works unless it has been implemented and verified.
10. Avoid restarting the project from scratch unless explicitly requested.

### First question for a new conversation

Ask which stage is currently in progress:

- Stitch AI screen design
- React/TypeScript frontend implementation
- Existing code review and debugging
- Future backend/API planning

Then continue from that stage rather than starting over.

---

**Project principle:** Complete coverage, consistent design, accurate business calculations, a usable customer journey, a comprehensive admin experience, and a clear path to real API integration.
