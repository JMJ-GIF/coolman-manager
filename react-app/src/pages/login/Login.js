import './Login.scss';
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import CoolManLogo from '../../assets/images/coolman-logo-transparent.png';
import BandLogo from '../../assets/icons/bandlogo.svg';
import CoolManManager from '../../assets/icons/coolman.svg';
import NaverLogin from '../../assets/icons/naver_login.svg';

function LoginPage() {
  const STATE = 'coolman';
  const navigate = useNavigate();  
  const CLIENT_ID = process.env.REACT_APP_LOGIN_CLIENT_ID;   
  const NAVER_REDIRECT_URI = "http://127.0.0.1:3000/callback";
  const NAVER_AUTH_URL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&state=${STATE}&redirect_uri=${NAVER_REDIRECT_URI}`;
  
  const handleNaverLogin = (e) => {
    window.location.href = NAVER_AUTH_URL;
  };
  // const handleDemoLogin = (e) => {
  //   e.preventDefault(); 
  //   navigate('/matches');
  // }

  return (
    <div className="img-background">
      <div className="login-frame">
        <div className="login-header">
          <img src={CoolManLogo} alt="팀로고" className="team-logo" />
          <img src={CoolManManager} alt="서비스명" className="service-logo" />          
          <h2>반가워요! 로그인해주세요</h2>
        </div>
        <div className="login-middle">          
          <img src={NaverLogin} alt="로그인" className="naver-login-button" onClick={handleNaverLogin}/>            
          <hr className="divider"/>
        </div>
        <div className="login-bottom">
          {/* <p className="demo-link" onClick={handleDemoLogin}>로그인 없이 둘러보기</p>           */}
          <a href="https://band.us/band/70861479/" target="_blank" rel="noopener noreferrer">
            <img src={BandLogo} alt="밴드" className="logo-sns" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;