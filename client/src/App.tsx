import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/SignUp'
import AuctionRoom from './pages/AuctionRoom'
import NewAuction from './pages/NewAuction'
import MyAuctions from './pages/MyAuctions'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auction/:id" element={<AuctionRoom />} />
            <Route path="/sell/new" element={<NewAuction />} />
            <Route path="/seller/:id/auctions" element={<MyAuctions />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App