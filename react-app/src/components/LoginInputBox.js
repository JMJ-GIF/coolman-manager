import React from 'react';
import './LoginInputBox.scss';

function LoginInputBox({ formData, handleInputChange }) {
  return (    
    <>
      <div id="1" className="login-input">
        <label htmlFor="username">아이디</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username} 
          onChange={handleInputChange} 
          placeholder="아이디를 입력하세요"
        />
      </div>
      <div id="2" className="login-input">
        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password} 
          onChange={handleInputChange}
          placeholder="비밀번호를 입력하세요"
        />
      </div>
    </>
  );
}

export default LoginInputBox;
