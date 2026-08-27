import HomePage from './pages/HomePage/HomePage'
import BabyOnePage from './pages/BabyOnePage/BabyOnePage'
import './App.css'

function App() {
  if (window.location.pathname.replace(/\/+$/, '') === '/francisnoel') {
    return <BabyOnePage />
  }

  return <HomePage />
}

export default App
