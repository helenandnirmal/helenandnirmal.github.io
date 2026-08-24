import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import Countdown from '../../components/Countdown'
import EventSection from '../../components/EventSection'
import './HomePage.css'

function HomePage() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AOS) {
      window.AOS.init({
        duration: 800,
        once: false,
        offset: 30,
      })
      window.AOS.refreshHard()
    }
  }, [])

  return (
    <>
      <Header />

      <main id="invitation" className="invitation text-green">
        <div className="container text-center" data-aos="fade-up">
          <h3 className="verse">
            "This is the Lord&apos;s doing; it is marvelous in our eyes." <br />
            (Ps 118:23)
          </h3>

          <h2 id="invitation-text" className="display-6 invitation-start hidden">
            We invite you to celebrate our wedding on
          </h2>
          <h1 className="display-3 wedding-date">Saturday, December 28, 2024</h1>
        </div>

        <Countdown />

        <EventSection
          title="Wedding Mass, 10:30AM"
          details={[
            <strong key="mass-location">National Shrine of St. Thomas Cathedral Basilica</strong>,
            '38, Santhome High Rd, Mylapore, Chennai, Tamil Nadu 600004',
          ]}
        />

        <EventSection
          title="Lunch Reception"
          details={[
            <strong key="reception-location">Archdiocesan Pastoral Centre</strong>,
            'No.25, Rosary Church Road, Mylapore, Chennai, Tamil Nadu 600004',
          ]}
        />

        <div className="video-container wedding-date" data-aos="fade-up">
          <video controls>
            <source src="/vid/our-story.mp4" type="video/mp4" />
          </video>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default HomePage
