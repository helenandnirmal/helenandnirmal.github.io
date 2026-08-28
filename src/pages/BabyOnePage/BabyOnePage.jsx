import { useEffect, useRef, useState } from 'react'
import EventSection from '../../components/EventSection'
import './BabyOnePage.css'

const API_URL = import.meta.env.VITE_INVITE_API_URL ||
  'https://script.google.com/macros/s/AKfycby73ZU-6XbjBZ2bGcXKmt2thnV-hluqeT5NwWxKy6KMmgJYFRAKV2sF40OFoS7bOEfk/exec'

function BabyOnePage() {
  const [firstName, setFirstName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [invite, setInvite] = useState(null)
  const [lookupState, setLookupState] = useState('idle')
  const [responses, setResponses] = useState({})
  const [submitState, setSubmitState] = useState('idle')
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [emailState, setEmailState] = useState('idle')
  const rsvpFormRef = useRef(null)
  const submitMessageRef = useRef(null)
  const emailDialogRef = useRef(null)

  useEffect(() => {
    document.body.classList.add('baby-page-body')

    return () => document.body.classList.remove('baby-page-body')
  }, [])

  useEffect(() => {
    if (!invite || !rsvpFormRef.current) return undefined

    const frameId = requestAnimationFrame(() => {
      rsvpFormRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => cancelAnimationFrame(frameId)
  }, [invite])

  useEffect(() => {
    if (!['success', 'error'].includes(submitState) || !submitMessageRef.current) {
      return undefined
    }

    const frameId = requestAnimationFrame(() => {
      submitMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })

    return () => cancelAnimationFrame(frameId)
  }, [submitState])

  useEffect(() => {
    if (isEmailDialogOpen) {
      emailDialogRef.current?.querySelector('input')?.focus()
    }
  }, [isEmailDialogOpen])

  async function handleLookup(event) {
    event.preventDefault()
    setLookupState('loading')

    try {
      const query = new URLSearchParams({ name: firstName, passcode })
      const response = await fetch(`${API_URL}?${query}`)
      const result = await response.json()

      if (result.success !== true) {
        throw new Error('Invite lookup failed')
      }

      const people = Array.isArray(result.people) ? result.people : []
      const initialResponses = Object.fromEntries(
        people.map((person) => [person.id, {
          baptismRsvp: person.baptismRsvp,
          receptionRsvp: person.receptionRsvp,
        }]),
      )

      setInvite({ ...result, people })
      setResponses(initialResponses)
      setLookupState('success')
    } catch {
      setLookupState('error')
    }
  }

  function updateResponse(id, eventName, value) {
    setResponses((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [eventName]: value === 'true',
      },
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitState('submitting')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveRsvp',
          name: firstName,
          passcode,
          responses: invite.people.map((person) => ({
            id: Number(person.id),
            baptismRsvp: responses[person.id]?.baptismRsvp ? 1 : 0,
            receptionRsvp: responses[person.id]?.receptionRsvp ? 1 : 0,
          })),
        }),
      })
      const result = await response.json()

      if (result.success !== true) {
        throw new Error('RSVP submission failed')
      }

      setSubmitState('success')
    } catch {
      setSubmitState('error')
    }
  }

  async function handleEmailDetails(event) {
    event.preventDefault()
    setEmailState('sending')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'emailDetails',
          name: firstName,
          passcode,
          email,
        }),
      })
      const result = await response.json()

      if (result.success !== true) {
        throw new Error('Email details failed')
      }

      setEmailState('success')
    } catch {
      setEmailState('error')
    }
  }

  function handleCalendarDownload() {
    const calendar = createCalendarFile()
    const blob = new Blob([calendar], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'francis-noel-benann-baptism.ics'
    link.click()
    URL.revokeObjectURL(url)
  }

  const isLookingUp = lookupState === 'loading'
  const isSubmitting = submitState === 'submitting'
  const hasCompleteResponses = invite?.people.every((person) => {
    const response = responses[person.id]
    return typeof response?.baptismRsvp === 'boolean' &&
      typeof response?.receptionRsvp === 'boolean'
  })

  return (
    <main className="baby-page">
        <div className="baby-page-container">
          <nav className="baby-tabs" aria-label="Baby events">
            <button type="button" className="baby-tab baby-tab-active" aria-selected="true">
              Baptism
            </button>
            <button type="button" className="baby-tab" disabled aria-disabled="true">
              First Holy Communion
            </button>
            <button type="button" className="baby-tab" disabled aria-disabled="true">
              Confirmation
            </button>
          </nav>

          <header className="baby-heading">
            <p className="baby-eyebrow">You are invited to celebrate the</p>
            <h1>Baptism of Francis Noel Benann</h1>
          </header>

          <section className="invite-panel" aria-labelledby="invite-heading">
            <h2 id="invite-heading">Find your invitation</h2>
            <form className="invite-form" onSubmit={handleLookup}>
              <label>
                Enter your First Name
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  readOnly={Boolean(invite)}
                  required
                />
              </label>

              <label>
                Enter the passcode provided by Helen & Nirmal
                <input
                  type="password"
                  value={passcode}
                  onChange={(event) => setPasscode(event.target.value)}
                  readOnly={Boolean(invite)}
                  required
                />
              </label>

              {!invite && (
                <button type="submit" className="baby-submit" disabled={isLookingUp}>
                  {isLookingUp ? 'Looking up...' : 'Find invitation'}
                </button>
              )}
            </form>

            {lookupState === 'error' && (
              <p className="form-message form-message-error" role="alert">Trouble finding the invite! Please contact Helen & Nirmal.</p>
            )}
          </section>

          {invite && (
            <form ref={rsvpFormRef} className="rsvp-form rsvp-form-reveal" onSubmit={handleSubmit}>
              <EventSection
                title="Baptism on November 28, 2026 at 11am"
                details={[
                  <strong key="baptism-church">St. Elizabeth Ann Seton Catholic Church</strong>,
                  '2316 180th St SE, Bothell, WA 98012',
                ]}
              >
                <RsvpList
                  people={invite.people}
                  responses={responses}
                  eventName="baptismRsvp"
                  disabled={isSubmitting}
                  onChange={updateResponse}
                />
              </EventSection>

              <EventSection
                title="Lunch Reception on November 28, 2026 at 1pm"
                details={[
                  '19121 112th Ave NE, Bothell, WA 98011',
                  'Street parking is available, as well as parking next to the nearby retail shops.',
                  'Enter code 920257 after pressing the Delivery button on the intercom to access the building and proceed to the 3rd floor.',
                ]}
              >
                <RsvpList
                  people={invite.people}
                  responses={responses}
                  eventName="receptionRsvp"
                  disabled={isSubmitting}
                  onChange={updateResponse}
                />
              </EventSection>

              <p className="gift-note">
                With love, we kindly request no gifts. <br />Your presence and blessings are what matter most to us.
              </p>

              <button
                type="submit"
                className="baby-submit baby-submit-confirm"
                disabled={isSubmitting || !hasCompleteResponses}
              >
                {isSubmitting ? 'Saving RSVP...' : 'Submit RSVP'}
              </button>

              <div className="rsvp-secondary-actions">
                <button
                  type="button"
                  className="baby-submit baby-submit-secondary"
                  onClick={() => {
                    setEmailState('idle')
                    setIsEmailDialogOpen(true)
                  }}
                  disabled={isSubmitting}
                >
                  Email me these details
                </button>
                <button
                  type="button"
                  className="baby-submit baby-submit-secondary calendar-button-hidden"
                  onClick={handleCalendarDownload}
                  disabled={isSubmitting}
                >
                  Add to my Calendar
                </button>
              </div>

              {submitState === 'success' && (
                <p ref={submitMessageRef} className="form-message form-message-success" role="status">
                  Your RSVP has been saved.
                </p>
              )}
              {submitState === 'error' && (
                <p ref={submitMessageRef} className="form-message form-message-error" role="alert">
                  We could not save your RSVP. Please try again or contact Helen & Nirmal.
                </p>
              )}
            </form>
          )}
        </div>

        {isEmailDialogOpen && (
          <div className="email-dialog-backdrop" onMouseDown={() => setIsEmailDialogOpen(false)}>
            <section
              ref={emailDialogRef}
              className="email-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="email-dialog-heading"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="email-dialog-close"
                aria-label="Close email dialog"
                onClick={() => setIsEmailDialogOpen(false)}
              >
                ×
              </button>
              <h2 id="email-dialog-heading">Email me these details</h2>
              {emailState === 'success' ? (
                <p className="form-message form-message-success" role="status">
                  The invitation details have been sent to your email.
                </p>
              ) : (
                <form className="email-form" onSubmit={handleEmailDetails}>
                  <label>
                    Your email address
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                    />
                  </label>
                  <div className="email-dialog-actions">
                    <button type="button" className="baby-submit baby-submit-cancel" onClick={() => setIsEmailDialogOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="baby-submit" disabled={emailState === 'sending'}>
                      {emailState === 'sending' ? 'Sending...' : 'Send email'}
                    </button>
                  </div>
                  {emailState === 'error' && (
                    <p className="form-message form-message-error" role="alert">
                      We could not send the email. Please try again.
                    </p>
                  )}
                </form>
              )}
            </section>
          </div>
        )}
    </main>
  )
}

function createCalendarFile() {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Helen and Nirmal//Francis Noel Baptism//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    createCalendarEvent({
      uid: 'francis-noel-baptism-20261128@helenandnirmal.github.io',
      start: '20261128T190000Z',
      end: '20261128T200000Z',
      summary: 'Baptism of Francis Noel Benann',
      location: 'St. Elizabeth Ann Seton Catholic Church, 2316 180th St SE, Bothell, WA 98012',
    }),
    createCalendarEvent({
      uid: 'francis-noel-reception-20261128@helenandnirmal.github.io',
      start: '20261128T210000Z',
      end: '20261128T230000Z',
      summary: 'Lunch Reception for Baptism of Francis Noel Benann',
      location: '19121 112th Ave NE, Bothell, WA 98011',
      description: 'Street parking is available, as well as parking next to the nearby retail shops. Enter code 920257 after pressing the Delivery button on the intercom to access the building and proceed to the 3rd floor.',
    }),
    'END:VCALENDAR',
  ].join('\r\n')
}

function createCalendarEvent({ uid, start, end, summary, location, description = '' }) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${getCalendarTimestamp()}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeCalendarText(summary)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    description && `DESCRIPTION:${escapeCalendarText(description)}`,
    'END:VEVENT',
  ].filter(Boolean).join('\r\n')
}

function getCalendarTimestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeCalendarText(value) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

function RsvpList({ people, responses, eventName, disabled, onChange }) {
  return (
    <fieldset className="rsvp-list">
      {people.map((person) => (
        <div className="rsvp-row" key={person.id}>
          <span className="rsvp-name">{person.name}</span>
          <label>
            <input
              type="radio"
              name={`${eventName}-${person.id}`}
              value="true"
              checked={responses[person.id]?.[eventName] === true}
              onChange={(event) => onChange(person.id, eventName, event.target.value)}
              disabled={disabled}
              required
            />
            Accept
          </label>
          <label>
            <input
              type="radio"
              name={`${eventName}-${person.id}`}
              value="false"
              checked={responses[person.id]?.[eventName] === false}
              onChange={(event) => onChange(person.id, eventName, event.target.value)}
              disabled={disabled}
              required
            />
            Decline
          </label>
        </div>
      ))}
    </fieldset>
  )
}

export default BabyOnePage