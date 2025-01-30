import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Matches.scss';
import FloatingBar from "../../components/FloatingBar";
import NavigationBar from "../../components/NavigationBar";
import location_svg from "../../assets/icons/location.svg";
import LoadingSpinner from "../../components/LoadingSpinner";

function Matches() {
    const navigate = useNavigate();
    const batchSize = 10;
    const API_URL = process.env.REACT_APP_API_URL;

    const [visibleCards, setVisibleCards] = useState([]);
    const [lastItemId, setLastItemId] = useState(null);
    const [lastItemDt, setLastItemDt] = useState(null);
    const [loading, setLoading] = useState(false);    
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCards, setSelectedCards] = useState([]);

    const fetchMatches = async () => {
        if (loading) return;
        setLoading(true);        
        try {            
            const response = await axios.get(`${API_URL}/matches/`, {
                params: {
                    page_size: batchSize,
                    ...(lastItemId && {last_item_id: lastItemId}),
                    ...(lastItemDt && {last_item_dt: lastItemDt}),
                },
            });

            const data = response.data;

            setVisibleCards((prevCards) => {
                const allCards = [...prevCards, ...data];
                const uniqueCards = Array.from(
                    new Map(allCards.map((card) => [card.match_idx, card])).values()
                );
                return uniqueCards;
            });
            if (data.length > 0) {
                const lastItem = data[data.length - 1]
                setLastItemDt(lastItem.dt);
                setLastItemId(lastItem.match_idx);
            }
        } catch (error) {            
            console.error("Error fetching matches:", error);
        } finally {
            setLoading(false);
        }
    }

    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        if (scrollTop + clientHeight >= scrollHeight - 30 && !loading) {
            fetchMatches();
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    useEffect(() => {        
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);
    
    const enterEditMode = () => {
        setIsEditMode(true);
        setSelectedCards([]);
    };

    const exitEditMode = () => {
        setIsEditMode(false);
        setSelectedCards([]);
    };

    const confirmDelete = () => {
        setVisibleCards(visibleCards.filter(card => !selectedCards.includes(card.match_idx)));
        setIsEditMode(false);
        setSelectedCards([]);
    };

    const toggleCardSelection = (cardId) => {
        setSelectedCards((prev) =>
            prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
        );
    };

    return (
        <div className="gray-background">
            <NavigationBar />
            <FloatingBar
                mode={isEditMode ? "confirm_cancel" : "add_delete"}
                onConfirm={confirmDelete}
                onCancel={exitEditMode}
                onEdit={enterEditMode}
            />
            <div className="content">
                <div className="card-container">
                    {visibleCards.map((card) => (
                        <div key={card.match_idx} className={`card ${isEditMode ? "editable" : ""}`}>
                            {isEditMode && (
                                <input
                                    type="checkbox"
                                    className="card-checkbox"
                                    checked={selectedCards.includes(card.match_idx)}
                                    onChange={() => toggleCardSelection(card.match_idx)}
                                />
                            )}
                            <div
                                className="card-content"
                                onClick={() =>
                                    !isEditMode && navigate(`/matches/${card.match_idx}`)
                                }
                            >                                
                                <div className='flag-info' data-result={card.result}>
                                    <p>{card.dt}</p>
                                    <p>{card.result}</p> 
                                </div>
                                <div>
                                    <p>vs</p>
                                </div>                                
                                <div className='team-info'>                                                                    
                                    <p>{card.opposing_team}</p>
                                </div>
                                <div className="score-info" data-result={card.result}>
                                    <p>{card.winning_point}</p> 
                                    <p>:</p> 
                                    <p>{card.losing_point}</p>                                    
                                </div> 
                                <div className='location-info'>
                                    <img src={location_svg} alt="Location" />
                                    <p>{card.location}</p>  
                                </div>                                                                                                                              
                            </div>
                        </div>
                    ))}
                </div>

                {loading && (
                    <LoadingSpinner/>
                )}
            </div>
        </div>
    );
}

export default Matches;
