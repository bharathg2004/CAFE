# CafeOS — Smart Cafe Management & Ordering System

A real-time, multi-device Cafe Management, QR-Ordering, Kitchen Display (KDS), Biller POS, and Owner Business Intelligence ecosystem designed for fast-paced modern cafes.

---

## 🌟 Ecosystem Architecture & Portals

The application provides 4 synchronized portals operating with live cross-device and cross-tab state:

| Portal | Target Device | Direct Route / URL | Core Functionality |
| :--- | :--- | :--- | :--- |
| **📱 Customer Mobile** | Smartphones (via Table QR) | `/?table=[1-12]` | Tamper-proof table ordering, veg filters, item cooking notes, 10-digit phone verification, instant UPI & Pay-at-Counter flows, same-table friend order sharing, 30-min departure reminder chime. |
| **👨‍🍳 Chef Kitchen Display (KDS)** | 24" or 32" TV / Monitor + Mouse | `/?portal=chef` | Table-wise tickets, item preparation countdown with dynamic **Green (100-70%)**, **Yellow (70-30%)**, **Red (30-0% / Overdue)** transitions, non-kitchen items exclusion, emergency **Need Help** buzzer, large mouse-optimized hit targets. |
| **🖥️ Biller / Cashier POS** | Windows PC / Laptop | `/?portal=biller` | Real-time table occupancy map (12 tables), walk-in offline order creator, **Automated Cash Register Change Calculator**, overdue kitchen alerts, distributor stock inward logging (Pending Owner Approval). |
| **👑 Owner Business Intelligence** | Laptop / Mobile (Global Cloud) | `/?portal=owner` | **1-Minute Financial Health Check** (Today/Week/Month/Year), **Cash vs. UPI Reconciliation**, Chef average prep time analytics, Customer CRM & lifetime spend, Promotional Coupons & 1-Click WhatsApp/SMS marketing campaigns. |

---

## 🖥️ Kitchen Screen Hardware Recommendation

> **Note on Windows Multi-Monitor & The "Two-Mouse" Problem**:
> Running an HDMI cable from the cashier's Windows PC into a kitchen TV while plugging in a second USB mouse on the cashier PC causes Windows to share a single global cursor. Clicks in the kitchen will steal focus from the cashier desk.
>
> **The Optimal Solution**:
> 1. Keep your 24" or 32" TV in the kitchen.
> 2. Plug an inexpensive **Android TV Box / Fire TV Stick** (₹1,500 – ₹2,500) into the TV HDMI.
> 3. Plug a wireless mouse into the TV box USB port.
> 4. Connect the TV box to Cafe Wi-Fi and open `https://your-domain.com/?portal=chef` in fullscreen kiosk mode.
> 5. The chef operates independently without any wires running between the billing desk and kitchen!

---

## 🚀 Getting Started Locally

### Prerequisites
* **Node.js**: v18 or higher (tested on Node v24)
* **npm**: v9 or higher

### Installation & Run
```bash
# Clone the repository
git clone https://github.com/bharathg2004/CAFE.git
cd CAFE

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit:
* `http://localhost:5173/?table=1` — Customer View (Table 1)
* `http://localhost:5173/?portal=chef` — Kitchen Display System
* `http://localhost:5173/?portal=biller` — Biller & Cashier POS
* `http://localhost:5173/?portal=owner` — Owner Portal (Default password: `cafe2026`)

### Production Build
```bash
npm run build
```
The compiled, production-ready static assets will be output in the `dist/` directory.

---

## 🌐 Automated GitHub Pages Deployment

This repository includes an automated GitHub Actions CI/CD workflow (`.github/workflows/deploy.yml`).
Whenever code is committed and pushed to the `main` branch, GitHub Actions will build and deploy the app live to your GitHub Pages URL automatically:

1. In your GitHub repository: Go to **Settings** > **Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Any push to `main` will deploy the site live!

---

## 🔒 Security & Data Integrity

1. **Table Isolation**: Signed session tokens prevent customers from modifying or snooping other tables.
2. **Order Gatekeeping**: The Kitchen Display strictly shows orders **after** payment confirmation (Instant UPI verification or Cashier manual approval).
3. **Role-Based Permissions**: Billers can log incoming distributor crates, but cannot alter dish prices or delete stock without Owner review.
4. **Data Durability**: Master order records and customer CRM statistics are maintained in persistent storage for long-term customer marketing and tax reporting.