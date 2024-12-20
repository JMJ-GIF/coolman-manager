import React from 'react';
import './LoginInputBox.scss';

function LoginInputBox() {
  return (    
    <>
      <div id='1' className="login-input">
        <label htmlFor="username">아이디</label>
        <input type="text" id="username" name="username" />
      </div>
      <div id='2' className="login-input">
        <label htmlFor="password">비밀번호</label>
        <input type="password" id="password" name="password" />
      </div>
    </>
  );
}

export default LoginInputBox;
