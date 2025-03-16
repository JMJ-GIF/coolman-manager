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
    
    // 스크롤 이벤트 핸들러
    const handleScroll = () => {
        const currentScrollY = window.scrollY; // window 기준 스크롤 위치

        if (currentScrollY > lastScrollY.current) {
            setIsVisible(false); // 스크롤 내릴 때 숨김
        } else if (currentScrollY < lastScrollY.current) {
            setIsVisible(true); // 스크롤 올릴 때 보임
        }

        lastScrollY.current = currentScrollY;
    };

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

    useEffect(() => {
        window.addEventListener("scroll", handleScroll); // window 기준 스크롤 이벤트 등록
        return () => {
            window.removeEventListener("scroll", handleScroll); // 클린업
        };
    }, []);

    return (
        <div className={`navigation-bar ${isVisible ? "visible" : "hidden"}`}>
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
                    <img src={user.image_url || coolman_logo} alt="Profile Photo" />
                </div>
                <div className="profile-info">
                    <span className="name">진민제</span>
                    <span className="position">선수</span>
                </div>
            </div>
        </div>
    );
}

export default NavigationBar;