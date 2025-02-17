import "./Profile.scss";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import FloatingBar from "../../components/FloatingBar";
import NavigationBar from "../../components/NavigationBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import back_arrow from "../../assets/icons/back_arrow.svg";
import userProfile from "../../assets/images/transparent-profile.png";

function Profile() {
    const { user } = useAuth(); 
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);    

    useEffect(() => {
        if (!user) {
            navigate("/login");
        }
    }, [user, navigate]);

    return (
        <div className="gray-background">
            <div className="content">
                <div className="top-floating-area">
                    <img src={back_arrow} alt="back" onClick={() => navigate("/home")} />
                </div>
                <div className="profile-container">
                    {/* <img src={userProfile} alt="profile" className="profile-image" /> */}
                    <h2>{user ? `User ID: ${user.user_idx}` : "Loading..."}</h2>  {/* ✅ user_idx 출력 */}
                </div>
            </div>
            {loading && <LoadingSpinner />}
        </div>
    );
}

export default Profile;
