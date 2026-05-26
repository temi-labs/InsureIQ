# InsureIQ Template Usage Guide

Welcome to the InsureIQ SaaS Insurance Dashboard Template! This guide will walk you through customizing the template, inputting your information, and adapting it for production.

## 1. Initial Setup

First, ensure you have installed the project dependencies:

```bash
npm install
```

Start the development server to preview your changes in real-time:

```bash
npm run dev
```

## 2. Global Configuration (Inputting Your Information)

The central configuration for the template is located in `src/config.ts`. Here you can input your company's information to rebrand the application.

Open `src/config.ts` and modify the `appConfig` object:

```typescript
export const appConfig = {
  name: 'Your Company Name', // Changes the branding in the header and footer
  theme: {
    primaryColor: '#EC5E24',
    secondaryColor: '#1e293b',
  },
  features: {
    enableAnalytics: true,
    enableActivityLog: true,
  },
  companyDetails: {
    name: 'Your Company Ltd.', // Used in footer copyrights
    supportEmail: 'support@yourcompany.com',
  }
};
```

## 3. Customizing the Theme Colors

The template uses a primary orange color (`#EC5E24`). You can easily change this to match your brand.

1. Open `src/index.css`.
2. Update the color variables inside the `@theme` block (or use global search and replace for `#EC5E24`):

```css
@theme {
  --color-primary: #007BFF; /* Replace with your primary brand color */
  --color-primary-hover: #0056b3; /* Replace with a darker shade for hover states */
  --color-primary-light: #E6F2FF; /* Replace with a very light shade for backgrounds */
}
```

*Note: For some inline SVG graphics and specific Tailwind classes (like text-[#EC5E24] or bg-[#EC5E24]), you may want to do a global Find & Replace in your code editor to swap `#EC5E24` with your new hex code.*

## 4. Connecting a Real Backend (Removing Mock Data)

Out of the box, InsureIQ uses browser `localStorage` to simulate a database. Making it production-ready involves wiring up true database endpoints (like Firebase, Supabase, or a custom API).

### Authentication

The authentication logic is managed in `src/contexts/AuthContext.tsx`.

- Locate the `login`, `register`, and `logout` functions.
- Replace the `localStorage` checks with your authentication SDK (e.g., `signInWithEmailAndPassword` for Firebase or `supabase.auth.signInWithPassword` for Supabase).

### Data Fetching (Policies and Claims)

Data pages like `src/pages/Policies.tsx` and `src/pages/Claims.tsx` retrieve data using `localStorage.getItem`.

1. **Policies:** In `src/pages/Policies.tsx`, review the `loadPolicies` and `handleSubmit` (create/update policy) methods. Replace the local array manipulation with fetch calls to your API or database.
2. **Claims:** Similarly, in `src/pages/Claims.tsx`, modify `loadData` and `handleSubmit`.
3. **Data Models:** Ensure your database schemas align with the TypeScript interfaces defined in `src/types.ts`.

## 5. Adding New Features

The application is structured to make adding new pages straightforward:

1. **Create the Page component:** Add a new file in `src/pages/` (e.g., `src/pages/Messages.tsx`), wrapping your content in the `<Layout>` component.
2. **Add to Router:** Open `src/App.tsx` and add your new route inside the `<Routes>` block.
3. **Add Navigation Link:** To make the page accessible from the sidebar navigation, open `src/components/Layout.tsx` and add a new object to the `navItems` array.

```tsx
const navItems = [
  // ...existing items
  { icon: MessageSquare, label: 'Messages', path: '/messages' }
];
```

## 6. Going to Production

Once you have replaced the local storage data with a live backend and customized the UI, compile the application for production:

```bash
npm run build
```

This will generate a `dist/` folder containing static files that can be deployed to Vercel, Netlify, Cloud Run, Firebase Hosting, or any standard static web host.
