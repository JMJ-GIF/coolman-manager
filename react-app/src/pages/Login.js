import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Login.scss';
import LoginInputBox from '../components/LoginInputBox';
import ArrowIcon from '../assets/icons/chevron-right.svg';
import CoolmanIcon from '../assets/icons/coolman.svg';
import BandLogo from '../assets/icons/bandlogo.svg';

function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });   
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault(); 
    if (formData.username && formData.password) {
        navigate('/home');
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = (e) => {
    e.preventDefault(); 
    navigate('/signup');
  };

  const handleDemoNavigate = (e) => {
    e.preventDefault(); 
    navigate('/home');
  };
  const isFormValid = formData.username && formData.password;

  return (
    <div className="img-background">
      <div className="login-frame">        
        <div className="login-container">
          <div className="login-header">            
            <img src={CoolmanIcon} alt="로고" className="mobile-logo-team" />            
          </div>
          <div className="login-info">
            <form onSubmit={handleSubmit}>
              <LoginInputBox
                      formData={formData} 
                      handleInputChange={handleInputChange} 
              /> 
              <button type="submit" onClick={handleSubmit} disabled={!isFormValid}>확인 
                <img src={ArrowIcon} alt="화살표 아이콘" className="icon" />
              </button>              
            </form>
          </div>          
          <div className="login-footer">
            <hr /> 
            <div className="footer-actions">
              <p className="demo-link" onClick={handleDemoNavigate}>데모버전으로 이용하기</p>
              <p className="signup-link" onClick={handleSignup}>회원가입하기</p>
            </div>                        
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