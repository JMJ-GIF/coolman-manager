import './Login.scss';
import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import CoolManLogo from '../../assets/images/coolman-logo-transparent.png';
import BandLogo from '../../assets/icons/bandlogo.svg';
import CoolManManager from '../../assets/icons/coolman.svg';
import NaverLogin from '../../assets/icons/naver_login.svg';



function LoginPage() {
  const STATE = 'coolman';
  const navigate = useNavigate();  
  const { fetchUser } = useAuth();
  const API_URL = process.env.REACT_APP_API_URL;
  const CLIENT_ID = process.env.REACT_APP_LOGIN_CLIENT_ID;   
  const NAVER_REDIRECT_URL = process.env.REACT_APP_LOGIN_REDIRECT_URL;
  const NAVER_AUTH_URL = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${CLIENT_ID}&state=${STATE}&redirect_uri=${NAVER_REDIRECT_URL}`;
  console.log(NAVER_AUTH_URL)

  const handleNaverLogin = (e) => {
    window.location.href = NAVER_AUTH_URL;
  };
  const handleDemoLogin = async (e) => {
    e.preventDefault(); 
    try {
      const response = await axios.post(`${API_URL}/auth/demo-login`, {}, {withCredentials: true});
      console.log("✅ Demo 로그인 성공:", response.data);
      
      // AuthContext 상태 업데이트
      await fetchUser();

      // 상태 업데이트 후 페이지 이동
      navigate('/matches');
    } catch (error) {
      console.error("❌ Demo 로그인 실패:", error);
    }
  }

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
          <p className="demo-link" onClick={handleDemoLogin}>로그인 없이 둘러보기</p>                    
        </div>
      </div>
    </div>
  );
}

export default LoginPage;