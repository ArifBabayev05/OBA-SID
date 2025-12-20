# ReceiptWise 📄✨

A small, privacy-first Expo app for scanning, parsing and analyzing receipts using OCR + optional AI parsing.

This repository contains the mobile/web app (React Native + Expo) and local services for OCR, AI parsing, dataset storage, and insights.

---

## 🚀 Quick start

### Prerequisites
- Node.js (LTS recommended)
- npm or yarn
- Xcode (for iOS simulator) / Android Studio (for Android emulator)
- Expo CLI via npx (no global install required)

### Install

```bash
npm install
# or
yarn install
```

### Environment variables
Create a `.env` file in the project root (DO NOT commit it). Use the example below in `.env.example`.

`.env.example`
```env
# OCR provider key (e.g. ocr.space)
EXPO_PUBLIC_OCR_API_KEY=your_ocr_api_key_here

# Gemini / Google generative language key (optional, used for AI parsing)
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

> ⚠️ Never commit real keys. Use `.env.example` for required variable names and GitHub Secrets for CI.

### Start the app

Open Expo dev tools and run on your platform of choice:

```bash
npx expo start
npm run ios      # iOS simulator
npm run android  # Android emulator
npm run web      # Web preview
```

---

## ⚙️ Available scripts
These come from `package.json`:

- `npm start` — start Expo dev tools
- `npm run ios` — start iOS simulator
- `npm run android` — start Android emulator
- `npm run web` — open in browser
- `npm run reset-project` — reset starter project files (moves examples into `app-example`)
- `npm run lint` — run ESLint checks

---

## 🧩 Features

- Scan or import receipts from QR / images
- OCR text extraction (default via OCR.space)
- Optional AI parsing for structured receipt extraction
- Local dataset storage (file-based) and insights (spending trends, top products, promos)
- Smart-lens mock product identification (requires Gemini API key)

---

## 🏗️ Architecture & important files

- `app/` — Expo routes and UI
- `services/` — core logic (OCR, AI parsing, dataset, insights, storage)
  - `ocrService.ts` — QR fetching, OCR calls, text parsing
  - `aiReceiptParser.ts` — fallback/AI-based parsing helpers
  - `datasetService.ts` — local dataset read/write
  - `insightsService.ts` — analytics & insights logic
- `components/` — reusable UI components
- `data/` — mock data & promotions

---

## 🛠 Developer guide

### Environment
- Add the required keys to `.env` following `.env.example`.
- Use `EXPO_PUBLIC_OCR_API_KEY` for OCR and `EXPO_PUBLIC_GEMINI_API_KEY` if you want AI parsing.

### Optional native features
- For image resizing/compression, install `expo-image-manipulator`:

```bash
npm install expo-image-manipulator
```

If you use it, make sure to run a development build or use Expo dev client for native modules.

### Debugging tips
- If OCR returns empty results, log `response.data` in `ocrService.processReceiptImage` and check `.ParsedResults`.
- For AI parsing failures, confirm `EXPO_PUBLIC_GEMINI_API_KEY` is present and check network requests.
- If dataset appears corrupted, `datasetService.clearDataset()` can reset the file.

---

## 🧪 Tests & CI (suggested)
- Add unit tests for parsers (e.g., `parseReceiptText`, `extractDocIdFromUrl`) and `insightsService` logic.
- Add a GitHub Actions workflow to run `npm run lint` and tests on PRs.

If you'd like, I can add a sample test and a basic GitHub Actions workflow.

---

## 🔒 Privacy & Security

- Sensitive keys must never be committed. Use `.env` locally and GitHub Secrets for CI.
- Consider encrypting stored receipts or adding a user toggle to opt-in to cloud sync.

---

## ♻️ Contributing

- Fork the repo, create a branch, add changes, and open a PR.
- Keep the scope small per PR and include tests for new logic when possible.

---

## 📋 Roadmap ideas

- Cloud sync / multi-device backups (opt-in)
- Product catalog + live promotions integration
- Enhanced price-tracking & alerts
- Supervised learning from user-corrected parses

---

## ❗ Troubleshooting

- **Missing OCR key**: You will see an explicit error — ensure `EXPO_PUBLIC_OCR_API_KEY` exists in `.env`.
- **e-kassa fetch issues**: verify the QR doc ID and network health.
- **Native module issues**: use a dev build for native modules or avoid optional native dependencies.

---

If you want, I can open a PR that:

1. Replaces this README with this improved version
2. Adds a `.env.example`
3. Adds a small unit test for `parseReceiptText` and a basic GitHub Actions workflow

Tell me which of these you'd like me to apply and I will prepare the PR. ✅
