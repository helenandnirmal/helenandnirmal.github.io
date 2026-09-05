import { useEffect, useRef, useState } from 'react'
import EventSection from '../../components/EventSection'
import './BabyOnePage.css'

const API_URL = import.meta.env.VITE_INVITE_API_URL ||
  'https://script.google.com/macros/s/AKfycbw7ocNUPGBQakjvp_qzc9Lj6qvG3rhlnPQp7GGhaeZMgHFDJ8wiMEwGjICUA5W_oZsx/exec'

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
        [eventName]: value === 'true' ? 1 : 0,
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
          responses: invite.people
            .map((person) => createRsvpResponse(person.id, responses[person.id]))
            .filter((response) => response.baptismRsvp !== undefined || response.receptionRsvp !== undefined),
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

  const isLookingUp = lookupState === 'loading'
  const isSubmitting = submitState === 'submitting'
  const hasResponsesToSubmit = invite?.people.some((person) => {
    const response = responses[person.id]
    return response?.baptismRsvp === 0 || response?.baptismRsvp === 1 ||
      response?.receptionRsvp === 0 || response?.receptionRsvp === 1
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
              <p className="baby-verse">
                "For this child I prayed; <br />and the Lord has granted me my petition which I made to Him."
              </p>
              <p className="baby-verse-reference">1 Samuel 1:27</p>
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
                title="Baptism Ceremony on November 28, 2026 at 11am"
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
                  <strong key="baptism-church">The Villas at Beardslee</strong>,
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
                disabled={isSubmitting || !hasResponsesToSubmit}
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

function createRsvpResponse(id, response = {}) {
  return {
    id: Number(id),
    ...(response.baptismRsvp === 0 || response.baptismRsvp === 1
      ? { baptismRsvp: response.baptismRsvp }
      : {}),
    ...(response.receptionRsvp === 0 || response.receptionRsvp === 1
      ? { receptionRsvp: response.receptionRsvp }
      : {}),
  }
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
              checked={responses[person.id]?.[eventName] === 1}
              onChange={(event) => onChange(person.id, eventName, event.target.value)}
              disabled={disabled}
            />
            Accept
          </label>
          <label>
            <input
              type="radio"
              name={`${eventName}-${person.id}`}
              value="false"
              checked={responses[person.id]?.[eventName] === 0}
              onChange={(event) => onChange(person.id, eventName, event.target.value)}
              disabled={disabled}
            />
            Decline
          </label>
        </div>
      ))}
    </fieldset>
  )
}

export default BabyOnePage