# Autodesk APS Viewer & PDF Watermark POC

This repository contains proof-of-concept integrations for Autodesk APS CAD rendering, markup annotations, and an independent PDF watermark visualizer.

## Features

1. **CAD Model Annotation**: Renders 2D/3D CAD models using the Autodesk APS viewer. Users can draw markups, place images, and load stored annotations.
2. **PDF Watermark Studio**: Visualizes custom dynamic watermark text overlays on PDF files using a modular React viewer powered by `react-doc-viewer`.

---

## Git Branching & Merging Strategy

To maintain clean features and independent testing workspaces, follow these git guidelines:

### 1. Default Branch
*   **Default Branch**: `main`
*   All feature development branches must originate from the `main` branch.

### 2. Annotation Feature Branch
*   **Origin**: Branched directly from `main`
*   **Merge Target**: Must merge back into the `main` branch only.

### 3. Watermark Feature Branch
*   **Origin**: Branched directly from `main` (independent workspace)
*   **Merge Target**: Must merge back into the `main` branch only.

---

## Getting Started

### 1. Install Dependencies
Run the package installation:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder with your Autodesk API keys:
```env
APS_CLIENT_ID=your_client_id
APS_CLIENT_SECRET=your_client_secret
```

### 3. Start the Development Server
Run the local dev server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) inside your browser. Navigate to `/watermark` to access the PDF Watermark Studio directly, or upload files on `/` to auto-detect model vs document scopes.
