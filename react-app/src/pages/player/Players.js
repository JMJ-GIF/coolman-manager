import './Players.scss';
import axios from "axios";
import React, { useState, useEffect } from "react";
import NavigationBar from "../../components/NavigationBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import defaultImage from "../../assets/images/coolman-profile.png";

function formatDate(isoString) {
    if (!isoString) return ""; 
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
}

function Players() {
    const [users, setUsers] = useState([]); 
    const [loading, setLoading] = useState(false);    
    const API_URL = process.env.REACT_APP_API_URL;    

    const fetchData = async () => {
        setLoading(true);
        try {                
            const userResponse = await axios.get(`${API_URL}/users`);
            setUsers(userResponse.data);
        } catch (error) {
            console.error("Error fetching Users:", error);
            setUsers([]); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); 
    
    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">
                <div className='user-container'>
                    {users
                        .filter(user => !(user.name === "용병" && user.back_number === 0)) //
                        .map((user, index) => (
                            <div key={index} className="card">                        
                                <div className="profile"
                                    style={{
                                        backgroundImage: `url(${user.image_url || defaultImage})`,
                                    }}></div>
                                <div className="name">{user.name}</div>
                                <div className="position">{user.position}</div>
                                <div className="back_number">{user.back_number}</div>
                                <div className="joindate">{formatDate(user.join_date)}</div>
                                <div className="role">{user.role}</div>
                            </div>
                        ))}
                </div>                                
            </div>
            {loading && <LoadingSpinner />}
        </div>      
    );
}

export default Players;
