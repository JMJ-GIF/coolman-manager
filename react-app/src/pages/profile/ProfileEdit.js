import "./Profile.scss";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import img_box from "../../assets/icons/img_box.svg";
import FloatingBar from "../../components/FloatingBar";
import ImageCropper from "../../components/ImageCropper";
import back_arrow from "../../assets/icons/back_arrow.svg";
import LoadingSpinner from "../../components/LoadingSpinner";
import userProfile from "../../assets/images/transparent-profile.png";


const API_URL = process.env.REACT_APP_API_URL;

function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
}

function ProfileEdit() {
    const { authUser } = useAuth();
    const navigate = useNavigate();
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCropper, setShowCropper] = useState(false);
    const [croppedImage, setCroppedImage] = useState(null);
    const [userImageUrl, setUserImageUrl] = useState(userProfile);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm({
        mode: "onChange",
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/users/${authUser.user_idx}`);
                setValue("name", response.data.name || "");
                setValue("role", response.data.role || "");  
                setValue("join_date", formatDate(response.data.join_date) || ""); 
                setValue("back_number", response.data.back_number || "");
                setValue("position", response.data.position || "");
            } catch (error) {
                console.error("❌ 프로필 정보 불러오기 실패:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [authUser, setValue]);
    
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await axios.get(`${API_URL}/positions/signup/4-3-3`);
                setPositions(response.data);
            } catch (error) {
                console.error("❌ 포지션 목록 불러오기 실패:", error);
            }
        };
        fetchPositions();
    }, []);

    const handleFormSubmit = handleSubmit(async (data) => {
        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("role", data.role);
            formData.append("join_date", data.join_date);
            formData.append("back_number", data.back_number);
            formData.append("position", data.position);
            
            if (croppedImage) {
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                formData.append("image", blob, "profile.jpg");
            }

            await axios.put(`${API_URL}/users/${authUser.user_idx}`, data, { withCredentials: true });

            console.log("✅ 프로필 업데이트 성공!");
            navigate("/profile");
        } catch (error) {
            console.error("❌ 프로필 업데이트 실패:", error);
        }
    });

    const handleCropperOpen = () => {
        setShowCropper(false);
        setTimeout(() => setShowCropper(true), 10);
      };
    
    const handleCroppedImage = (file, previewUrl) => {
        setCroppedImage(previewUrl);  
        setUserImageUrl(previewUrl);  
        setShowCropper(false);
    };
    
    const handleCancel = () => {
        navigate(`/profile`);
    }; 

    const name = watch("name", ""); 
    const role = watch("role", ""); 
    const joinDate = watch("join_date", "");    
    
    return (
        <div className="gray-background">
            <div className="content">
                <div className="top-floating-area">
                    <img src={back_arrow} alt="back" onClick={() => navigate("/profile")} />
                </div>
                <div className="profile-container">
                    <div 
                        className="user-image" 
                        style={{ backgroundImage: `url(${userImageUrl})` }} 
                        onClick={handleCropperOpen}
                    >                        
                        <img src={img_box} alt="Edit" className="edit-icon" onClick={() => setShowCropper(true)}/>                   
                    </div>                                         
                    <div className="user-name">{name}</div>

                    <form onSubmit={handleFormSubmit} className="form-container">                                   
                        
                        <div className="info-box">
                            <span className="label">역할</span>
                            <span className="value">{role}</span>
                        </div>
                        <div className="info-box">
                            <span className="label">가입일자</span>
                            <span className="value">{formatDate(joinDate)}</span>
                        </div>                        
                        <div className="info-box">
                            <label className="label">등번호</label>
                            <input 
                                type="text"
                                {...register("back_number", {
                                    required: "등번호를 입력해주세요.",
                                    min: { value: 0, message: "등번호는 0 이상이어야 합니다." },
                                    max: { value: 99, message: "등번호는 99 이하이어야 합니다." }
                                })}
                                className="input-field num"
                            />                            
                        </div>                                    
                        <div className="info-box">
                            <label className="label">포지션</label>
                            <select {...register("position")} className="input-field">
                                {positions.map((pos, index) => (
                                    <option key={index} value={pos.name}>{pos.name}</option>
                                ))}
                            </select>
                        </div>
                        {errors.back_number && <p className="error-text">{errors.back_number.message}</p>}                            
                    </form>
                </div>
            </div>
            <FloatingBar
                mode="confirm_cancel"
                onConfirm={handleFormSubmit}
                onCancel={handleCancel}
            />
            {loading && <LoadingSpinner />}
            {showCropper && <ImageCropper onCrop={handleCroppedImage} onClose={() => setShowCropper(false)} />}
        </div>
    );
}

export default ProfileEdit;
