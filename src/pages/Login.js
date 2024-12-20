import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.scss';
import LoginInputBox from '../components/LoginInputBox';
import ArrowIcon from '../assets/icons/chevron-right.svg';
import CoolmanIcon from '../assets/icons/coolman.svg';
import BandLogo from '../assets/icons/bandlogo.svg';

function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault(); 
    navigate('/home');    
  };

  const handleSignup = (e) => {
    e.preventDefault(); 
    navigate('/signup');
  };

  return (
    <div className="img-background">
      <div className="login-frame">        
        <div className="login-container">
          <div className="login-header">            
            <img src={CoolmanIcon} alt="로고" className="mobile-logo-team" />            
          </div>
          <div className="login-info">
            <form onSubmit={handleSubmit}>
              <LoginInputBox />
              <button type="submit">확인 
                <img src={ArrowIcon} alt="화살표 아이콘" className="icon" />
              </button>              
            </form>
          </div>          
          <div className="login-footer">
            <hr /> 
            <p className="signup-link" onClick={handleSignup}> 회원가입하기</p>
          </div>
        </div>        
      </div>
      <div className='logo-frame'>
        <img src={CoolmanIcon} alt="로고" className="logo-team" />
        <a href="https://band.us/band/70861479/" target="_blank" rel="noopener noreferrer">
          <img src={BandLogo} alt="밴드" className="logo-sns" />
        </a>
      </div>      
    </div>
  );
}

export default LoginPage;