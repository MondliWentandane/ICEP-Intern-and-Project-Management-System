# ICEP Frontend Styling and Shared Components

This guide shows where the shared frontend styles live and how to use them when building a page. Open the repository in VS Code, then follow the paths below from the repository root.

## Styling files

| Repository path | What it contains | When to use it |
|---|---|---|
| `frontend/src/styles/tokens.css` | Shared CSS variables for colours, spacing, border radii, and sidebar width | Use these variables in CSS or CSS modules. Update values here when a shared CSS token changes. |
| `frontend/src/styles/global.css` | Imports `tokens.css`; sets the global font, page background, and base text colour | Use for styles that should apply throughout the app. |
| `frontend/src/styles/index.css` | Imports `global.css` | Entry point for the global styles. |
| `frontend/src/app/theme.ts` | Material UI light theme: palette, typography, shape, and component defaults | Use the MUI theme through `sx` props and MUI components. Keep shared palette values in sync with `tokens.css` if changing them. |
| `frontend/src/main.tsx` | Wraps the app in `ThemeProvider`, loads the theme, and imports global CSS | The theme and global CSS are already applied here; feature pages should not add another theme provider. |

### Current shared tokens

The palette follows the supplied ICEP style guide: primary navy `#1B3A5C`, sidebar navy `#12283F`, page background `#F5F6F8`, white cards, heading text `#1A202C`, secondary text `#718096`, and the documented status colours. Spacing and radius tokens are also defined in `tokens.css`.

## Shared components

Use these instead of creating a page-specific copy when a shared component fits.

| Repository path | What it exports |
|---|---|
| `frontend/src/components/ui/index.ts` | Barrel exports for common UI components |
| `frontend/src/components/ui/Button.tsx` | Primary, secondary, and danger buttons |
| `frontend/src/components/ui/Badge.tsx` | General badge and status badge |
| `frontend/src/components/ui/FormControls.tsx` | Shared input, field, search input, textarea, select, and checkbox exports |
| `frontend/src/components/ui/Modal.tsx` | Shared Material UI dialog exports |
| `frontend/src/components/ui/KanbanStates.tsx` | Reusable loading, empty, and error states for Kanban boards |
| `frontend/src/components/data/index.ts` | Barrel exports for data and list-page components |
| `frontend/src/components/data/FilterBar.tsx` | Search and list filters |
| `frontend/src/components/data/TableStates.tsx` | Loading, empty, error, and combined table states |
| `frontend/src/components/data/DataTable.tsx` | Shared data table |
| `frontend/src/components/data/StatCard.tsx` | Dashboard statistic card |

## Using the shared styles in a page

### Material UI page

Use the theme values with `sx` rather than copying colour hex codes:

```tsx
<Paper sx={{ bgcolor: 'background.paper', color: 'text.primary', borderColor: 'divider', borderRadius: 3 }}>
  Page content
</Paper>
```

Import shared components from their barrel files:

```tsx
import { Button, Input, StatusBadge } from '@/components/ui'
import { FilterBar, TableState } from '@/components/data'
```

### CSS or CSS module

Use the CSS custom properties from `tokens.css`:

```css
.page {
  background: var(--icep-page);
  color: var(--icep-heading);
  border: 1px solid var(--icep-border);
  border-radius: var(--icep-radius-lg);
  padding: var(--icep-space-6);
}
```

## Team conventions

1. Check the shared component folders before adding a new button, input, badge, filter, modal, table state, or stat card.
2. Use theme palette values in MUI `sx` props and CSS variables in CSS files. Avoid adding page-specific copies of the product palette.
3. If a shared colour changes, update both `tokens.css` and `app/theme.ts` so CSS and Material UI stay aligned.
4. Keep page-specific layout rules with the feature that owns the page; keep reusable product-wide styles in the shared locations above.
5. New pages go under their feature folder in `frontend/src/features/`. Protected page routes use the app shell and the existing role guards in `frontend/src/routes/router.tsx`.

## Quick path from VS Code

1. Open the ICEP repository folder.
2. Expand `frontend` → `src`.
3. Open `styles/tokens.css` for CSS tokens or `app/theme.ts` for the Material UI theme.
4. Open `components/ui` or `components/data` to find reusable components.
5. Import shared components using the `@/components/...` alias shown in existing pages.

