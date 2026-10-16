import { useState, type KeyboardEvent } from 'react'
import { Box, Chip, FormHelperText, InputBase } from '@mui/material'
import { X } from 'lucide-react'

/** Skills input: type a skill and press Enter (or comma) to add it; Backspace on an empty input removes the last one. */
export function TagInput({ id, value, onChange, onBlur, placeholder = 'Add a skill', errorText, hint }: {
  id: string; value: string[]; onChange: (next: string[]) => void; onBlur?: () => void; placeholder?: string; errorText?: string; hint?: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const skill = draft.trim().replace(/,$/, '')
    if (skill && !value.some((item) => item.toLowerCase() === skill.toLowerCase())) onChange([...value, skill])
    setDraft('')
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add() }
    else if (event.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  const describedBy = errorText || hint ? `${id}-help` : undefined
  return (
    <Box>
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, minHeight: 56, px: 1.5, py: 1, borderRadius: 2, bgcolor: '#fff',
        border: '1px solid', borderColor: errorText ? 'error.main' : 'rgba(0,0,0,.23)',
        '&:hover': { borderColor: errorText ? 'error.main' : 'text.primary' },
        '&:focus-within': { borderColor: errorText ? 'error.main' : 'primary.main', boxShadow: (theme) => `inset 0 0 0 1px ${errorText ? theme.palette.error.main : theme.palette.primary.main}` },
      }}>
        {value.map((skill) => (
          <Chip key={skill} label={skill} size="small" onDelete={() => onChange(value.filter((item) => item !== skill))}
            deleteIcon={<X size={14} aria-label={`Remove ${skill}`} />}
            sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 500, '& .MuiChip-deleteIcon': { color: '#1D4ED8' } }} />
        ))}
        <InputBase
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => { if (draft.trim()) add(); onBlur?.() }}
          placeholder={placeholder}
          inputProps={{ 'aria-describedby': describedBy }}
          sx={{ flex: '1 1 120px', fontSize: 15 }}
        />
      </Box>
      {(errorText || hint) && <FormHelperText id={describedBy} error={Boolean(errorText)} sx={{ mx: 0 }}>{errorText ?? hint}</FormHelperText>}
    </Box>
  )
}
