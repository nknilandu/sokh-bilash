import { useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

import LOGO_FILE from "../../assets/sokhbilash-nav-logo.png";

const BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-base-300 bg-white px-4 py-2.5 text-xs font-bold text-secondary transition hover:bg-base-200 disabled:cursor-not-allowed disabled:opacity-50";

// ==========================================
// SHARED HELPERS
// ==========================================

function safeName(value) {
  return (
    String(value || "order")
      .normalize("NFC")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^\.+|\.+$/g, "")
      .slice(0, 90) || "order"
  );
}

function safeImageUrl(value) {
  try {
    const url = new URL(String(value || ""));

    if (url.protocol !== "https:" || url.username || url.password) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  const characters = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => characters[character],
  );
}

function numeric(value) {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function cents(value) {
  return Math.round(numeric(value) * 100);
}

function money(value) {
  return `BDT ${numeric(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showError(title, text) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#76258A",
  });
}

const STATUS_LABELS = {
  pending: "Pending",
  verified: "Verified",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  rejected: "Rejected",
  cancelled: "Cancelled",
  partially_paid: "Partially paid",
  cod_pending: "COD pending",
  cod_collected: "COD collected",
};

const PAYMENT_METHODS = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  cod: "Cash on Delivery",
};

// ==========================================
// CUSTOMIZATION ZIP DOWNLOAD
// ==========================================

export function CustomizationZipButton({ item, orderNumber }) {
  const [progress, setProgress] = useState("");
  const downloadingRef = useRef(false);

  const photos = Array.isArray(item?.customization?.photos)
    ? item.customization.photos
    : [];

  async function handleDownload() {
    if (downloadingRef.current || !photos.length) return;

    downloadingRef.current = true;
    setProgress("প্রস্তুত হচ্ছে…");

    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      const extensions = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/avif": "avif",
        "image/heic": "heic",
        "image/heif": "heif",
        "image/bmp": "bmp",
        "image/tiff": "tiff",
        "image/svg+xml": "svg",
      };

      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];

        const url = safeImageUrl(
          typeof photo === "string" ? photo : photo?.url,
        );

        if (!url) {
          throw new Error(`ছবি ${index + 1}-এর URL সঠিক নয়।`);
        }

        setProgress(`ছবি ${index + 1}/${photos.length}…`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 45000);

        let blob;

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            credentials: "omit",
            referrerPolicy: "no-referrer",
          });

          if (!response.ok) {
            throw new Error(`ছবি ${index + 1} download করা যায়নি।`);
          }

          blob = await response.blob();
        } finally {
          clearTimeout(timeout);
        }

        if (!blob.size) {
          throw new Error(`ছবি ${index + 1} খালি পাওয়া গেছে।`);
        }

        const mime = blob.type.split(";")[0].trim().toLowerCase();

        if (
          mime &&
          !mime.startsWith("image/") &&
          mime !== "application/octet-stream"
        ) {
          throw new Error(`ছবি ${index + 1}-এর content সঠিক নয়।`);
        }

        const urlExtension = new URL(url).pathname.match(
          /\.(jpg|jpeg|png|webp|gif|avif|heic|heif|bmp|tiff?|svg)$/i,
        )?.[1];

        const extension = extensions[mime] || urlExtension || "bin";

        const originalName =
          typeof photo === "object" && photo ? photo.name : "";

        const name = safeName(
          String(originalName || "customer-photo").replace(/\.[^.]+$/, ""),
        );

        zip.file(
          `${String(index + 1).padStart(2, "0")}-${name}.${extension}`,
          blob,
        );
      }

      const archive = await zip.generateAsync(
        {
          type: "blob",
          compression: "STORE",
        },
        ({ percent }) => {
          setProgress(`ZIP তৈরি হচ্ছে ${Math.round(percent)}%`);
        },
      );

      const url = URL.createObjectURL(archive);
      const anchor = document.createElement("a");

      try {
        anchor.href = url;
        anchor.download =
          `${safeName(orderNumber)}-` +
          `${safeName(item?.sku || item?.name || "product")}-photos.zip`;

        document.body.appendChild(anchor);
        anchor.click();
      } finally {
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      await showError(
        "ছবি download হয়নি",
        error?.name === "AbortError"
          ? "Download করতে বেশি সময় লাগছে। আবার চেষ্টা করো।"
          : error instanceof TypeError
            ? "Network সমস্যা অথবা image server-এর CORS restriction আছে।"
            : error?.message || "আবার চেষ্টা করো।",
      );
    } finally {
      downloadingRef.current = false;
      setProgress("");
    }
  }

  if (!photos.length) return null;

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={Boolean(progress)}
      className={BUTTON_CLASS}
      aria-busy={Boolean(progress)}
    >
      {progress ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Download size={15} />
      )}

      <span>{progress || `সব ছবি ZIP download (${photos.length})`}</span>
    </button>
  );
}

// ==========================================
// INVOICE HTML
// ==========================================

function buildInvoiceHtml(order) {
  const e = escapeHtml;

  const logoUrl = new URL(LOGO_FILE, window.location.origin).href;

  const items = Array.isArray(order.items) ? order.items : [];
  const payment = order.payment || {};
  const shipping = order.shipping || {};
  const customer = order.customer || {};
  const courier = order.courier || {};

  const totalCents = cents(order.total);
  const receivedCents = cents(payment.verifiedAmount);
  const refundedCents = cents(payment.refundedAmount);

  const cancelled = ["cancelled", "rejected"].includes(order.status);

  const due = Math.max(0, totalCents - receivedCents) / 100;
  const excess = Math.max(0, receivedCents - totalCents) / 100;
  const refundRemaining = Math.max(0, receivedCents - refundedCents) / 100;

  function summaryRow(label, value, strong = false) {
    return `
      <div class="summary-row ${strong ? "strong" : ""}">
        <span>${e(label)}</span>
        <span>${e(value)}</span>
      </div>
    `;
  }

  const productRows = items
    .map((item, index) => {
      const quantity = numeric(item.quantity);
      const unitPrice = numeric(item.unitPrice ?? item.price);
      const lineTotal = numeric(item.lineTotal ?? unitPrice * quantity);
      const imageUrl = safeImageUrl(item.image);

      const custom = item.customization || {};

      const fields = [
        ["নাম", custom.name],
        ["তারিখ", custom.date || custom.dob],
        ["বার্তা", custom.message || custom.engraving],
        ["নোট", custom.note || custom.customNote],
      ].filter(([, value]) => Boolean(value));

      const options = Object.entries(item.selectedOptions || {})
        .filter(([, value]) => Boolean(value))
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join(" · ");

      const photoCount = Array.isArray(custom.photos)
        ? custom.photos.length
        : 0;

      // Separate full-width rows give long customization text room
      // and allow it to continue onto another printed page.
      const customRows = fields
        .map(
          ([label, value]) => `
      <tr class="custom-row">
        <td colspan="5">
          <div class="custom-field">
            <span class="custom-label">${e(label)}</span>
            <div class="custom-value">${e(value)}</div>
          </div>
        </td>
      </tr>
    `,
        )
        .join("");

      return `
      <tr class="product-row">
        <td class="item-index">${index + 1}</td>

        <td class="product-cell">
          <div class="product-layout">
            ${
              imageUrl
                ? `
                  <img
                    class="product-image"
                    src="${e(imageUrl)}"
                    alt="${e(item.name || "Product")}"
                    width="60"
                    height="60"
                    loading="eager"
                    referrerpolicy="no-referrer"
                  />
                `
                : `
                  <div class="product-image-placeholder">
                    No image
                  </div>
                `
            }

            <div class="product-details">
              <div class="product-name">
                ${e(item.name || "Product")}
              </div>

              ${item.sku ? `<div class="muted">SKU: ${e(item.sku)}</div>` : ""}

              ${
                item.variantTitle
                  ? `<div class="variant">${e(item.variantTitle)}</div>`
                  : ""
              }

              ${options ? `<div class="muted">${e(options)}</div>` : ""}

              <div class="muted">
                ${item.packaging === "premium" ? "Premium Box" : "Regular Box"}
              </div>

              ${
                photoCount
                  ? `<div class="muted">Customization photos: ${photoCount}</div>`
                  : ""
              }
            </div>
          </div>
        </td>

        <td class="number metric" data-label="Qty">
          ${e(quantity)}
        </td>

        <td class="number metric" data-label="Unit price">
          ${e(money(unitPrice))}
        </td>

        <td class="number metric" data-label="Amount">
          <b>${e(money(lineTotal))}</b>
        </td>
      </tr>

      ${
        fields.length
          ? `
        <tr class="custom-heading">
          <td colspan="5">
            কাস্টমাইজেশন · Item ${index + 1}
          </td>
        </tr>
        ${customRows}
      `
          : ""
      }
    `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${e(`Invoice-${order.orderNumber || order._id || "SokhBilash"}`)}</title>

  <style>
    :root {
      --primary: #310039;
      --secondary: #76258a;
      --border: #e8ddec;
      --muted: #76647b;
      --soft: #f8f5fa;
      --product-image-size: 60px;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: #eeeaf1;
      color: var(--primary);
      font-family: "Noto Sans Bengali", "Nirmala UI", Arial, sans-serif;
      font-size: 12px;
      line-height: 1.65;
    }

    .toolbar {
      width: min(100%, 210mm);
      margin: 18px auto;
      padding: 0 16px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .toolbar span {
      flex: 1 1 220px;
      min-width: 0;
    }

    button {
      border: 0;
      border-radius: 9px;
      padding: 12px 18px;
      background: var(--secondary);
      color: white;
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }

    button:disabled {
      opacity: .65;
      cursor: wait;
    }

    .sheet {
      width: min(100%, 210mm);
      min-height: 297mm;
      margin: 0 auto 24px;
      padding: 14mm;
      background: white;
    }

    .header {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
      gap: 20px;
      padding-bottom: 20px;
      border-bottom: 3px solid var(--secondary);
    }

    .brand-block, .invoice-meta { min-width: 0; }

    .invoice-logo {
      display: block;
      width: 155px;
      max-width: 100%;
      height: 65px;
      margin-bottom: 8px;
      object-fit: contain;
      object-position: left center;
      filter: url("#primary-logo-filter");
    }

    .invoice-meta {
      text-align: right;
      overflow-wrap: anywhere;
    }

    .invoice-title {
      margin-bottom: 4px;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .muted {
      color: var(--muted);
      font-size: 10px;
      overflow-wrap: anywhere;
    }

    .info-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 24px;
      margin: 24px 0;
    }

    .info-grid > div {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    h3 {
      margin: 0 0 8px;
      color: var(--secondary);
      font-size: 11px;
      letter-spacing: .4px;
    }

    .address, .custom-value, .note {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      word-break: normal;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .items-table th {
      background: var(--soft);
      color: var(--secondary);
      font-size: 10px;
      font-weight: 700;
      text-align: left;
    }

    .items-table th,
    .items-table td {
      padding: 11px 6px;
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: normal;
    }

    .product-row > td {
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }

    .product-layout {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 10px;
      width: 100%;
      min-width: 0;
    }

    .product-image,
    .product-image-placeholder {
      display: block;
      flex: 0 0 var(--product-image-size);
      width: var(--product-image-size);
      height: var(--product-image-size);
      padding: 3px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: white;
    }

    .product-image {
      object-fit: contain;
    }

    .product-image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted);
      font-size: 9px;
      text-align: center;
    }

    .product-details {
      flex: 1 1 0%;
      min-width: 0;
      max-width: 100%;
      overflow-wrap: anywhere;
    }

    .product-name {
      margin-bottom: 4px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.65;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .variant {
      margin-bottom: 3px;
      font-size: 10px;
      overflow-wrap: anywhere;
    }

    .items-table .number {
      text-align: right;
      font-size: 10px;
    }

    .custom-heading td {
      padding: 8px 10px 3px;
      color: var(--secondary);
      font-size: 10px;
      font-weight: 700;
      background: var(--soft);
    }

    .custom-row td {
      padding: 4px 10px 9px;
      border-bottom: 1px solid var(--border);
      background: #fcfafd;
    }

    .custom-label {
      display: block;
      margin-bottom: 2px;
      color: var(--secondary);
      font-size: 10px;
      font-weight: 700;
    }

    .custom-value {
      font-size: 11px;
      line-height: 1.8;
      orphans: 3;
      widows: 3;
    }

    .summary {
      width: 68%;
      max-width: 100%;
      margin: 24px 0 0 auto;
    }

    .summary-row {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 16px;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }

    .summary-row > span {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .summary-row > span:last-child {
      text-align: right;
    }

    .strong {
      color: var(--secondary);
      font-size: 14px;
      font-weight: 700;
    }

    .note {
      margin-top: 20px;
      padding: 12px;
      border-left: 3px solid var(--secondary);
      background: var(--soft);
    }

    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      text-align: center;
      font-size: 10px;
      color: var(--muted);
      overflow-wrap: anywhere;
    }

    /* Mobile preview only. Printed layout stays A4. */
    @media screen and (max-width: 600px) {
      .sheet {
        padding: 20px 14px;
        min-height: 0;
      }

      .header { gap: 12px; }
      .invoice-logo { width: 125px; height: 54px; }
      .invoice-title { font-size: 19px; }
      .info-grid { grid-template-columns: minmax(0, 1fr); gap: 18px; }

      .items-table,
      .items-table tbody {
        display: block;
        width: 100%;
      }

      .items-table colgroup,
      .items-table thead {
        display: none;
      }

      .product-row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0;
        border-top: 1px solid var(--border);
      }

      .items-table .item-index { display: none; }

      .items-table .product-cell {
        grid-column: 1 / -1;
        display: block;
        border: 0;
        padding: 14px 0 10px;
      }

      .items-table .metric {
        display: block;
        min-width: 0;
        padding: 8px 5px 12px;
        border-top: 0;
        text-align: left;
      }

      .metric::before {
        content: attr(data-label);
        display: block;
        margin-bottom: 3px;
        color: var(--muted);
        font-size: 9px;
      }

      .custom-heading,
      .custom-row,
      .custom-heading td,
      .custom-row td {
        display: block;
        width: 100%;
      }

      .summary { width: 100%; }
    }

    @page {
      size: A4;
      margin: 14mm;
    }

    @media print {
      body {
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .toolbar { display: none !important; }

      .sheet {
        width: auto;
        max-width: none;
        min-height: 0;
        margin: 0;
        padding: 0;
      }

      thead { display: table-header-group; }

      /* Allow very long text to continue onto another page. */
      .product-row,
      .custom-row,
      .custom-field,
      .custom-value {
        break-inside: auto;
      }

      .custom-heading { break-after: avoid; }
      .product-image { break-inside: avoid; }
      .header, .summary-row, .footer { break-inside: avoid; }
    }
  </style>
</head>

<body>
  <!-- Exact primary #310039 filter, preserving image transparency. -->
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="0"
    height="0"
    aria-hidden="true"
    style="position:absolute;pointer-events:none"
  >
    <defs>
      <filter
        id="primary-logo-filter"
        color-interpolation-filters="sRGB"
      >
        <feColorMatrix
          type="matrix"
          values="
            0 0 0 0 0.1921568627
            0 0 0 0 0
            0 0 0 0 0.2235294118
            0 0 0 1 0
          "
        />
      </filter>
    </defs>
  </svg>

  <div class="toolbar">
    <span>PDF রাখতে Print → Save as PDF নির্বাচন করুন।</span>
    <button id="invoice-print-button" type="button">
      Print / Save PDF
    </button>
  </div>

  <main class="sheet">
    <header class="header">
      <div class="brand-block">
        <img
          class="invoice-logo"
          src="${e(logoUrl)}"
          alt="SokhBilash"
          width="155"
          height="65"
          loading="eager"
        />
        <div class="muted">Gifts for special moments</div>
      </div>

      <div class="invoice-meta">
        <div class="invoice-title">INVOICE</div>
        <b>${e(order.orderNumber || order._id || "—")}</b>
        <div class="muted">Order date: ${e(formatDate(order.createdAt))}</div>
        <div class="muted">
          Status: ${e(STATUS_LABELS[order.status] || order.status || "—")}
        </div>
      </div>
    </header>

    <section class="info-grid">
      <div>
        <h3>CUSTOMER / DELIVERY ADDRESS</h3>
        <b>${e(shipping.name || customer.name || customer.displayName || "—")}</b>
        <div>${e(shipping.phone || customer.phone || "—")}</div>
        ${customer.email ? `<div>${e(customer.email)}</div>` : ""}
        <div class="address">${e(shipping.address || "")}</div>
        <div>${e(
          [shipping.district, shipping.division].filter(Boolean).join(", "),
        )}</div>
      </div>

      <div>
        <h3>PAYMENT / DELIVERY</h3>
        <div>Method: ${e(PAYMENT_METHODS[payment.method] || payment.method || "—")}</div>
        <div>Payment status: ${e(STATUS_LABELS[payment.status] || payment.status || "—")}</div>
        ${payment.trxId ? `<div>Transaction: ${e(payment.trxId)}</div>` : ""}
        <div>Courier: ${e(courier.name || "নির্ধারিত হয়নি")}</div>
        ${
          courier.trackingNumber
            ? `<div>Tracking: ${e(courier.trackingNumber)}</div>`
            : ""
        }
        <div>
          Expected delivery: ${
            order.estimatedDelivery
              ? e(formatDate(order.estimatedDelivery))
              : "নির্ধারিত হয়নি"
          }
        </div>
      </div>
    </section>

    <table class="items-table">
      <colgroup>
        <col style="width:4%" />
        <col style="width:50%" />
        <col style="width:6%" />
        <col style="width:20%" />
        <col style="width:20%" />
      </colgroup>
      <thead>
        <tr>
          <th>#</th>
          <th>Product details</th>
          <th class="number">Qty</th>
          <th class="number">Unit price</th>
          <th class="number">Amount</th>
        </tr>
      </thead>
      <tbody>${productRows}</tbody>
    </table>

    <section class="summary">
      ${summaryRow("Subtotal", money(order.subtotal))}
      ${
        numeric(order.discount) > 0
          ? summaryRow("Discount", `− ${money(order.discount)}`)
          : ""
      }
      ${
        numeric(order.giftWrapCharge) > 0
          ? summaryRow("Recorded wrapping charge", money(order.giftWrapCharge))
          : ""
      }
      ${summaryRow("Delivery charge", money(order.deliveryCharge))}
      ${summaryRow("Order total", money(order.total), true)}
      ${
        payment.claimedAmount != null
          ? summaryRow(
              "Customer-reported payment",
              money(payment.claimedAmount),
            )
          : ""
      }
      ${summaryRow("Verified payment received", money(payment.verifiedAmount))}
      ${
        refundedCents > 0
          ? summaryRow("Refunded", money(payment.refundedAmount))
          : ""
      }
      ${
        refundedCents > 0
          ? summaryRow(
              "Net payment retained",
              money((receivedCents - refundedCents) / 100),
            )
          : ""
      }
      ${
        cancelled
          ? summaryRow("Order payable", "Cancelled / rejected")
          : summaryRow("Remaining due", money(due), true)
      }
      ${
        !cancelled && excess > 0
          ? summaryRow("Excess received before refunds", money(excess))
          : ""
      }
      ${
        cancelled && refundRemaining > 0
          ? summaryRow("Refund remaining", money(refundRemaining), true)
          : ""
      }
    </section>

    ${
      order.giftOptions?.message
        ? `<section class="note"><b>Gift message</b><br>${e(order.giftOptions.message)}</section>`
        : ""
    }

    ${
      !cancelled && excess > 0
        ? `<section class="note">Excess payment is settled through a refund or equivalent products after confirmation with the customer. Contact SokhBilash for the settlement status.</section>`
        : ""
    }

    <footer class="footer">
      Thank you for choosing SokhBilash.<br>
      This invoice reflects the saved order and verified payment records.
      Customer-reported payment is not proof of receipt.
    </footer>
  </main>
</body>
</html>`;
}

// ==========================================
// WAIT FOR INVOICE IMAGES
// ==========================================

function waitForImage(image, timeoutMs = 20000) {
  return new Promise((resolve) => {
    if (image.complete) {
      resolve(image.naturalWidth > 0);
      return;
    }

    let timeout;

    function finish() {
      clearTimeout(timeout);
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve(image.complete && image.naturalWidth > 0);
    }

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    timeout = setTimeout(finish, timeoutMs);

    if (image.complete) finish();
  });
}

// ==========================================
// INVOICE BUTTON
// ==========================================

export function OrderInvoiceButton({ order, disabled = false }) {
  function handleOpenInvoice() {
    if (!order) return;

    const tab = window.open("about:blank", "_blank");

    if (!tab) {
      showError(
        "Invoice tab খোলা যায়নি",
        "এই website-এর জন্য popup allow করে আবার চেষ্টা করো।",
      );
      return;
    }

    try {
      tab.opener = null;
      tab.document.open();
      tab.document.write(buildInvoiceHtml(order));
      tab.document.close();

      const printButton = tab.document.getElementById("invoice-print-button");

      printButton?.addEventListener("click", async () => {
        if (printButton.disabled) return;

        printButton.disabled = true;
        printButton.textContent = "ছবি প্রস্তুত হচ্ছে…";

        try {
          const images = Array.from(tab.document.images);
          const loaded = await Promise.all(
            images.map((img) => waitForImage(img)),
          );

          if (tab.closed) return;

          if (loaded.some((success) => !success)) {
            tab.alert(
              "Logo অথবা product image load হয়নি। public/logo.png এবং product image URL পরীক্ষা করে নতুন করে Invoice খোলো।",
            );
            return;
          }

          if (tab.document.fonts) {
            await tab.document.fonts.ready;
          }

          if (!tab.closed) {
            tab.focus();
            tab.print();
          }
        } catch {
          if (!tab.closed) {
            tab.alert("Invoice প্রস্তুত করা যায়নি। আবার চেষ্টা করো।");
          }
        } finally {
          if (!tab.closed) {
            printButton.disabled = false;
            printButton.textContent = "Print / Save PDF";
          }
        }
      });
    } catch {
      tab.close();
      showError("Invoice তৈরি হয়নি", "আবার চেষ্টা করো।");
    }
  }

  return (
    <button
      type="button"
      onClick={handleOpenInvoice}
      disabled={disabled || !order}
      className={BUTTON_CLASS}
    >
      <FileText size={15} />
      Invoice / PDF
    </button>
  );
}
