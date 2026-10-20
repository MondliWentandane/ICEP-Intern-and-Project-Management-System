import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

/** frontend/src/features/public-site/pages/ContactPage.tsx (route /contact already exists). Styles are included below. */

const CAMPUS = {
  name: 'Tshwane University of Technology - Soshanguve South Campus - TUT',
  address: 'Block K, 2 Aubrey Matlakala St, Soshanguve - K, Soshanguve, 0152',
  embedUrl: 'https://maps.google.com/maps?q=-25.5401753,28.0968938&z=17&hl=en&output=embed', // live map, no API key
  mapsUrl:
    'https://www.google.com/maps/place/Tshwane+University+of+Technology+-+Soshanguve+South+Campus+-+TUT/@-25.5401753,28.0968938,17z/data=!3m1!4b1!4m6!3m5!1s0x1ebfcf9c4eedb233:0x9e2de5e61f9e48e7!8m2!3d-25.5401753!4d28.0968938!16s%2Fm%2F0dkfwvn?entry=ttu&g_ep=EgoyMDI2MTAxNC4wIKXMDSoASAFQAw%3D%3D' +
    encodeURIComponent('Tshwane University of Technology Soshanguve South Campus'),
}

const CSS = `
.cp{--p:var(--mui-palette-primary-main,#1f3a68);--t:var(--mui-palette-text-primary,#0f1a2b);--m:var(--mui-palette-text-secondary,#5b6678);--b:var(--mui-palette-background-paper,#fff);--l:var(--mui-palette-divider,#d9dee7);--e:cubic-bezier(.65,0,.35,1);color:var(--t)}
.cp *{box-sizing:border-box}
.cp-w{max-width:1200px;margin:0 auto;padding:40px 24px}
.cp-h{text-align:center;margin-bottom:48px}
.cp-h h1{font-size:clamp(32px,4.5vw,44px);margin:0 0 12px}
.cp-h p{margin:0;color:var(--m);font-size:clamp(16px,2vw,20px)}
.cp-st{display:grid;gap:32px}
.cp-on .cp-st{gap:0;overflow:hidden}
.cp-on .cp-ly{grid-area:1/1;will-change:opacity,transform}
.cp-on .cp-a{z-index:2;transition:transform .7s var(--e),opacity .3s ease 0s,visibility 0s linear 0s}
.cp-on.is-map .cp-a{transform:translateX(-110%);opacity:0;visibility:hidden;pointer-events:none;transition:transform .7s var(--e),opacity .3s ease .4s,visibility 0s linear .7s}
.cp-on .cp-z{display:flex;flex-direction:column;opacity:0;visibility:hidden;pointer-events:none;transform:scale(.97);transition:opacity .45s ease 0s,transform .5s ease 0s,visibility 0s linear .5s}
.cp-on .cp-z>*{flex:1}
.cp-on.is-map .cp-z{opacity:1;visibility:visible;pointer-events:auto;transform:scale(1);transition:opacity .45s ease .3s,transform .5s ease .3s,visibility 0s linear 0s}
.cp-c,.cp-mc{background:var(--b);border:1px solid var(--l);border-radius:16px;padding:12px}
.cp-cols{display:grid;gap:24px}
.cp-i{position:relative;overflow:hidden;background:var(--p);color:#fff;border-radius:12px;padding:24px;min-height:440px}
.cp-i h2{margin:0 0 32px;font-size:26px}
.cp-rows{display:grid;gap:32px;position:relative;z-index:1}
.cp-r{display:flex;gap:20px;align-items:flex-start}
.cp-ic{width:44px;height:44px;flex:none;border-radius:50%;background:rgba(255,255,255,.12);display:grid;place-items:center}
.cp-r b{display:block;font-weight:600}
.cp-r div div{color:rgba(255,255,255,.85);line-height:1.6}
.cp-o{position:absolute;border-radius:50%;background:rgba(255,255,255,.1);right:-60px;bottom:-150px;width:300px;height:300px}
.cp-o+.cp-o{right:90px;width:190px;height:190px;background:rgba(255,255,255,.06)}
.cp-f{display:grid;gap:20px;align-content:start;padding:12px}
.cp-2{display:grid;gap:20px}
.cp label{display:block;margin-bottom:8px}
.cp-in{width:100%;font:inherit;color:var(--t);background:var(--b);border:1px solid var(--l);border-radius:8px;padding:14px}
.cp-in:focus{outline:2px solid var(--p);border-color:transparent}
.cp-in[aria-invalid=true]{border-color:#d32f2f}
textarea.cp-in{min-height:170px;resize:vertical}
.cp-er{color:#d32f2f;font-size:13px;margin-top:4px}
.cp-al{padding:12px 16px;border-radius:8px;background:#e6f4ea;color:#1e4620}
.cp-al.e{background:#fdecea;color:#611a15}
.cp-bt{display:inline-flex;align-items:center;gap:8px;height:52px;padding:0 32px;border:0;border-radius:8px;background:var(--p);color:#fff;font:inherit;font-size:16px;font-weight:600;cursor:pointer;text-decoration:none}
.cp-bt:disabled{opacity:.6;cursor:default}
.cp-bt.s{height:42px;padding:0 18px}
.cp-mc{display:flex;flex-direction:column}
.cp-mp{position:relative;flex:1;min-height:360px;border-radius:12px;overflow:hidden;background:#e8ebf0}
.cp-mp iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.cp-sh{position:absolute;inset:0;z-index:1;cursor:pointer;display:flex;align-items:flex-end;justify-content:flex-end;padding:16px}
.cp-sh span{font-size:13px;color:#fff;background:rgba(15,26,43,.75);padding:4px 12px;border-radius:8px}
.cp-pp{position:absolute;z-index:2;top:20px;left:20px;max-width:calc(100% - 40px);padding:20px;border-radius:12px;background:var(--b);border:1px solid var(--l)}
.cp-pp h3{margin:0 0 8px;font-size:18px;line-height:1.3}
.cp-pp p{margin:0 0 12px;color:var(--m);font-size:15px}
@media(min-width:600px){.cp-2{grid-template-columns:1fr 1fr}}
@media(min-width:900px){.cp-w{padding:64px 24px}.cp-cols{gap:32px;grid-template-columns:1fr 1.15fr}.cp-i{padding:32px}.cp-f{padding:24px 24px 0 0}.cp-mp{min-height:450px}.cp-pp{max-width:400px}}
`

const Ic = ({ children, s = 20 }: { children: ReactNode; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const ROWS: [ReactNode, string, ReactNode][] = [
  [<Ic><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></Ic>, 'Location',
    <>02 Aubrey Matlala Road, Block K, Soshanguve<br />Building 18, TUT Soshanguve South Campus<br />Pretoria, Gauteng<br />South Africa</>],
  [<Ic><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Ic>, 'Email', 'admin@icep.co.za'],
  [<Ic><rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" /></Ic>, 'Call', '012 382 9598'],
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

  const field = ([k, label, ph, ac]: (typeof FIELDS)[number]) => {
    const id = `contact-${k}`
    const p = {
      id, className: 'cp-in', placeholder: ph, value: v[k], 'aria-invalid': !!err[k],
      'aria-describedby': err[k] ? `${id}-e` : undefined,
      onChange: (e: { target: { value: string } }) => setV((o) => ({ ...o, [k]: e.target.value })),
    }
    return (
      <div key={k}>
        <label htmlFor={id}>{label}</label>
        {k === 'message' ? <textarea {...p} /> : <input {...p} type={k === 'email' ? 'email' : 'text'} autoComplete={ac || undefined} />}
        {err[k] && <div className="cp-er" id={`${id}-e`}>{err[k]}</div>}
      </div>
    )
  }

  return (
    <form className="cp-f" onSubmit={submit} noValidate>
      <div className="cp-2">{FIELDS.slice(0, 2).map(field)}</div>
      {FIELDS.slice(2).map(field)}
      {st === 'sent' && <div className="cp-al" role="status">Message sent. The ICEP team will get back to you.</div>}
      {st === 'error' && <div className="cp-al e" role="alert">Your message was not sent. Check your connection and try again.</div>}
      <div><button className="cp-bt" type="submit" disabled={st === 'sending'}>{st === 'sending' ? 'Sending…' : 'Send message'}</button></div>
    </form>
  )
}

function MapCard() {
  // The live map would capture the mouse wheel and trap page scrolling, so it is interactive only after a click.
  const [on, setOn] = useState(false)
  return (
    <div className="cp-mc">
      <div className="cp-mp" onMouseLeave={() => setOn(false)}>
        <iframe src={CAMPUS.embedUrl} title="Map of TUT Soshanguve South Campus" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        {!on && <div className="cp-sh" onClick={() => setOn(true)}><span>Click the map to zoom and move</span></div>}
        <div className="cp-pp">
          <h3>{CAMPUS.name}</h3>
          <p>{CAMPUS.address}</p>
          <a className="cp-bt s" href={CAMPUS.mapsUrl} target="_blank" rel="noopener noreferrer">
            <Ic s={18}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Ic> Open in Maps
          </a>
        </div>
      </div>
    </div>
  )
}

/**
 * Both frames sit in the same spot. Scroll down until the end of the contact frame is on screen; the next scroll
 * (wheel, swipe or arrow/page keys) swipes it left and shows the whole map frame. Scroll up until the top of the
 * frame is on screen and scroll once more to swipe the contact frame back. Wide screens only; stacked elsewhere.
 */
const SWAP = '(min-width:900px) and (prefers-reduced-motion: no-preference)'

function ScrollSwap({ first, second }: { first: ReactNode; second: ReactNode }) {
  const [swap, setSwap] = useState(() => matchMedia(SWAP).matches)
  const [map, setMap] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const shown = useRef(false)
  const lock = useRef(0)

  useEffect(() => {
    const mq = matchMedia(SWAP), f = () => setSwap(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  useEffect(() => {
    if (!swap) return
    const go = (n: boolean) => { shown.current = n; setMap(n); lock.current = Date.now() + 900 } // ignore rest of gesture
    const handle = (dir: 1 | -1) => { // true = gesture used for the swap, page must not scroll
      const r = stage.current?.getBoundingClientRect()
      if (!r || !(r.top < innerHeight - 80 && r.bottom > 80)) return false
      if (Date.now() < lock.current) return true
      if (dir === 1 && !shown.current && r.bottom <= innerHeight - 8) { go(true); return true }
      if (dir === -1 && shown.current && r.top >= -20) { go(false); return true }
      return false
    }
    const inField = (e: Event, sel: string) => !!(e.target as HTMLElement | null)?.closest?.(sel)
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < 2 || inField(e, 'textarea')) return
      if (handle(e.deltaY > 0 ? 1 : -1)) e.preventDefault()
    }
    let y0 = 0
    const ts = (e: TouchEvent) => { y0 = e.touches[0].clientY }
    const tm = (e: TouchEvent) => {
      const dy = y0 - e.touches[0].clientY
      if (Math.abs(dy) > 24 && handle(dy > 0 ? 1 : -1)) { e.preventDefault(); y0 = e.touches[0].clientY }
    }
    const key = (e: KeyboardEvent) => {
      if (inField(e, 'input,textarea,select,button,a,[contenteditable]')) return
      const down = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)
      const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)
      if ((down || up) && handle(down ? 1 : -1)) e.preventDefault()
    }
    addEventListener('wheel', wheel, { passive: false })
    addEventListener('touchstart', ts, { passive: true })
    addEventListener('touchmove', tm, { passive: false })
    addEventListener('keydown', key)
    return () => {
      removeEventListener('wheel', wheel)
      removeEventListener('touchstart', ts)
      removeEventListener('touchmove', tm)
      removeEventListener('keydown', key)
    }
  }, [swap])

  return (
    <div className={`${swap ? 'cp-on' : ''}${swap && map ? ' is-map' : ''}`}>
      <div className="cp-st" ref={stage}>
        <div className="cp-ly cp-a" aria-hidden={swap && map}>{first}</div>
        <div className="cp-ly cp-z" aria-hidden={swap && !map}>{second}</div>
      </div>
    </div>
  )
}

export function ContactPage({ onSendMessage }: { onSendMessage?: (m: ContactMessage) => Promise<void> | void }) {
  return (
    <section className="cp">
      <style>{CSS}</style>
      <div className="cp-w">
        <div className="cp-h">
          <h1>Get in touch</h1>
          <p>Have a question about WIL placements? Send us a message and the ICEP team will get back to you.</p>
        </div>
        <ScrollSwap
          first={
            <div className="cp-c">
              <div className="cp-cols">
                <div className="cp-i">
                  <h2>Contact information</h2>
                  <div className="cp-rows">
                    {ROWS.map(([icon, title, text]) => (
                      <div className="cp-r" key={title}>
                        <div className="cp-ic">{icon}</div>
                        <div><b>{title}</b><div>{text}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="cp-o" aria-hidden="true" /><div className="cp-o" aria-hidden="true" />
                </div>
                <ContactForm onSubmit={onSendMessage} />
              </div>
            </div>
          }
          second={<MapCard />}
        />
      </div>
    </section>
  )
}

export default ContactPage