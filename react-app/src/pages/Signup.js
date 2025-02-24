import axios from "axios";
import "./Signup.scss";
import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import ImageCropper from "../components/ImageCropper";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const name = location.state?.name || "";
  const [positions, setPositions] = useState([]);  
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState(null);
  const {register, handleSubmit, setValue, watch, formState: { errors, isValid },} = useForm({ mode: "onChange" });

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await axios.get(`${API_URL}/positions/signup/4-3-3`);
        setPositions(response.data);
      } catch (error) {
        console.error("포지션 목록 불러오기 실패:", error);
      }
    };
    fetchPositions();
  }, []);

  const handleCropperOpen = () => {
    setShowCropper(false);
    setTimeout(() => setShowCropper(true), 10);
  };
  
  const handleCroppedImage = (file, previewUrl) => {
    setCroppedImage(previewUrl);
    setValue("image", file);
  };

  const handleSignupClick = (e) => {
    e.preventDefault(); 
    handleSubmit(onSubmit)(); 
  };
  
  const onSubmit = async (data) => {
    try {
      const social_uuid = location.state?.uuid;
      const formData = {
        social_uuid,
        name: name, 
        position: data.position, 
        back_number: Number(data.back_number),
        role: data.role, 
        image: croppedImage || null,
      };      

      const response = await axios.post(`${API_URL}/users`, formData, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 201) {
        console.log("회원가입 성공!", response.data);
        navigate("/home"); 
      }
    } catch (error) {      
      if (error.response && error.response.data) {        
        const errorCode = error.response.data.detail.error_code;
        const message = error.response.data.detail.error_message;
        
        if (errorCode === "EXISTING_USER") {
          alert(message);
          navigate("/");
        } else if (errorCode === "DUPLICATE_BACK_NUMBER") {
          alert(message);
          navigate("/signup");
        } else {
          alert("알 수 없는 오류 발생: " + message);
        }
      } else {        
        alert("회원가입 중 오류가 발생했습니다.");
      }
    }
  };

  const selectedPosition = watch("position", "");
  const selectedRole = watch("role", ""); 
  const backNumber = watch("back_number", ""); 

  return (
    <div className="img-background">
      <div className="signup-frame">
        <div className="signup-container">
          <h2>회원가입</h2>
          <form onSubmit={(e) => e.preventDefault()}> 
            <div className="name">
              <label>이름</label>
              <input type="text" value={name} disabled />
            </div>
            <div className="position">
              <label>선호 포지션</label>
              <select {...register("position", { required: "포지션을 선택하세요." })}>
                <option value="">포지션을 선택하세요</option>
                {positions.map((pos, index) => (
                  <option key={index} value={pos.name}>{pos.name}</option>
                ))}
              </select>
              {errors.position && <p className="error">{errors.position.message}</p>}
            </div>
            <div className="back-number">
              <label>등번호</label>
              <input
                type="number"
                {...register("back_number", {
                  required: "등번호를 입력하세요.",
                  min: { value: 0, message: "0 이상의 숫자를 입력하세요." },
                  max: { value: 99, message: "99 이하의 숫자를 입력하세요." },
                })}
              />
              {errors.back_number && <p className="error">{errors.back_number.message}</p>}
            </div>
            <div className="role">
              <label>역할</label>
              <div>
                <input type="radio" id="player" value="선수" {...register("role", { required: "역할을 선택하세요." })} />
                <label htmlFor="player">선수</label>
                <input type="radio" id="coach" value="감독" {...register("role", { required: "역할을 선택하세요." })} />
                <label htmlFor="coach">감독</label>
              </div>
              {errors.role && <p className="error">{errors.role.message}</p>}
            </div>

            <div className="profile">
              <label>프로필 이미지</label>
              <div className="profile-preview-container">
                {croppedImage ? (
                  <div className="card-gold" onClick={handleCropperOpen}>
                    <div className="profile-section" style={{ backgroundImage: `url(${croppedImage})` }}>
                      <div className="vertical-info">
                        <div className="score">100</div>
                        <div className="position">{selectedPosition || "포지션"}</div>
                        <div className={`role ${selectedRole === "감독" ? "coach" : "player"}`}>
                          {selectedRole || "역할"}
                        </div>
                      </div>
                    </div>                    
                    <div className="name-section">
                      <div className="name">{name}</div>
                      <div className="back-number">{backNumber || "등번호"}</div>
                    </div>
                  </div>
                ) : (
                  <div className="image-upload-box" onClick={() => setShowCropper(true)}>
                    <span>+</span>
                  </div>
                )}
              </div>
            </div>

            {showCropper && <ImageCropper onCrop={handleCroppedImage} onClose={() => setShowCropper(false)} />}

            <button type="submit" disabled={!isValid} onClick={handleSignupClick}>가입하기</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
