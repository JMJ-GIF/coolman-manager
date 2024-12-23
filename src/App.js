import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login'
import SignupPage from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Matches from './pages/Matches';
import Players from './pages/Players';
import Records from './pages/Records';
import Gallery from './pages/Gallery';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/players" element={<Players />} />
        <Route path="/records" element={<Records />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </Router>
  );
}