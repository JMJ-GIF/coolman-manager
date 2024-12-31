import React from "react";
import { useNavigate } from "react-router-dom";
import "./FloatingBar.scss";
import add_svg from "../assets/icons/add.svg";
import archive_svg from "../assets/icons/archive.svg";

function FloatingBar({ isEditMode, onConfirm, onCancel, onEdit }) {
    const navigate = useNavigate();

    const handleAdd = (e) => {
        e.preventDefault();
        navigate('/matches/add');
    };

    return (
        <div className="floating-bar">
            {isEditMode ? (
                <>
                    <button className="action-button confirm" onClick={onConfirm}>
                        확인
                    </button>
                    <button className="action-button cancel" onClick={onCancel}>
                        취소
                    </button>
                </>
            ) : (
                <>
                    <button className="action-button" onClick={handleAdd}>
                        <img src={add_svg} alt="Add" />
                    </button>
                    <button className="action-button" onClick={onEdit}>
                        <img src={archive_svg} alt="Archive" />
                    </button>
                </>
            )}
        </div>
    );
}

export default FloatingBar;
