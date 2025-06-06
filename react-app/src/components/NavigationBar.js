import axios from "axios";
import "./NavigationBar.scss";
import { useAuth } from "../context/AuthContext";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import coolman_logo from "../assets/images/coolman-logo-transparent.png";

const API_URL = process.env.REACT_APP_API_URL;

function NavigationBar() {       
    const { authUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [user, setUser] = useState([]);
    const [loading, setLoading] = useState(false);
    const lastScrollY = useRef(0);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const menuItems = [        
        { label: "Matches", route: "/matches" },
        { label: "Players", route: "/players" },
        { label: "Records", route: "/records" },        
    ];

    const activeIndex = menuItems.findIndex((item) => location.pathname.startsWith(item.route));    

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const userResponse = await axios.get(`${API_URL}/users/${authUser.user_idx}`);   
                setUser(userResponse.data);
            } catch (error) {
                console.error("Error fetching user participation:", error);
                setUser([]);       
            } finally {
                setLoading(false);
            }
        } ;
        fetchData();
    }, [authUser]);

    return (
        <div className="navigation-bar">
            <ul className="page-navigator">
                <div
                    className="active-indicator"
                    style={{
                        width: `${100 / menuItems.length}%`,
                        transform: `translateX(${(hoveredIndex !== null ? hoveredIndex : activeIndex) * 100}%)`,
                    }}
                ></div>
                {menuItems.map((item, index) => (
                    <li
                        key={index}
                        className={`nav-item ${activeIndex === index ? "active" : ""}`}
                        onClick={() => navigate(item.route)}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>

            <div className="profile-section" onClick={() => navigate("/profile")}>
                <div className="profile-photo">
                    <img src={user.image_url || coolman_logo} 
                        alt="Profile Photo"
                        onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = coolman_logo;
                    }} />
                </div>
                <div className="profile-info">
                    <span className="name">{user.name}</span>
                    <span className="position">{user.role}</span>
                </div>
            </div>
        </div>
    );
}

export default NavigationBar;