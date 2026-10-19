import { useState, type KeyboardEvent } from 'react'
import { Box, Chip, InputBase } from '@mui/material'

export interface TagInputProps {
  tags: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function TagInput({ tags, onChange, placeholder = 'Add a tag', disabled }: TagInputProps) {
  const [draft, setDraft] = useState('')
  const commit = () => {
    const value = draft.trim().replace(/,+$/, '')
    if (!value) return
    if (!tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) onChange?.([...tags, value])
    setDraft('')
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange?.(tags.slice(0, -1))
    }
  }
  const remove = (tag: string) => onChange?.(tags.filter((item) => item !== tag))
  return (
    <Box
      sx={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, p: 1, minHeight: 40,
        bgcolor: '#fff', border: '1px solid #D1D9E2', borderRadius: '8px',
        '&:focus-within': { borderColor: '#1B3A5C' },
      }}
    >
      {tags.map((tag) => <Chip key={tag} label={tag} size="small" disabled={disabled} onDelete={() => remove(tag)} sx={{ fontWeight: 600 }} />)}
      <InputBase
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        disabled={disabled}
        placeholder={placeholder}
        inputProps={{ 'aria-label': 'Add tag' }}
        sx={{ flex: 1, minWidth: 120, fontSize: 14 }}
      />
    </Box>
  )
}

export default TagInput
