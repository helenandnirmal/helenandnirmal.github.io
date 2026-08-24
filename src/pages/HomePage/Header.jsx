import { useState } from 'react'
import { BsArchive } from 'react-icons/bs'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="header">
      <div className="container">
        <nav className="navbar" aria-label="Main navigation">
          <a className="navbar-brand" href="/">
            Helen + Nirmal
          </a>

          <div className="header-menu">
            <button
              type="button"
              className="archive-trigger"
              aria-label="Open travel information"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <BsArchive size={20} />
            </button>

            {isMenuOpen && (
              <div className="archive-menu" role="menu">
                <a
                  className="archive-link"
                  href="https://docs.google.com/presentation/d/1otlYDur3QqItYxROLpezvUUhlgLxIFV2jVjo-bU56j8/edit?usp=sharing"
                  target="_blank"
                  rel="noreferrer"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Travel to Chennai for the Wedding
                </a>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Header
