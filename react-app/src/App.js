import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import SignupPage from "./pages/Signup";
import LoginPage from "./pages/login/Login";
import Matches from "./pages/match/Matches";
import Records from "./pages/record/Records";
import Players from "./pages/player/Players";
import Profile from "./pages/profile/Profile";
import ProfileEdit from "./pages/profile/ProfileEdit";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import RedirectURI from "./pages/login/LoginCallback";
import PlayerDetails from "./pages/player/PlayerDetails";
import ProtectedRoute from "./context/ProtectedRoute";
import MatchDetails from "./pages/match/details/MatchDetails";
import MatchDetailsAdd from "./pages/match/details/MatchDetailsAdd";
import MatchDetailsEdit from "./pages/match/details/MatchDetailsEdit";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/callback" element={<RedirectURI />} />
            <Route path="/signup" element={<SignupPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:match_idx" element={<MatchDetails />} />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:user_idx/:cardClass" element={<PlayerDetails />}/>
              <Route path="/records" element={<Records />} />
              <Route path="/matches/add" element={<MatchDetailsAdd />} />
              <Route path="/matches/:match_idx/edit" element={<MatchDetailsEdit />}/>
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </AlertProvider>
  );
}

serviceWorkerRegistration.register();