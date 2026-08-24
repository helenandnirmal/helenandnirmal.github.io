function EventSection({ title, details }) {
  return (
    <div className="event-section text-center" data-aos="fade-up">
      <div className="event-title"><strong>{title}</strong></div>
      <div className="event-detail">
        {details.map((detail, index) => (
          <span key={`${detail}-${index}`}>
            {index > 0 && <br />}
            {detail}
          </span>
        ))}
      </div>
    </div>
  )
}

export default EventSection
