export const cardGrid = (columns: { sm?: number; lg: number }) => ({
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns.sm ?? 2}, minmax(0, 1fr))`, lg: `repeat(${columns.lg}, minmax(0, 1fr))` },
})
