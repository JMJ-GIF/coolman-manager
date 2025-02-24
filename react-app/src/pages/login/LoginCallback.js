import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import LoadingSpinner from "../../components/LoadingSpinner";

const RedirectURI = () => {
  const API_URL = process.env.REACT_APP_API_URL;
  const navigate = useNavigate();

  const loginUser = async (user_idx) => {
    try {
      await axios.post(`${API_URL}/auth/login`,{ user_idx },{ withCredentials: true });      
      navigate("/matches");
    } catch (error) {
      console.error("❌ 로그인 실패:", error.response?.data);
    }
  };
  
  const checkUserExists = async (uuid, name) => {
    try {      
      const response = await axios.get(`${API_URL}/users/uuid/exists?uuid=${uuid}`);      

      if (response.data.exists) {                
        loginUser(response.data.user_idx);        

      } else {                
        navigate("/signup", { state: { name, uuid } }); 

      }
    } catch (error) {
      console.error("❌ 유저 존재 여부 확인 실패:", error);
    }
  };
  
  const getUserInfo = async (accessToken) => {
    try {
      const response = await axios.get(`${API_URL}/auth/naver/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`, 
        },
      });
      console.log(response.data.id)
      
      checkUserExists(response.data.id, response.data.name);

    } catch (error) {
      console.error("❌ Naver 사용자 정보 요청 오류:", error);
    }
  };

  const getAccessToken = async (code, state) => {    
    try {
        const response = await axios.get(`${API_URL}/auth/naver/token`, {
            params : {
                code: code,
                state: state
            },
        });                

      if (response.data.access_token) {
        getUserInfo(response.data.access_token);
      } else {
        console.error("❌ Naver Access Token 발급 실패:", response.data);
      }
    } catch (error) {
      console.error("❌ Naver Access Token 요청 오류:", error);
    }
  };
  
  useEffect(() => {        
    let code = new URL(window.location.href).searchParams.get("code");
    let state = new URL(window.location.href).searchParams.get("state");

    if (code) {
        getAccessToken(code, state);
      }
  }, []);

  return (
    <div>
      <LoadingSpinner />      
    </div>
  );
};

export default RedirectURI;