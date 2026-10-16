import { useState } from 'react'
import { Alert, Box, Divider, Paper, Snackbar, Typography } from '@mui/material'
import { Download } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { TableError, TableLoading } from '@/components/data/TableStates'
import { FileRow } from '@/features/application/components/FileUploads'
import { formatBytes } from '@/features/application/data/applicationSchema'
import { downloadBlob } from '@/utils/format'
import { DetailValue, PageHeading, ProfileFootnote, ProfileHeader, SecurityCard, SkillChips } from '../components/ProfileParts'
import { cardSx } from '../components/styles'
import { useProfile } from '../hooks/useProfile'

const shortDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))

export function MyProfilePage() {
  const { user, data: profile, isLoading, isError, refetch } = useProfile()
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState(() => (location.state as { saved?: boolean } | null)?.saved ? 'Your profile has been updated.' : '')

  if (!user) return null
  if (isLoading) return <TableLoading />
  if (isError || !profile) return <TableError message="We couldn't load your profile" onRetry={() => void refetch()} />

  const isIntern = user.role === 'intern'
  const downloadCv = () => {
    if (profile.cv?.file) downloadBlob(profile.cv.file, profile.cv.name)
    else setToast('CV downloads will work once the profile API is connected.')
  }
  const closeToast = () => { setToast(''); if (location.state) navigate('.', { replace: true, state: null }) }

  return (
    <Box sx={{ display: 'grid', gap: 2.5 }}>
      <PageHeading current="My profile" title="My profile" subtitle="Manage your personal information and account security." />
      <Alert severity="info">This page uses demo data until the profile API is available. Changes last until you refresh.</Alert>
      <ProfileHeader profile={profile} role={user.role} />

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 360px' }, alignItems: 'start' }}>
        <Paper component="section" aria-labelledby="details-title" sx={cardSx}>
          <Typography id="details-title" component="h2" sx={{ fontSize: 18, fontWeight: 700 }}>Personal details</Typography>
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{isIntern ? 'Your academic and professional information.' : 'Your contact information.'}</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            <DetailValue label="Phone number" value={profile.phone} />
            {isIntern && <>
              <DetailValue label="Campus" value={profile.campus} />
              <DetailValue label="Student number" value={profile.studentNumber} />
              <DetailValue label="Qualification" value={profile.qualification} />
              <DetailValue label="Intake" value={profile.intake} />
            </>}
          </Box>
          {isIntern && <>
            <Box sx={{ mt: 2 }}><DetailValue label="Skills" value={<SkillChips skills={profile.skills} />} /></Box>
            <Divider sx={{ my: 2.5 }} />
            {profile.cv
              ? <FileRow muted name={profile.cv.name} detail={`PDF · ${formatBytes(profile.cv.size)} · Updated ${shortDate(profile.cv.updatedAt)}`}
                  action={<Button appearance="secondary" size="small" startIcon={<Download size={16} />} onClick={downloadCv}>Download</Button>} />
              : <Typography sx={{ color: 'text.secondary' }}>No CV uploaded yet. Use Edit profile to add one.</Typography>}
          </>}
        </Paper>
        <SecurityCard />
      </Box>
      <ProfileFootnote />
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={closeToast} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  )
}

export default MyProfilePage
