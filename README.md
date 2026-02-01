<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking the progress.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# Admin Dashboard UI/UX

A modern, responsive Admin Dashboard application built with React, TypeScript, and Tailwind CSS. This dashboard provides a comprehensive interface for managing school/academic administration, including student data, employees, finance, and academic records.

> Original design available on [Figma](https://www.figma.com/design/oMjVSnOmrVyn5QacrKkPDm/Admin-Dashboard-UI-UX).

## 🚀 Features

- **Dashboard Overview**: Visual summary of key metrics using charts and statistics.
- **Student Management (Siswa)**: CRUD operations for student data (integrated with Laravel API).
- **Employee Management (Karyawan)**: Manage employee records and information.
- **Academic (Akademik)**: Manage classes, subjects, and academic schedules.
- **Finance (Keuangan)**: Financial overview and management.
- **Reports (Laporan)**: Generate and view system reports.
- **User Management (Pengguna)**: Manage system users and access roles.
- **Settings (Pengaturan)**: Application configuration.
- **Responsive Design**: Fully optimized for desktop and mobile devices.

## 🛠️ Tech Stack

- **Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) (via shadcn/ui)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm, yarn, or pnpm

## ⚙️ Installation & Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/admindashboarduiux.git
   cd admindashboarduiux
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Configuration**

   The application connects to a Laravel backend API.

   - **Development**: A proxy is configured in `vite.config.ts` to forward `/api/*` requests to `https://app.sucisutjiptofoundation.org` to avoid CORS issues.
   - **Production**: You need to set the API base URL via environment variables.

   Create a `.env` or `.env.local` file:

   ```env
   VITE_API_BASE_URL=https://your-api-url.com/api
   ```

## 🏃‍♂️ Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📦 Building for Production

To create a production-ready build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 📂 Project Structure

```
src/
├── api/              # API integration (employees.ts, students.ts, http.ts)
├── components/       # Reusable UI components
│   ├── pages/        # Page components (Dashboard, Siswa, etc.)
│   ├── ui/           # Base UI components (shadcn/ui)
├── data/             # Dummy data and transformers
├── guidelines/       # Project guidelines
├── styles/           # Global styles
├── App.tsx           # Main application component
└── main.tsx          # Entry point
```
>>>>>>> upstream/main
