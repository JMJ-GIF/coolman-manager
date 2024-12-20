import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import LoginInputBox from '../components/LoginInputBox';
import './Signup.scss';

function SignupPage() {
    
    const [role, setRole] = useState(""); 
    const [formData, setFormData] = useState({ username: "", password: "" });   
    const navigate = useNavigate();
    const handleLogin = (e) => {
        e.preventDefault(); 
        navigate('/');
      };
    const handleSubmit = (e) => {
        e.preventDefault(); 
        if (formData.username && formData.password && role) {
            navigate('/home');
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleRoleChange = (event) => {
        setRole(event.target.value);
    };
    const isFormValid = formData.username && formData.password && role;

    return (
    <div className='img-background'>
        <div className="signup-frame">
            <div className="signup-container">
                <div className='signup-header'>
                    <h2>회원가입</h2>                
                    <div className="login-prompt">
                        <p>이미 계정이 있으신가요?</p>
                        <p className="login-link" onClick={handleLogin}>로그인</p>
                    </div>                                                    
                </div>
                <div className='signup-info'>
                    <form onSubmit={handleSubmit}>
                        <LoginInputBox
                                formData={formData} 
                                handleInputChange={handleInputChange} 
                        />                        
                    </form>
                </div>
                <div className='signup-footer'>
                    <div className="role-selection">
                        <p>역할 선택</p>
                        <div className="radio-group">
                            <label>
                                <input type="radio" name="role" value="player" onChange={handleRoleChange}/>
                                선수
                            </label>
                            <label>
                                <input type="radio" name="role" value="coach" onChange={handleRoleChange}/>
                                감독
                            </label>
                        </div>
                    </div>
                    <button type="submit" onClick={handleSubmit} disabled={!isFormValid}>
                        제출하기
                    </button>
                    <div className={`confirmation-message ${role ? "visible" : ""}`}>                        
                        <p>확인을 누르시면 심사 승인 이후 계정이 활성화됩니다.</p>
                    </div>
                </div>
            </div>            
        </div>        
    </div>
);
}

export default SignupPage;