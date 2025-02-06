import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login'
import SignupPage from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Records from './pages/Records';
import Players from './pages/player/Players';
import PlayerDetails from './pages/player/PlayerDetails';
import Matches from './pages/match/Matches';
import MatchDetails from './pages/match/details/MatchDetails';
import MatchDetailsAdd from './pages/match/details/MatchDetailsAdd';
import MatchDetailsEdit from './pages/match/details/MatchDetailsEdit';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:match_id" element={<MatchDetails />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:user_idx/:cardClass" element={<PlayerDetails />} />
        <Route path="/records" element={<Records />} />        
        <Route path="/matches/add" element={<MatchDetailsAdd />} />
        <Route path="/matches/:match_id/edit" element={<MatchDetailsEdit />} />
      </Routes>
    </Router>
  );
}
