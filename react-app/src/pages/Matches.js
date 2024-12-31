import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Matches.scss';
import NavigationBar from "../components/NavigationBar";
import FloatingBar from "../components/FloatingBar";

function Matches() {
    const navigate = useNavigate();
    const fetchData = () => {
        return Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            title: `Card ${i + 1}`,
            description: `This is card number ${i + 1}`,
        }));
    };

    const allData = fetchData();
    const batchSize = 10;
    const [visibleCards, setVisibleCards] = useState([]);
    const [startIndex, setStartIndex] = useState(0);
    const [loading, setLoading] = useState(false);    
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedCards, setSelectedCards] = useState([]);

    const loadMoreCards = () => {
        if (startIndex >= allData.length || loading) return;

        setLoading(true);
        setTimeout(() => {
            const nextBatch = allData.slice(startIndex, startIndex + batchSize);
            setVisibleCards([...visibleCards, ...nextBatch]);
            setStartIndex(startIndex + batchSize);
            setLoading(false);
        }, 500);
    };

    const handleScroll = () => {
        const scrollTop = window.scrollY;
        const clientHeight = window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;

        if (scrollTop + clientHeight >= scrollHeight - 30 && !loading) {
            loadMoreCards();
        }
    };

    useEffect(() => {
        loadMoreCards();
    }, []);

    useEffect(() => {
        const onScroll = () => handleScroll();
        window.addEventListener("scroll", onScroll);

        return () => window.removeEventListener("scroll", onScroll);
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
        setVisibleCards(visibleCards.filter(card => !selectedCards.includes(card.id)));
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
                isEditMode={isEditMode}
                onConfirm={confirmDelete}
                onCancel={exitEditMode}
                onEdit={enterEditMode}
            />
            <div className="content">
                <div className="card-container">
                    {visibleCards.map((card) => (
                        <div key={card.id} className={`card ${isEditMode ? "editable" : ""}`}>
                            {isEditMode && (
                                <input
                                    type="checkbox"
                                    className="card-checkbox"
                                    checked={selectedCards.includes(card.id)}
                                    onChange={() => toggleCardSelection(card.id)}
                                />
                            )}
                            <div
                                className="card-content"
                                onClick={() =>
                                    !isEditMode && navigate(`/matches/${card.id}`)
                                }
                            >
                                <h3>{card.title}</h3>
                                <p>{card.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="loading">
                        <svg className="spinner" viewBox="0 0 50 50">
                            <circle
                                className="path"
                                cx="25"
                                cy="25"
                                r="20"
                                fill="none"
                                strokeWidth="4"
                            />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Matches;
