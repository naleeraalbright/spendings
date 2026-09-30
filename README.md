# 💰 SpendWise — Multi-User Offline-First Income, Expense & Loan Tracker

A modern, high-performance financial management web application with **Firebase multi-user backend**, **Google Sign-In & Password Login**, **WebAuthn Biometric Security**, **Offline-First Persistence**, **Color-Coded Tabular Ledger (Green Income / Red Expenditure)**, and **Loans & Debt Payback Tracking**.

---

## ✨ Features & Highlights

### 1. 🟢 Dynamic Status Banner (Surplus vs Deficit / Debt)
- **Green Banner**: Activates when available net funds are positive ($\ge 0$).
- **Red Banner**: Activates when spending exceeds income or user is in deficit ($< 0$).
- Displays real-time **Net Balance**, **Total Income**, **Total Spent**, and **Outstanding Debt**.
- Quick action buttons to immediately record Incomes, Expenses, or Loans.

### 2. 📊 Color-Coded Tabular Ledger
- **Expenditures in Red** with **Item Name** and **Quantity** (defaults to `1` with quick adjustment buttons and unit pricing).
- **Incomes in Green** with source and category breakdown.
- Real-time search, filters by type (All, Income, Expense) & category, sorting by date and amount.
- One-click **CSV Export** for financial record keeping.

### 3. 🤝 Loans & Debt Payback Feature
- Record **Borrowed Loans** (money you owe) and **Lent Money** (money owed to you) with interest rates and due dates.
- Visual repayment progress bars for all active loans.
- **Pay Back Loan Action**: Making a loan repayment automatically:
  1. Reduces the loan's outstanding balance.
  2. Automatically logs an **Expenditure (Red)** in your transaction ledger.
  3. Marks the loan as fully settled when balance hits zero.

### 4. 📈 Graphical Analytics & Visual Reports
- **Monthly Income vs Expenditure**: Interactive bar chart comparing monthly inflows and outflows.
- **Spending by Category**: Interactive donut chart breaking down top expense categories.
- **Net Cash Flow Trend**: Area progression chart showing financial trajectory.
- **Top 5 Highest Value Expenditures**: Summary cards of your largest expenses.

### 5. ⚡ Offline-First Architecture & Background Sync
- Built with Firestore's `persistentLocalCache` with multi-tab `persistentMultipleTabManager`.
- Works 100% offline — insert incomes, record purchases, and pay back loans without an active internet connection.
- All modifications are automatically synced to the Firebase cloud in the background once reconnected.
- Real-time online/offline connection badge.

### 6. 🔒 Biometric Security & Multi-User Isolation
- **Authentication**: Firebase Auth with **Google Sign-In** (`GoogleAuthProvider`) and **Email/Password** authentication.
- **Biometric App Lock**: Secure your finances with **WebAuthn Passkeys** (Windows Hello, Face ID, Touch ID, or Android Biometrics) directly in browser.
- **Security PIN**: Configurable fallback 4-6 digit encryption PIN code.
- **Firestore Security Rules**: Strict per-user rule isolation (`request.auth.uid == resource.data.userId`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Connect to your Firebase Project
Create a `.env` file in the project root:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-id
VITE_FIREBASE_APP_ID=your-app-id
```

> **Note**: If no Firebase keys are provided, SpendWise automatically runs in **Offline Demo Mode** with persistent local storage so all features are instantly testable!

### 4. Deploy Firestore Security Rules
Deploy the included [`firestore.rules`](./firestore.rules) to your Firebase project:
```bash
firebase deploy --only firestore:rules
```

---

## 📁 Project Structure

```
spendings/
├── firestore.rules               # Multi-user isolation security rules
├── index.html                    # PWA / Web HTML template
├── package.json
├── src/
│   ├── components/
│   │   ├── analytics/
│   │   │   └── AnalyticsView.tsx # Interactive Recharts data visualization
│   │   ├── auth/
│   │   │   ├── AuthModal.tsx     # Google Sign In & Email/Password modal
│   │   │   └── BiometricLockScreen.tsx # WebAuthn & PIN lock screen
│   │   ├── common/
│   │   │   ├── BalanceBanner.tsx # Dynamic Green/Red status banner
│   │   │   └── Header.tsx        # App header, tab navigation & sync status
│   │   ├── loans/
│   │   │   ├── AddLoanModal.tsx  # Borrowed / Lent loan creation
│   │   │   ├── LoansManager.tsx  # Loan cards & debt overview
│   │   │   └── PaybackLoanModal.tsx # Payback loan with auto expense logging
│   │   ├── settings/
│   │   │   └── SettingsModal.tsx # Biometrics toggle, PIN setup, currency
│   │   └── transactions/
│   │       ├── AddTransactionModal.tsx # Expense/Income entry (Qty default 1)
│   │       └── TransactionTable.tsx    # Color-coded ledger with CSV export
│   ├── contexts/
│   │   └── AuthContext.tsx       # Auth state, Google OAuth, biometrics lock
│   ├── hooks/
│   │   └── useNetworkStatus.ts   # Online/offline network listener
│   ├── lib/
│   │   └── firebase.ts           # Firestore multi-tab cache & Firebase client
│   ├── services/
│   │   ├── biometricService.ts   # WebAuthn passkey API & PIN hashing
│   │   ├── loanService.ts        # Loan CRUD & payback expense integration
│   │   └── transactionService.ts # Offline-first Firestore transactions
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   └── formatters.ts         # Currency & date formatting
│   ├── App.tsx                   # Main layout and tab orchestrator
│   └── main.tsx                  # App entry point
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
