import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); 

  const fetchUser = async () => {
    setLoading(true); 
  
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      setAuthUser(response.data);
    } catch (error) {
      console.warn("❌ 유저 정보 가져오기 실패:", error.response?.data);
  
      if (error.response?.status === 401 && !isRefreshing) {
        console.log("🔄 access_token 만료됨. refresh_token으로 갱신 시도...");
        setIsRefreshing(true);
  
        try {
          await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
          console.log("✅ access_token 갱신 성공!");
  
          setIsRefreshing(false);
          await fetchUser();
          return;
        } catch (refreshError) {
          console.error("❌ refresh_token도 만료됨. 로그아웃 처리...");
          setAuthUser(null);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setAuthUser(null);
      }
    } finally {
      setLoading(false); 
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }); 
      setAuthUser(null); 
      console.log("🚪 로그아웃 완료!");
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
    }
  };
  
  useEffect(() => {
    fetchUser();
  }, []);

  return <AuthContext.Provider value={{ authUser, loading, fetchUser, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
