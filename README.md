# 📚 Skyrovix Library Management System (Full-Stack Dynamic)

A full-stack, dynamic, modern Library Management System engineered with **Node.js 24**, **Express 5**, persistent native **SQLite (`node:sqlite`)**, and an interactive, responsive **Single Page Application (SPA)** frontend with Tailwind CSS and Lucide icons.

![Library Management System](https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

### 📊 1. Real-time Dashboard
- **Key Metrics at a Glance**: Total book titles & physical copies, available stock, active loans, overdue items, and unpaid fines.
- **Visual Analytics**: Interactive category and genre distribution breakdown.
- **Recent Loan Activity Stream**: Live feed of borrowing and return transactions with borrower avatars and due dates.
- **Top Borrowed Leaderboard**: Highlights the most popular books in the collection.

### 📚 2. Dynamic Books Catalog Management
- **Full CRUD Support**: Add new books, update metadata/stock, and delete books (with active loan protection).
- **Rich Book Metadata**: Title, Author, ISBN, Category/Genre, Total Copies, Available Copies, Published Year, Publisher, Shelf Location, Cover Image URL, and Description.
- **Multi-Filter & Instant Search**: Real-time debounce search across titles, authors, and ISBNs. Instant filters by Category and Stock Availability (Available vs. Out of Stock).
- **View Toggle**: Switch seamlessly between modern **Grid Cards** and high-density **Data Table** views.
- **Live Cover Preview**: Dynamic image preview when adding or editing book records.

### 👥 3. Member Directory & Privilege System
- **Tier-based Membership**: Supports **Faculty** (10 books), **Premium** (6 books), **Student** (4 books), and **Standard** (3 books) borrowing tiers.
- **Automated Member Codes**: Auto-generates unique identifiers (e.g., `MEM-1001`, `MEM-1002`).
- **Complete Borrowing Profile**: View member's active loans, past loan history, and unpaid fines in a dedicated modal.
- **Member Status Management**: Flag and suspend accounts with unresolved fines.

### 🔄 4. Circulation & Loan Automation
- **Instant Book Issuance**: Searchable book and member selector with copy availability validation, member loan limit enforcement, and duplicate borrowing checks.
- **Custom Loan Durations**: 7-day, 14-day, 21-day, or 30-day borrowing periods with automated due date calculation.
- **Automated Overdue & Fine Engine**: Dynamically calculates overdue days and applies a customizable fine ($1.00/day).
- **Return & Fine Settlement**: 1-click return workflow with fine waiver or collection recording and immediate copy restocking.
- **Loan Renewals**: Extend loans by 14 days directly with a built-in renewal limit (max 2 renewals).

### 📈 5. Analytics & 1-Click CSV Export
- **Data Portability**: Instant CSV export for:
  - Complete Books Catalog (`/api/export/books`)
  - Registered Members Directory (`/api/export/members`)
  - Circulation Transaction Records (`/api/export/loans`)

### ⚡ 6. Zero-Config Native SQLite Database
- Uses Node.js 24's native `DatabaseSync` (`node:sqlite`).
- **No external database server installation** (no MySQL/PostgreSQL setup required).
- **No native compilation headaches** (`node-gyp` or C++ build tools are never needed).
- Full relational integrity with foreign keys, indexes, and ACID transactions.
- **Pre-seeded with 20 realistic titles**, 8 members, and 10 sample circulation records right out of the box.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Backend** | Node.js v24 + Express 5 | High-performance RESTful API with structured routing and error handling |
| **Database** | SQLite via `node:sqlite` | Embedded, ACID-compliant relational SQL storage with foreign keys |
| **Logging & Security** | Morgan & CORS | Request logging and cross-origin resource sharing |
| **Frontend** | Vanilla JS (ES6+) + Tailwind CSS | Reactive Single Page Architecture with zero frontend build step |
| **Iconography & Fonts** | Lucide Icons + Plus Jakarta Sans | Modern dashboard aesthetic with glassmorphism |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js **v22.5+** or **v24+** (run `node -v` to confirm)
- Windows, macOS, or Linux

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Or for development with automatic restart on file changes:
```bash
npm run dev
```

### 3. Open in Browser
Visit **[http://localhost:5000](http://localhost:5000)** in your web browser.

The database will be automatically initialized and seeded at `data/library.db` upon first launch!

---

## 📁 Project Structure

```
library-management-system/
├── data/
│   └── library.db           # Persistent SQLite database file
├── public/
│   ├── css/
│   │   └── styles.css       # Custom animations, glassmorphism & utility styles
│   ├── js/
│   │   ├── app.js           # Client-side state manager, API client & event dispatcher
│   │   └── components.js    # Modular UI render functions (cards, tables, badges)
│   └── index.html           # Single Page Application (SPA) entry
├── src/
│   ├── config/
│   │   └── database.js      # SQLite schema, tables, foreign keys & helpers
│   ├── controllers/
│   │   ├── bookController.js   # Books CRUD & availability validation
│   │   ├── memberController.js # Member registration & borrowing history
│   │   ├── loanController.js   # Issue, return, renew & fine calculation
│   │   └── statsController.js  # Dashboard aggregations, CSV exports & seed reset
│   ├── routes/
│   │   ├── bookRoutes.js    # /api/books
│   │   ├── memberRoutes.js  # /api/members
│   │   ├── loanRoutes.js    # /api/loans
│   │   └── statsRoutes.js   # /api/stats, /api/categories, /api/export
│   └── utils/
│       └── seeder.js        # Seed script for realistic books, members & loans
├── server.js                # Express app entry point
├── package.json
└── README.md
```

---

## 🌐 REST API Endpoints

### Books (`/api/books`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/books` | List books (supports `search`, `category`, `availability`, `sortBy`, `order`) |
| `GET` | `/api/books/:id` | Get single book details and active borrower list |
| `POST` | `/api/books` | Add new book to catalog |
| `PUT` | `/api/books/:id` | Update book details and copy counts |
| `DELETE` | `/api/books/:id` | Delete book (checks for active loans first) |

### Members (`/api/members`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/members` | List members (supports `search`, `type`, `status`) |
| `GET` | `/api/members/:id` | Get member details with full borrowing history |
| `POST` | `/api/members` | Register new member (auto-generates member code) |
| `PUT` | `/api/members/:id` | Update member information |
| `DELETE` | `/api/members/:id` | Delete member (checks for active loans first) |

### Circulation & Loans (`/api/loans`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/loans` | List all circulation records (filterable by `status`) |
| `POST` | `/api/loans/issue` | Issue book to member (validates stock & limits) |
| `POST` | `/api/loans/:id/return`| Return book (calculates fines & restocks copy) |
| `POST` | `/api/loans/:id/renew` | Renew loan for 14 days (up to 2 times) |
| `POST` | `/api/loans/:id/pay-fine`| Mark outstanding fine as paid |

### Metrics & Utilities (`/api`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stats` | Dashboard statistics, category breakdown & recent activity |
| `GET` | `/api/categories` | Unique category list with book counts |
| `GET` | `/api/export/:type` | Download CSV for `books`, `members`, or `loans` |
| `POST` | `/api/seed/reset` | Reset and re-seed database with default catalog |
| `GET` | `/api/health` | Health check endpoint |

---

## 📄 License
This project is licensed under the MIT License.
