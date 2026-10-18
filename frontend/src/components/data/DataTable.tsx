import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material'
import type { ReactNode } from 'react'
import { TableEmpty } from './TableStates'

export interface DataTableColumn<T> {
  key: string
  header: ReactNode
  align?: 'left' | 'center' | 'right'
  width?: string | number
  render?: (row: T) => ReactNode
}

export interface DataTableProps<T> {
  columns: Array<DataTableColumn<T>>
  rows: T[]
  getRowId?: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T>({ columns, rows, getRowId, onRowClick, emptyMessage }: DataTableProps<T>) {
  if (rows.length === 0) return <TableEmpty message={emptyMessage} />
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #E4E9F1' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ '& th': { bgcolor: '#F5F6F8', color: '#718096', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap', py: 1.5 } }}>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align} width={column.width}>{column.header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={getRowId?.(row, index) ?? String(index)}
              hover={Boolean(onRowClick)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              sx={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default DataTable
