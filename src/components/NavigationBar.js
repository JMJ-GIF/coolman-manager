import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./NavigationBar.scss";
import profile_img from "../assets/images/coolman_profile.png";

function NavigationBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const menuItems = [
        { label: "Home", route: "/home" },
        { label: "Matches", route: "/matches" },
        { label: "Players", route: "/players" },
        { label: "Records", route: "/records" },
        { label: "Gallery", route: "/gallery" },
    ];

    const activeIndex = menuItems.findIndex((item) => item.route === location.pathname);

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsVisible(false);
        } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
            setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
    };

    useEffect(() => {
        window.addEventListener("scroll", handleScroll);
        document.body.style.paddingTop = "30px";
        return () => {
            window.removeEventListener("scroll", handleScroll);
            document.body.style.paddingTop = "0px"; // 복구
        };
    }, [lastScrollY]);

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
