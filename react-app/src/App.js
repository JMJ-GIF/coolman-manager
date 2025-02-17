import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import SignupPage from './pages/Signup'
import LoginPage from './pages/login/Login'
import Matches from './pages/match/Matches';
import Records from './pages/record/Records';
import Players from './pages/player/Players';
import Profile from './pages/profile/Profile';
import { AuthProvider } from "./context/AuthContext";
import RedirectURI from './pages/login/LoginCallback'
import PlayerDetails from './pages/player/PlayerDetails';
import ProtectedRoute from "./components/ProtectedRoute";
import MatchDetails from './pages/match/details/MatchDetails';
import MatchDetailsAdd from './pages/match/details/MatchDetailsAdd';
import MatchDetailsEdit from './pages/match/details/MatchDetailsEdit';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/callback" element={<RedirectURI />} />
          <Route path="/signup" element={<SignupPage />} />
                    
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/matches/:match_id" element={<MatchDetails />} />
            <Route path="/players" element={<Players />} />
            <Route path="/players/:user_idx/:cardClass" element={<PlayerDetails />} />
            <Route path="/records" element={<Records />} />
            <Route path="/matches/add" element={<MatchDetailsAdd />} />
            <Route path="/matches/:match_id/edit" element={<MatchDetailsEdit />} />
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}