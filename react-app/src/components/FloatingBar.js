import React from "react";
import { useNavigate } from "react-router-dom";
import "./FloatingBar.scss";
import add_square_svg from "../assets/icons/add_square.svg";
import delete_svg from "../assets/icons/delete.svg";
import edit_svg from "../assets/icons/edit.svg";

function FloatingBar({ mode, onEdit, onConfirm, onCancel }) {
    const navigate = useNavigate();

    const handleAdd = (e) => {
        e.preventDefault();
        navigate('/matches/add');
    };

    if (mode === "edit") {
        return (
            <div className="floating-bar">
                <button className="action-button" onClick={onEdit}>
                    <img src={edit_svg} alt="Edit" />
                </button>
            </div>
        );
    }

    if (mode === "confirm_cancel") {
        return (
            <div className="floating-bar">                
                <button className="action-button cancel" onClick={onCancel}>
                    취소
                </button>
                <button className="action-button confirm" onClick={onConfirm}>
                    확인
                </button>
            </div>
        );
    }

    if (mode === "add_delete") {
        return (
            <div className="floating-bar">
                <button className="action-button" onClick={handleAdd}>
                    <img src={add_square_svg} alt="Add" />
                </button>
                <button className="action-button" onClick={onEdit}>
                    <img src={delete_svg} alt="Delete" />
                </button>
            </div>
        )
    }
}

export default FloatingBar;
