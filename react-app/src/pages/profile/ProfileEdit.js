import "./Profile.scss";
import axios from "axios";
import Select from 'react-select';
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import img_box from "../../assets/icons/img_box.svg";
import { useAlert } from "../../context/AlertContext";
import { useForm, Controller } from "react-hook-form";
import FloatingBar from "../../components/FloatingBar";
import ImageCropper from "../../components/ImageCropper";
import back_arrow from "../../assets/icons/back_arrow.svg";
import LoadingSpinner from "../../components/LoadingSpinner";
import coolman_logo from "../../assets/images/coolman-logo-transparent.png";

const API_URL = process.env.REACT_APP_API_URL;

function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
}

function ProfileEdit() {
    const { authUser } = useAuth();
    const { showAlert } = useAlert();
    const navigate = useNavigate();
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [userImageUrl, setUserImageUrl] = useState(coolman_logo);
    const [showCropper, setShowCropper] = useState(false);
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        formState: { errors, isValid },
    } = useForm({
        mode: "onChange",
    });

    const positionOptions = positions.map((pos) => ({
        value: pos.name,
        label: pos.name,
      }));

    const checkImageExists = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });
    };
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/users/${authUser.user_idx}`);
                setValue("name", response.data.name || "");
                setValue("role", response.data.role || "");  
                setValue("join_date", response.data.join_date || ""); 
                setValue("back_number", response.data.back_number || "");
                setValue("position", response.data.position || "");
                setValue("image_url", response.data.image_url || "");
                
                if (response.data.image_url) {
                    const exists = await checkImageExists(response.data.image_url);
                    setUserImageUrl(exists ? response.data.image_url : coolman_logo);
                } else {
                    setUserImageUrl(coolman_logo);
                }                
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
                formData.append("image", blob, "profile.jpeg");
            }
            
            await axios.put(`${API_URL}/users/${authUser.user_idx}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }, 
                withCredentials: true
            });

            showAlert("success", '프로필 수정을 성공하였습니다!');
            navigate("/profile");

        } catch (error) {
            console.log(error)
            if (error.response && error.response.data) {        
                const errorCode = error.response.data.detail.error_code;
                const message = error.response.data.detail.error_message;
                if (errorCode === "EXISTING_USER") {
                    showAlert("warning", message);                                  
                  } else if (errorCode === "DUPLICATE_BACK_NUMBER") {
                    showAlert("warning", message);      
                  } else {
                    showAlert("warning", "알 수 없는 오류 발생: " + message);                          
                  }
            } else {   
                showAlert("warning", "회원가입 중 오류가 발생했습니다.");                                               
            }
            console.error("❌ 프로필 업데이트 실패:", error);
        }
    });

    const handleOpenFilePicker = () => {        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            
            setSelectedFile(file);            
            setShowCropper(true);
          }
        };
    
        input.click(); 
      };

    const handleConfirmSubmit = () => {
        showAlert("confirm", "프로필 정보를 수정하시겠습니까?", async () => {
            await handleFormSubmit();
        });
    };

    const handleCroppedImage = (blob, previewUrl) => {
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
                {loading && <LoadingSpinner />}
                <div className="top-floating-area">
                    <img src={back_arrow} alt="back" onClick={() => navigate("/profile")} />
                </div>
                <div className="profile-container">
                    <div 
                        className="user-image" 
                        style={{ backgroundImage: `url(${userImageUrl || coolman_logo})` }} 
                        onClick={handleOpenFilePicker}
                    >                        
                        <img src={img_box} alt="Edit" className="edit-icon"/>                   
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
                            <Controller
                                control={control}
                                name="position"
                                render={({ field }) => (
                                    <Select
                                        {...field}
                                        value={positionOptions.find(option => option.value === field.value) || null}
                                        options={positionOptions}
                                        className='react-select-container'
                                        classNamePrefix="custom-select"
                                        placeholder="선택"
                                        isClearable={false}
                                        isSearchable={false}
                                        components={{ DropdownIndicator: null }}                                                                    
                                        onChange={(selectedOption) =>
                                            field.onChange(selectedOption?.value || '')
                                        }
                                        styles={{
                                            menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                            option: (base) => ({
                                            ...base,
                                            fontSize: "16px",  
                                            textAlign: "center",
                                            }),
                                            menu: (base) => ({
                                            ...base,
                                            fontSize: "16px",  
                                            }),
                                        }}
                                    />
                                )}
                            />
                        </div>
                        {errors.back_number && <p className="error-text">{errors.back_number.message}</p>}                            
                    </form>
                </div>
            </div>
            <FloatingBar
                mode="confirm_cancel"
                onConfirm={handleConfirmSubmit}
                onCancel={handleCancel}
            />            
            {showCropper && <ImageCropper file={selectedFile} onCrop={handleCroppedImage} onClose={() => setShowCropper(false)} />}
        </div>
    );
}

export default ProfileEdit;