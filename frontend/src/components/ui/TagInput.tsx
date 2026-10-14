import { Chip, Stack, TextField } from '@mui/material'
export function TagInput({ tags = [] }: { tags?: string[] }) { return <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>{tags.map(tag => <Chip key={tag} label={tag} />)}<TextField size="small" placeholder="Add a tag" /></Stack> }
