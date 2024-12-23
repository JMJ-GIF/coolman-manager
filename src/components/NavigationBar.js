import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NavigationBar.scss";
import profile_img from "../assets/images/coolman_profile.png";

function NavigationBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollY = useRef(0); 
    // const [lastScrollY, setLastScrollY] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const menuItems = [
        { label: "Home", route: "/home" },
        { label: "Matches", route: "/matches" },
        { label: "Players", route: "/players" },
        { label: "Records", route: "/records" },
        { label: "Gallery", route: "/gallery" },
    ];

    const activeIndex = menuItems.findIndex((item) => {        
        return item.route === location.pathname;
    });

    const handleScroll = () => {
        const scrollContainer = document.querySelector(".gray-background");
        const currentScrollY = scrollContainer.scrollTop;

        if (currentScrollY > lastScrollY.current) {
            setIsVisible(false); 
        } else if (currentScrollY < lastScrollY.current ) {
            setIsVisible(true); 
        }

        lastScrollY.current = currentScrollY; 
    };

    useEffect(() => {
        const scrollContainer = document.querySelector(".gray-background");

        scrollContainer.addEventListener("scroll", handleScroll);
        return () => {
            scrollContainer.removeEventListener("scroll", handleScroll);
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
                    <img src={profile_img} alt="Profile Photo" />
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
