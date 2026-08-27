function EventSection({ title, details, children }) {
  return (
    <div className="event-section text-center" data-aos="fade-up">
      <div className="event-title"><strong>{title}</strong></div>
      <div className="event-detail">
        {details.map((detail, index) => (
          <span key={index}>
            {index > 0 && <br />}
            {detail}
          </span>
        ))}
      </div>
      {children}
    </div>
  )
}

export default EventSection
