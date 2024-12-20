import React from 'react';
import { useNavigate } from 'react-router-dom';
import LoginInputBox from '../components/LoginInputBox';
import './Signup.scss';

function SignupPage() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault(); 
        navigate('/');
      };

    const handleSubmit = (e) => {
        e.preventDefault(); 
        navigate('/home');    
      };

    return (
    <div className='img-background'>
        <div className="signup-frame">
            <div className="signup-container">
                <div className='signup-header'>
                    <h2>회원가입</h2>                
                    <div className="login-prompt">
                        <p>이미 계정이 있으신가요?</p>
                        <p className="login-link" onClick={handleLogin}>
                            로그인
                        </p>
                    </div>                                                    
                </div>
                <div className='signup-info'>
                    <form onSubmit={handleSubmit}>
                        <LoginInputBox />                        
                    </form>
                </div>
                <div className='signup-footer'>
                </div>
            </div>
        </div>        
    </div>
);
}

export default SignupPage;