# Three Kingdoms Strategy Manager - Frontend

React.js dashboard for managing Three Kingdoms Strategy alliance member performance.

## 🚀 Tech Stack

- **React** 19.1.0 - UI library
- **TypeScript** 5.8.3 - Type safety
- **Vite** 7.0.4 - Build tool
- **TanStack Query** 5.83.0 - Server state management
- **React Router** 7.7.1 - Routing
- **Tailwind CSS** 4.1.11 - Styling
- **shadcn/ui** - UI components
- **Axios** 1.11.0 - HTTP client

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   └── ui/           # shadcn/ui components
│   ├── pages/            # Page components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (cn, api-client)
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # App router
│   ├── main.tsx          # Entry point (TanStack Query setup)
│   ├── index.css         # Theme provider (CSS variables)
│   └── app.css           # Tailwind imports
├── components.json       # shadcn/ui configuration
├── vite.config.ts        # Vite config with path aliases
└── package.json          # Dependencies
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or pnpm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at http://localhost:5187

### Build

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build

# Preview build
npm run preview
```

## 🎨 Theme System

Theme variables are defined in `src/index.css` using CSS custom properties with OKLCH color space:

- Light mode: `:root` variables
- Dark mode: `.dark` class variables
- Supports: primary, secondary, accent, destructive, muted, chart colors

## 🔧 Path Aliases

Configured in `vite.config.ts` and `tsconfig.app.json`:

- `@/` → `src/`
- `@/components` → `src/components/`
- `@/lib` → `src/lib/`

## 📦 Component Architecture

### UI Components (shadcn/ui)

Located in `src/components/ui/`, following **CLAUDE.md** standards:

- ✅ 100% ES imports (no `require()`)
- ✅ JSX syntax only (no `React.createElement`)
- ✅ Explicit TypeScript interfaces
- ✅ Use `cn()` utility for className merging

### Page Components

Located in `src/pages/`:

- Simple, focused components (<500 lines)
- Use TanStack Query for data fetching
- Follow React best practices

## 🌐 API Integration

Configure backend URL in Vite proxy (`vite.config.ts`):

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8087',
    changeOrigin: true,
  }
}
```

## 🧪 Standards & Conventions

Follows **CLAUDE.md** project standards:

### Critical Rules 🔴

1. **100% ES imports** - Zero tolerance for `require()`
2. **JSX only** - No `React.createElement`
3. **Explicit props** - No empty interfaces or `React.ComponentProps<T>` abuse
4. **Type safety** - No `any` in critical paths

### Important Rules 🟡

1. Components <500 lines
2. Use TanStack Query for all server state
3. snake_case for API fields (matches backend)
4. Use semantic import organization

## 📝 Development Workflow

```bash
# Add new package
npm install <package-name>

# Run type check
npx tsc --noEmit

# Run linter
npm run lint

# Run build
npm run build
```

## 🎯 Next Steps

- [ ] Implement CSV upload component
- [ ] Add member list view
- [ ] Create performance analytics charts
- [ ] Implement data filtering & sorting

---

Built with ❤️ following **CLAUDE.md** best practices
