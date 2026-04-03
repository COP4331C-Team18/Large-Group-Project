# 🚀 Ink-DashBoard: Frontend Architecture & Developer Guide

Welcome to the frontend documentation for the Ink-DashBoard project. To ensure our 7-person development team can scale the application smoothly without merge conflicts or technical debt, we have transitioned to a modular, domain-driven MERN architecture. 

Please read this guide before creating new components or pages.

---

## 1. What Changed? (The "Before vs. After")

We have moved away from a monolithic, flat structure to a highly organized, domain-driven structure.

* **Absolute Imports:** No more `../../../../components`. We now use the `@/` alias to point directly to the `src/` directory.
* **Component Isolation:** Components are no longer dumped into one giant folder. They are grouped strictly by the **Page** that owns them.
* **Styling Standards:** We are deprecating "Raw Tailwind Walls" (e.g., stacking 50+ classes on a single `<div>`) in favor of **daisyUI** component classes (`card`, `btn-primary`, `input-bordered`).
* **Reusable Layouts:** Common UI structures (like the dashboard grid) are now reusable wrappers located in `@/layouts/`.

---

## 2. Directory Architecture

Familiarize yourself with the new `src/` skeleton:

| Directory | Purpose | Example |
| :--- | :--- | :--- |
| **`@/api/`** | Centralized Axios/Fetch clients and API routes. | `boardService.ts` |
| **`@/components/`** | UI components organized by domain/page. | `dashboard/BoardCard.tsx` |
| **`@/config/`** | Pure TS constants, theme settings, and env maps. | `constants.ts` |
| **`@/contexts/`** | Global React state providers. | `AuthContext.tsx` |
| **`@/hooks/`** | Reusable React logic and custom hooks. | `useCanvas.ts` |
| **`@/layouts/`** | High-level structural wrappers. | `BentoGrid.tsx` |
| **`@/utils/`** | Pure helper functions (math, dates, parsing). | `formatDate.ts` |

---

## 3. How to Start a New Page (Step-by-Step)

When tasked with building a new view (e.g., a "Settings" page), follow this exact workflow:

### Step A: Create the Component Folder
Create a new directory under `src/components/` specifically for that page. Do not mix these with common components.

```bash
mkdir src/components/settings
```
Add your sub-components here (e.g., ProfileForm.tsx, NotificationToggle.tsx).

### Step B: Create the Page Entry Point

Add the main page file in your views/pages directory.
```bash
import { BentoGrid, BentoItem } from '@/layouts/BentoGrid';
import { ProfileForm } from '@/components/settings/ProfileForm';

const SettingsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <BentoGrid>
         {/* Use BentoItem to maintain the grid layout standard */}
         <BentoItem colSpan={2}><ProfileForm /></BentoItem>
      </BentoGrid>
    </div>
  );
};

export default SettingsPage;
```
### Step C: Register the Route

Add your new page to your router setup (for us its in app.tsx) using the path alias:
```bash
import SettingsPage from '@/pages/SettingsPage';
```

## 4. The "Where Does It Go?" basic Examples

| Use case | To Do |
| :--- | :--- |
|Used ONLY on one page?|Put it in @/components/{pageName}/|
|Used on 2+ distinct pages?|Put it in @/components/common/|
|Is it an API fetch call?| Put it in @/api|

## 5. Styling Protocol (daisyUI First)

To keep the codebase readable, DRY, and perfectly themed, follow this CSS hierarchy:

Check daisyUI First: Always see if a daisyUI class exists for your needs (e.g., btn, card, modal, indicator, badge).

Use Tailwind for Layout: Use raw Tailwind classes only for spacing (p-4, gap-2), layout (flex, grid, w-full), or typography (text-xl, font-bold).

Strictly Avoid Custom CSS/IDs: Do not use id="login-button" or inline style={{}} tags for styling. Stick exclusively to the utility classes and theme configuration.