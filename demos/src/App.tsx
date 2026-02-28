import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import GrublerVisualization from './topics/grublers-formula/GrublerVisualization'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/grublers-formula" element={<GrublerVisualization />} />
      </Routes>
    </HashRouter>
  )
}

export default App
