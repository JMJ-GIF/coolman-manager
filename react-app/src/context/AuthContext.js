import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); 

  const fetchUser = async () => {
    setLoading(true); 
  
    try {
      const response = await axios.get(`${API_URL}/auth/me`, { withCredentials: true });
      setUser(response.data);
    } catch (error) {
      console.warn("❌ 유저 정보 가져오기 실패:", error.response?.data);
  
      if (error.response?.status === 401 && !isRefreshing) {
        console.log("🔄 access_token 만료됨. refresh_token으로 갱신 시도...");
        setIsRefreshing(true);
  
        try {
          await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
          console.log("✅ access_token 갱신 성공!");
  
          setIsRefreshing(false);
          await fetchUser(); // ✅ refresh 성공 후 다시 fetchUser 실행
          return;
        } catch (refreshError) {
          console.error("❌ refresh_token도 만료됨. 로그아웃 처리...");
          setUser(null);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return <AuthContext.Provider value={{ user, loading, fetchUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
