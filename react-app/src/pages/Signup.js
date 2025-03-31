import axios from "axios";
import "./Signup.scss";
import Select from "react-select";
import { useAuth } from "../context/AuthContext";
import React, { useState, useEffect } from "react";
import { useAlert } from "../context/AlertContext";
import ImageCropper from "../components/ImageCropper";
import { useForm, Controller } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner"; // LoadingSpinner 임포트

const API_URL = process.env.REACT_APP_API_URL;

const SignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchUser } = useAuth();
  const { showAlert } = useAlert();  
  const name = location.state?.name || "";
  const social_uuid = location.state?.uuid || "";
  const [positions, setPositions] = useState([]);  
  const [showCropper, setShowCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState(null);
  const [loading, setLoading] = useState(false); 
  const {register, handleSubmit, setValue, watch, control,formState: { errors, isValid },} = useForm({ mode: "onChange" });

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
    setLoading(true); 
    try {      
      const formData = new FormData();
      formData.append("social_uuid", social_uuid);
      formData.append("name", name);
      formData.append("position", data.position);
      formData.append("back_number", data.back_number);
      formData.append("role", data.role);

      if (croppedImage) {
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        formData.append("image", blob, "profile.png");
      }
      
      const response = await axios.post(`${API_URL}/users`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        console.log("회원가입 성공!", response.data);

        try {   
          const login = await axios.get(`${API_URL}/users/uuid/exists?uuid=${response.data.social_uuid}`); 
          const user_idx = login.data.user_idx
          await axios.post(`${API_URL}/auth/login`,{ user_idx },{ withCredentials: true }); 
          fetchUser();
          showAlert("celebration", '회원 가입을 축하합니다!');
          navigate("/matches");     
        } catch (error) {
          showAlert("warning", "❌ 토큰 생성 및 user_idx 생성 에러");                        
          console.error("❌ 토큰 생성 및 user_idx 생성 에러:", error);
        }        
      }
    } catch (error) {      
      if (error.response && error.response.data) {        
        const errorCode = error.response.data.detail.error_code;
        const message = error.response.data.detail.error_message;
        
        if (errorCode === "EXISTING_USER") {
          showAlert("warning", message);
          navigate("/");
        } else if (errorCode === "DUPLICATE_BACK_NUMBER") {
          showAlert("warning", message);
          navigate("/signup", { state: { name: name, uuid: social_uuid } });
        } else {
          showAlert("warning", "알 수 없는 오류 발생: " + message);          
        }
      } else {  
        showAlert("warning", "회원가입 중 오류가 발생했습니다.");                        
      }
    } finally {
      setLoading(false); // 로딩 종료
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
          {loading && <LoadingSpinner />}
          <form onSubmit={(e) => e.preventDefault()}> 
            <div className="name">
              <label>이름</label>
              <input type="text" value={name} disabled />
            </div>

            <div className="position">
              <label>선호 포지션</label>
              <Controller
                name="position"
                control={control}
                rules={{ required: "포지션을 선택하세요." }}
                render={({ field }) => (
                  <Select
                    {...field}
                    options={positions.map(pos => ({
                      value: pos.name,
                      label: pos.name,
                    }))}
                    classNamePrefix="custom-select"
                    className="react-select-position"
                    placeholder="포지션을 선택하세요"
                    value={positions.find(p => p.name === field.value) ? { value: field.value, label: field.value } : null}
                    onChange={(selected) => field.onChange(selected?.value || "")}
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
