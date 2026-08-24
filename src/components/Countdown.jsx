import { useEffect, useState } from 'react'

const weddingDate = new Date('2024-12-28T11:25:00')

function getTimeUntilWedding(now = new Date()) {
  let years = now.getFullYear() - weddingDate.getFullYear()
  let months = now.getMonth() - weddingDate.getMonth()
  let days = now.getDate() - weddingDate.getDate()
  let hours = now.getHours() - weddingDate.getHours()
  let minutes = now.getMinutes() - weddingDate.getMinutes()
  let seconds = now.getSeconds() - weddingDate.getSeconds()

  if (seconds < 0) {
    seconds += 60
    minutes -= 1
  }

  if (minutes < 0) {
    minutes += 60
    hours -= 1
  }

  if (hours < 0) {
    hours += 24
    days -= 1
  }

  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
    days += prevMonth
    months -= 1
  }

  if (months < 0) {
    months += 12
    years -= 1
  }

  return { years, months, days, hours, minutes, seconds }
}

function Countdown() {
  const [timeParts, setTimeParts] = useState(() => getTimeUntilWedding())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeParts(getTimeUntilWedding())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div id="countdown" className="container text-center my-5" data-aos="fade-up">
      <h2 id="married-for-text" className="display-6">
        Married for
      </h2>
      <div className="countdown-grid">
        <div className="count-box">
          <h3 id="years" className="display-5">
            {timeParts.years}
          </h3>
          <p>Years</p>
        </div>
        <div className="count-box">
          <h3 id="months" className="display-5">
            {timeParts.months}
          </h3>
          <p>Months</p>
        </div>
        <div className="count-box">
          <h3 id="days" className="display-5">
            {timeParts.days}
          </h3>
          <p>Days</p>
        </div>
        <div className="count-box">
          <h3 id="hours" className="display-5">
            {timeParts.hours}
          </h3>
          <p>Hours</p>
        </div>
      </div>
    </div>
  )
}

export default Countdown
