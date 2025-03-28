import "./Profile.scss";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAlert } from "../../context/AlertContext";
import FloatingBar from "../../components/FloatingBar";
import back_arrow from "../../assets/icons/back_arrow.svg";
import LoadingSpinner from "../../components/LoadingSpinner";
import coolman_logo from "../../assets/images/coolman-logo-transparent.png";

const API_URL = process.env.REACT_APP_API_URL;

function formatDate(isoString) {
    if (!isoString) return ""; 
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
}

function Profile() {
    const { authUser, logout } = useAuth(); 
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const [user, setUser] = useState([]);
    const [loading, setLoading] = useState(false);  
    const [validImageUrl, setValidImageUrl] = useState(coolman_logo);

    const checkImageExists = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });
    };
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const userResponse = await axios.get(`${API_URL}/users/${authUser.user_idx}`);   
            const userData = userResponse.data;
            setUser(userData);
            
            if (userData.image_url) {
                const exists = await checkImageExists(userData.image_url);
                setValidImageUrl(exists ? userData.image_url : coolman_logo);
            } else {
                setValidImageUrl(coolman_logo);
            }
        } catch (error) {
            console.error("Error fetching user participation:", error);
            setUser([]);     
            setValidImageUrl(coolman_logo);  
        } finally {
            setLoading(false);
        }
    } 

    const handleEdit = () => {        
        navigate(`/profile/edit`);
    };    

    const handleLogout = async () => {
        await logout();  
        navigate("/"); 
    };

    const handleConfirmLogout = () => {
        showAlert("confirm", "로그아웃을 진행하시겠습니까?", async () => {
            await handleLogout();
        });
    };
    
    useEffect(() => {        
        if (!authUser) {
            navigate("/");
        }
        fetchData();
    }, [authUser, navigate]);

    return (
        <div className="gray-background">
            <div className="content">
                {loading && <LoadingSpinner />}
                <div className="top-floating-area">
                    <img src={back_arrow} alt="back" onClick={() => navigate("/matches")} />
                </div>
                <div className="profile-container">                    
                    <div className="user-image" style={{
                        backgroundImage: `url(${validImageUrl})`,
                    }}></div>
                    <div className='user-name'>{user.name}</div>
                    <div className="form-container">
                        <div className="info-box">
                            <span className="label">역할</span>
                            <span className="value">{user.role}</span>
                        </div>
                        <div className="info-box">
                            <span className="label">가입일자</span>
                            <span className="value">{formatDate(user.join_date)}</span>
                        </div>
                        <div className="info-box">
                            <span className="label">등번호</span>
                            <span className="value">{user.back_number}</span>
                        </div>                    
                        <div className="info-box">
                            <span className="label">포지션</span>
                            <span className="value">{user.position}</span>
                        </div>  
                    </div>                                   
                    <button className="logout-button" onClick={handleConfirmLogout}>
                        로그아웃
                    </button>
                </div>                
            </div>
            <FloatingBar onEdit={handleEdit} mode='edit'/>            
        </div>
    );
}

export default Profile;