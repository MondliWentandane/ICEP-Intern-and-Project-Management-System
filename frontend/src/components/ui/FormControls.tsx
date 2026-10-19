import { Checkbox, FormControlLabel, MenuItem, Select, TextField, type TextFieldProps } from '@mui/material'

export function Input(props: TextFieldProps) {
  return <TextField size="small" fullWidth {...props} />
}
export const Field = Input
export const SearchInput = Input
export function TextArea(props: TextFieldProps) {
  return <TextField size="small" fullWidth multiline minRows={3} {...props} />
}
export { Select, MenuItem, Checkbox, FormControlLabel }
