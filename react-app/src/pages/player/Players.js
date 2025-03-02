import './Players.scss';
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import defaultImage from "../../assets/images/coolman-profile.png";
import userProfile from "../../assets/images/transparent-profile.png";

function Players() {
    const navigate = useNavigate();
    const [userStats, setUserStats] = useState([]); 
    const [loading, setLoading] = useState(false);    
    const API_URL = process.env.REACT_APP_API_URL;    

    const fetchData = async () => {
        setLoading(true);
        try {                
            const userStatsResponse = await axios.get(`${API_URL}/rank/`);
            setUserStats(userStatsResponse.data);
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
    
    console.log(sortedUserStats)

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">
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
                                <div className='profile-section' style={{
                                    backgroundImage: `url(${user.image_url || userProfile})`,
                                }}>
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
            {loading && <LoadingSpinner />}
        </div>      
    );
}

export default Players;
