import './Players.scss';
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import coolman_logo from "../../assets/images/coolman-logo-transparent.png";
import userProfile from "../../assets/images/transparent-profile.png";

function Players() {
    const navigate = useNavigate(); 
    const [userStats, setUserStats] = useState([]); 
    const [loading, setLoading] = useState(false);    
    const API_URL = process.env.REACT_APP_API_URL;    
    const [validImageUrls, setValidImageUrls] = useState({});

    const checkImageExists = (url) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = url;
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
        });
    };
    
    const validateAllImages = async (users) => {
        const result = {};
    
        await Promise.all(users.map(async (user) => {
            if (user.image_url) {
                const exists = await checkImageExists(user.image_url);
                result[user.user_idx] = exists ? user.image_url : coolman_logo;
            } else {
                result[user.user_idx] = coolman_logo;
            }
        }));
    
        setValidImageUrls(result);
    };
    
    const fetchData = async () => {
        setLoading(true);
        try {                
            const userStatsResponse = await axios.get(`${API_URL}/rank`);
            setUserStats(userStatsResponse.data);

            await validateAllImages(userStatsResponse.data);
        } catch (error) {
            console.error("Error fetching Users:", error);
            setUserStats([]); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); 
    
    const sortedUserStats = [...userStats]
        .filter(user => !(user.name === "용병" && user.back_number === 0)) 
        .sort((a, b) => {
            if (b.ratio !== a.ratio) {
                return b.ratio - a.ratio; 
            }
            return a.name.localeCompare(b.name);
        });
    

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">
                {loading && (
                        <LoadingSpinner/>
                    )}
                <div className='user-container'>
                    {sortedUserStats.map((user, index) => {
                        let cardClass = "bronze"; 
                        if (index < 3) cardClass = "gold"; 
                        else if (index < 6) cardClass = "silver"; 

                        return (
                            <div key={index} className={`card ${cardClass}`}
                                onClick={() =>
                                    navigate(`/players/${user.user_idx}/${cardClass}`)
                                }>  
                                <div
                                    className='profile-section'
                                    style={{
                                        backgroundImage: `url(${validImageUrls[user.user_idx] || coolman_logo})`,
                                }}
                                >
                                    <div className='vertical-info'>
                                        <div className='score'>{Math.round(user.ratio * 100)}</div>
                                        <div className="position">{user.position}</div>                                    
                                        <div className={`role ${user.role === "감독" ? "coach" : "player"}`}>
                                            {user.role}
                                        </div>
                                    </div>                                
                                </div>                      
                                <div className='name-section'>
                                    <div className='name'>{user.name}</div>
                                    <div className='back-number'>{user.back_number}</div>
                                </div> 
                                <div className='stat-section'>
                                    <table className='stat-table'>
                                        <thead>
                                            <tr>
                                                <th>G</th>
                                                <th>A</th>
                                                <th>P</th>
                                                <th>Max</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>{user.goal_cnt}</td>
                                                <td>{user.assist_cnt}</td>
                                                <td>{user.match_cnt}</td>
                                                <td>{user.max_match_cnt}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>                                                                                                                        
                            </div>
                        );
                    })}
                </div>                                
            </div>            
        </div>      
    );
}

export default Players;
