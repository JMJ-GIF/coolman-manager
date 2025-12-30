import './Details.scss';
import React from "react";
import { Controller } from "react-hook-form";
import img_box from "../../../assets/icons/img_box.svg";
import delete_svg from "../../../assets/icons/delete.svg";

const EditMaterialsForm = ({
    register,
    matchPhotoUrl,
    onPhotoClick,
    onPhotoDelete,
}) => {
    return (
        <div className="match-materials-edit">
            <div className="header-card">
                <h2>경기자료</h2>
            </div>
            <div className="card photo-upload-card">  
                <span>사진</span>           
                <div className="photo-upload-wrapper">
                    <div className="photo-upload-container" onClick={onPhotoClick}>
                        {matchPhotoUrl ? (
                            <img src={matchPhotoUrl} alt="경기 사진" className="match-photo-preview" />
                        ) : (
                            <div className="photo-placeholder">
                                <img src={img_box} alt="Upload" className="upload-icon" />
                                <p>사진 업로드</p>
                            </div>
                        )}
                    </div>
                    {matchPhotoUrl && (
                        <button
                            type="button"
                            className="delete-photo-button"
                            onClick={onPhotoDelete}
                            title="사진 삭제"
                        >
                            <img src={delete_svg} alt="Delete" />
                        </button>
                    )}
                </div>
            </div>
            <div className="video-upload-card">
                <span>영상</span>               
                <input
                    type="text"
                    {...register("video_url")}
                    placeholder="https://youtube.com/..."
                    className={`text-input`}
                />                                                      
            </div>
        </div>
    );
};

export default EditMaterialsForm;
