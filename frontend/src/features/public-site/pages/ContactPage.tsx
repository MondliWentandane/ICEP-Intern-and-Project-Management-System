import { useState, type FormEvent, type ReactNode } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { CursorFollower } from '../story/CursorFollower'
import { RevealTitle } from '../story/Reveal'
import { riseSx, useReveal } from '../story/useScrollProgress'
import { introSx } from '../story/motion'

/** frontend/src/features/public-site/pages/ContactPage.tsx (route /contact already exists). Styles are included below. */

const navy = '#1E3A5F'

const MAPS_URL = 'https://www.google.com/maps/place/Tshwane+University+of+Technology+-+Soshanguve+South+Campus+-+TUT/@-25.5401753,28.0968938,17z/data=!3m1!4b1!4m6!3m5!1s0x1ebfcf9c4eedb233:0x9e2de5e61f9e48e7!8m2!3d-25.5401753!4d28.0968938!16s%2Fm%2F0dkfwvn?entry=ttu'

const CSS = `
.cp{--p:var(--mui-palette-primary-main,#1f3a68);--t:var(--mui-palette-text-primary,#0f1a2b);--m:var(--mui-palette-text-secondary,#5b6678);--b:var(--mui-palette-background-paper,#fff);--l:var(--mui-palette-divider,#d9dee7);--e:cubic-bezier(.65,0,.35,1);color:var(--t)}
.cp-w{max-width:1200px;margin:0 auto;display:grid;gap:32px}
.cp-c{background:var(--b);border:1px solid var(--l);border-radius:16px;padding:12px}
.cp-cols{display:grid;gap:24px}
.cp-i{position:relative;overflow:hidden;background:${navy};color:#fff;border-radius:12px;padding:24px;min-height:440px}
.cp-i h2{margin:0 0 32px;font-size:26px}
.cp-rows{display:grid;gap:32px;position:relative;z-index:1}
.cp-r{display:flex;gap:20px;align-items:flex-start}
.cp-ic{width:44px;height:44px;flex:none;border-radius:50%;background:rgba(255,255,255,.12);display:grid;place-items:center}
.cp-link{color:inherit;text-decoration:none;display:block;transition:opacity 0.2s}
.cp-link:hover{opacity:0.85}
.cp-link b{display:block;font-weight:600}
.cp-link div{color:rgba(255,255,255,.85);line-height:1.6}
.cp-o{position:absolute;border-radius:50%;background:rgba(255,255,255,.1);right:-60px;bottom:-150px;width:300px;height:300px}
.cp-o+.cp-o{right:90px;width:190px;height:190px;background:rgba(255,255,255,.06)}
.cp-f{display:grid;gap:20px;align-content:start;padding:12px}
.cp-2{display:grid;gap:20px}
.cp label{display:block;margin-bottom:8px}
.cp-in{width:100%;font:inherit;color:var(--t);background:var(--b);border:1px solid var(--l);border-radius:8px;padding:14px;box-sizing:border-box}
.cp-in:focus{outline:2px solid var(--p);border-color:transparent}
.cp-in[aria-invalid=true]{border-color:#d32f2f}
textarea.cp-in{min-height:170px;resize:vertical}
.cp-er{color:#d32f2f;font-size:13px;margin-top:4px}
.cp-al{padding:12px 16px;border-radius:8px;background:#e6f4ea;color:#1e4620}
.cp-al.e{background:#fdecea;color:#611a15}
.cp-bt{display:inline-flex;align-items:center;gap:8px;height:52px;padding:0 32px;border:0;border-radius:8px;background:var(--p);color:#fff;font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none;transition:background 0.2s}
.cp-bt:hover{background:var(--mui-palette-primary-dark, #15294a)}
.cp-bt:disabled{opacity:.6;cursor:default}
@media(min-width:600px){.cp-2{grid-template-columns:1fr 1fr}}
@media(min-width:900px){.cp-cols{gap:32px;grid-template-columns:1fr 1.15fr}.cp-i{padding:32px}.cp-f{padding:24px 24px 0 0}}
`

const Ic = ({ children, s = 20 }: { children: ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const ROWS: [ReactNode, string, ReactNode, string][] = [
  [<Ic><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Ic>, 'Location',
    <>02 Aubrey Matlala Road, Block K, Soshanguve<br />Building 18, TUT Soshanguve South Campus<br />Pretoria, Gauteng<br />South Africa</>, MAPS_URL],
  [<Ic><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Ic>, 'Email', 'admin@icep.co.za', 'mailto:admin@icep.co.za'],
  [<Ic><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Ic>, 'Call', '012 382 9598', 'tel:+27123829598'],
]

export interface ContactMessage { name: string; email: string; subject: string; message: string }
type Key = keyof ContactMessage

const FIELDS: [Key, string, string, string, (v: string) => boolean, string][] = [
  ['name', 'Your name', 'Enter your name', 'name', (v) => !!v.trim(), 'Enter your name'],
  ['email', 'Your email', 'name@example.com', 'email', (v) => /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email address'],
  ['subject', 'Subject', 'What is your message about?', '', (v) => !!v.trim(), 'Enter a subject'],
  ['message', 'Message', 'Write your message here', '', (v) => !!v.trim(), 'Write a message'],
]
const EMPTY: ContactMessage = { name: '', email: '', subject: '', message: '' }

function ContactForm({ onSubmit }: { onSubmit?: (m: ContactMessage) => Promise<void> | void }) {
  const [v, setV] = useState(EMPTY)
  const [err, setErr] = useState<Partial<Record<Key, string>>>({})
  const [st, setSt] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const bad = Object.fromEntries(FIELDS.filter(([k, , , , ok]) => !ok(v[k])).map(([k, , , , , m]) => [k, m]))
    setErr(bad)
    if (Object.keys(bad).length) return
    setSt('sending')
    try { await onSubmit?.(v); setV(EMPTY); setSt('sent') } catch { setSt('error') }
  }

  const field = ([k, label, ph, ac]: (typeof FIELDS)[number], index: number) => {
    const id = `contact-${k}`
    const p = {
      id, className: 'cp-in', placeholder: ph, value: v[k], 'aria-invalid': !!err[k],
      'aria-describedby': err[k] ? `${id}-e` : undefined,
      onChange: (e: { target: { value: string } }) => setV((o) => ({ ...o, [k]: e.target.value })),
    }
    return (
      <Box key={k} sx={introSx(600 + index * 100)}>
        <label htmlFor={id}>{label}</label>
        {k === 'message' ? <textarea {...p} /> : <input {...p} type={k === 'email' ? 'email' : 'text'} autoComplete={ac || undefined} />}
        {err[k] && <div className="cp-er" id={`${id}-e`}>{err[k]}</div>}
      </Box>
    )
  }

  return (
    <form className="cp-f" onSubmit={submit} noValidate>
      <div className="cp-2">{FIELDS.slice(0, 2).map((f, i) => field(f, i))}</div>
      {FIELDS.slice(2).map((f, i) => field(f, i + 1))}
      
      {st === 'sent' && <Box sx={introSx(900)}><div className="cp-al" role="status">Message sent. The ICEP team will get back to you.</div></Box>}
      {st === 'error' && <Box sx={introSx(900)}><div className="cp-al e" role="alert">Your message was not sent. Check your connection and try again.</div></Box>}
      
      <Box sx={introSx(900)}>
        <button className="cp-bt" type="submit" disabled={st === 'sending'}>{st === 'sending' ? 'Sending…' : 'Send message'}</button>
      </Box>
    </form>
  )
}

function ContactHeader() {
  const { ref, p } = useReveal<HTMLDivElement>()
  
  return (
    <Paper
      ref={ref}
      component="section"
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'rgba(255,255,255,.14)',
        bgcolor: navy,
        color: '#fff',
        ...riseSx(p, 0)
      }}
    >
      <Typography
        sx={{
          color: '#D7DFE9',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          ...introSx(0)
        }}
      >
        ICEP · Work-integrated learning
      </Typography>
      <RevealTitle 
        id="contact-title" 
        component="h1" 
        text="Get in touch" 
        delay={150} 
        sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 750, mt: 0.5 }} 
      />
      <Typography 
        sx={{ 
          color: '#D7DFE9', 
          mt: 0.5, 
          fontSize: { xs: 15, md: 17 }, 
          lineHeight: 1.6, 
          maxWidth: 800,
          ...introSx(550)
        }}
      >
        Have a question about WIL placements? Send us a message and the ICEP team will get back to you.
      </Typography>
    </Paper>
  )
}

export function ContactPage({ onSendMessage }: { onSendMessage?: (m: ContactMessage) => Promise<void> | void }) {
  return (
    <section className="cp">
      <style>{CSS}</style>
      <CursorFollower />
      <div className="cp-w">
        <ContactHeader />
        
        <div className="cp-c">
          <div className="cp-cols">
            <div className="cp-i">
              <Box sx={introSx(600)}>
                <h2>Contact information</h2>
              </Box>
              <div className="cp-rows">
                {ROWS.map(([icon, title, text, url], i) => (
                  <Box className="cp-r" key={title} sx={introSx(700 + i * 100)}>
                    <div className="cp-ic">{icon}</div>
                    <a href={url as string} target="_blank" rel="noopener noreferrer" className="cp-link">
                      <b>{title}</b><div>{text}</div>
                    </a>
                  </Box>
                ))}
              </div>
              <div className="cp-o" aria-hidden="true" /><div className="cp-o" aria-hidden="true" />
            </div>
            
            <ContactForm onSubmit={onSendMessage} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactPage