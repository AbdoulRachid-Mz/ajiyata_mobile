# Chapitre 4 — Initialisation du projet (Setup technique complet)

---

# 4.1 Objectif du setup

Mettre en place une base technique :

* stable
* scalable
* offline-first ready
* type-safe
* compatible Firebase + SQLite + Cloudinary
* optimisée pour React Native + Expo

---

# 4.2 Stack finale validée

## Core

* Expo SDK (latest stable)
* React Native
* TypeScript (strict mode)
* Expo Router

---

## UI & Styling

* NativeWind (core styling only)
* React Native Reanimated
* React Native Gesture Handler
* React Native Screens
* Safe Area Context
* SVG support (react-native-svg)

---

## Data Layer

* SQLite (Expo SQLite)
* Drizzle ORM + Drizzle Kit
* TanStack Query (React Query)

---

## Backend / Cloud

* Firebase Authentication
* Firestore (sync only)
* Cloudinary (images uniquement)

---

## State Management

* Zustand (UI state only)
* TanStack Query (server + DB state)

---

## Forms & Validation

* React Hook Form
* Zod

---

## Utilities

* date-fns
* expo-file-system
* expo-secure-store
* expo-image-picker
* expo-local-authentication

---

## Notifications

* Expo Notifications
* Firebase Cloud Messaging

---

# 4.3 Création du projet Expo

```bash id="expo1"
npx create-expo-app@latest ajiya-ta -t
cd ajiya-ta
```

---

## Installation TypeScript strict

```bash id="ts1"
npm install -D typescript
```

---

# 4.4 Installation des dépendances principales

## Navigation

```bash id="nav1"
npx expo install expo-router react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
```

---

## NativeWind (IMPORTANT - configuration propre)

```bash id="nw1"
npm install nativewind tailwindcss
```

### Init Tailwind

```bash id="tw1"
npx tailwindcss init
```

---

## Configuration tailwind.config.js

```js id="tw2"
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## babel.config.js (IMPORTANT)

```js id="babel1"
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["nativewind/babel"],
  };
};
```

---

## IMPORTANT

Ajouter dans `app.json` :

```json id="appjson1"
{
  "expo": {
    "plugins": []
  }
}
```

---

# 4.5 Drizzle + SQLite

## Installation

```bash id="dr1"
npm install drizzle-orm expo-sqlite
npm install -D drizzle-kit
```

---

## Structure recommandée

```text id="db1"
database/
│
├── schema/
├── migrations/
├── client.ts
├── index.ts
└── repositories/
```

---

## SQLite client

```ts id="db2"
import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

const expoDb = SQLite.openDatabaseSync("ajiya.db");

export const db = drizzle(expoDb);
```

---

# 4.6 TanStack Query setup

```bash id="rq1"
npm install @tanstack/react-query
```

---

## Query Provider

```ts id="rq2"
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});
```

---

# 4.7 Firebase setup

```bash id="fb1"
npm install firebase
```

---

## config/firebase.ts

```ts id="fb2"
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
```

---

# 4.8 Cloudinary setup

```bash id="cl1"
npm install axios
```

---

## service/cloudinary.ts

```ts id="cl2"
import axios from "axios";

export const uploadImageToCloudinary = async (file: string) => {
  const data = new FormData();

  data.append("file", file);
  data.append("upload_preset", process.env.EXPO_PUBLIC_CLOUDINARY_PRESET!);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    data
  );

  return res.data;
};
```

---

# 4.9 NativeWind + Theme Provider

## contexts/theme-context.tsx

```ts id="theme1"
import { createContext, useContext } from "react";
import { lightTheme, darkTheme } from "@/theme";

export const ThemeContext = createContext(lightTheme);

export const useTheme = () => useContext(ThemeContext);
```

---

## Provider global

```ts id="theme2"
export const ThemeProvider = ({ children }) => {
  const theme = lightTheme;

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

# 4.10 Alias TypeScript (IMPORTANT)

## tsconfig.json

```json id="ts1"
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

# 4.11 Structure initialisée

```text id="st1"
app/
components/
database/
features/
services/
contexts/
hooks/
theme/
utils/
types/
constants/
```

---

# 4.12 Order d’initialisation (IMPORTANT)

1. Expo Router OK
2. NativeWind OK
3. Theme system OK
4. SQLite + Drizzle OK
5. TanStack Query OK
6. Firebase OK
7. Cloudinary OK
8. Features (ensuite seulement)

---

# 4.13 Règles critiques (NE JAMAIS VIOLER)

## UI

❌ pas de logique métier dans UI
❌ pas de Firebase dans composants
❌ pas de SQLite dans UI

---

## Data

✔ SQLite = source principale
✔ Firestore = sync seulement
✔ Cloudinary = images uniquement

---

## State

✔ TanStack Query = data layer
✔ Zustand = UI state seulement

---

## Styling

✔ NativeWind = layout only
✔ Theme = couleurs obligatoires

---

# 4.14 Résultat attendu après ce setup

Après ce chapitre, tu dois avoir :

* une app Expo qui démarre
* NativeWind fonctionnel sans conflit
* SQLite opérationnel
* Firebase connecté
* Cloudinary prêt
* structure propre prête pour les features
* Theme system actif
* architecture scalable

---

# 4.15 Transition vers chapitre 5

Maintenant que la base technique est prête, on peut entrer dans la partie la plus importante :

👉 **Chapitre 5 — Schéma de base de données (Drizzle + modèle financier complet)**

On va définir :

* users
* accounts
* transactions
* budgets
* saving goals
* sync system
* metadata structure
* relations complètes

C’est là que Ajiya Ta devient une vraie application financière.
