import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './MatchDetails.scss';
import axios from "axios";
import NavigationBar from "../../components/NavigationBar";
import SoccerField from "../../components/SoccerField";
import football_ball from "../../assets/icons/football_ball.svg";
import FloatingBar from "../../components/FloatingBar";

function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function MatchDetails() {
    const { match_id } = useParams();
    const API_URL = process.env.REACT_APP_API_URL;   
    const navigate = useNavigate();     
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('goals');
    const [matchDetails, setMatchDetails] = useState(null);
    const [quarters, setQuarters] = useState([])
    const [goals, setGoals] = useState([]);
    const [lineups, setLineups] = useState([]);     
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    
    const fetchData = async () => {
        setLoading(true);
        try {
            // Match details 요청은 항상 실행하고 성공적인 응답을 설정
            const matchResponse = await axios.get(`${API_URL}/matches/${match_id}`);
            setMatchDetails(matchResponse.data);
    
            // 나머지 API 콜은 실패할 경우 빈 배열로 처리
            const [quarterResponse, goalsResponse, lineupResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/matches/${match_id}/quarters`),
                axios.get(`${API_URL}/matches/${match_id}/goals`),
                axios.get(`${API_URL}/matches/${match_id}/lineups`)
            ]);
    
            // Quarters API 결과 처리
            if (quarterResponse.status === "fulfilled") {
                setQuarters(quarterResponse.value.data);
            } else {
                console.warn("Quarters API failed:", quarterResponse.reason);
                setQuarters([]); // 빈 배열 설정
            }
    
            // Goals API 결과 처리
            if (goalsResponse.status === "fulfilled") {
                setGoals(goalsResponse.value.data);
            } else {
                console.warn("Goals API failed:", goalsResponse.reason);
                setGoals([]);
            }

            // Lineups API 결과 처리
            if (lineupResponse.status === "fulfilled") {
                setLineups(lineupResponse.value.data);
            } else {
                console.warn("Lineups API failed:", lineupResponse.reason);
                setLineups([]);
            }
                
        } catch (error) {
            console.error("Error fetching match details:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [match_id]);

    const handleEdit = () => {        
        navigate(`/matches/${match_id}/edit`);
    };

    const renderQuarters = () => {
        if (quarters.length === 0) {
            return <p>쿼터 정보가 없습니다.</p>;
        }
    
        let totalHomeScore = 0; 
        let totalAwayScore = 0; 
    
        const quartersWithGoals = quarters.map((quarter) => {
            const goalsInQuarter = goals.filter((goal) => goal.quarter_idx === quarter.quarter_idx);
                
            const quarterHomeScore = goalsInQuarter.filter((goal) => goal.goal_type === "득점").length;
            const quarterAwayScore = goalsInQuarter.filter(
                (goal) => goal.goal_type === "실점" || goal.goal_type === "자살골"
            ).length;
    
            return {
                ...quarter,
                goals: goalsInQuarter,
                quarterHomeScore,
                quarterAwayScore,
            };
        });
    
        return quartersWithGoals.map((quarter) => (
            <div key={quarter.quarter_idx} className="quarter-group">
                <div className="quarter-header">
                    <h3>쿼터 {quarter.quarter_number}</h3>
                    <p>
                       ({quarter.quarterHomeScore} : {quarter.quarterAwayScore})
                    </p>
                </div>
                {quarter.goals.length > 0 ? (
                    <ul className="goal-list">
                        {quarter.goals.map((goal) => {
                            
                            if (goal.goal_type === "득점") {
                                totalHomeScore += 1; 
                            } else if (goal.goal_type === "실점" || goal.goal_type === "자살골") {
                                totalAwayScore += 1; 
                            }
                                
                            let playerName = "N/A";
                            let assistName = "N/A";
    
                            if (goal.goal_type === "득점") {
                                playerName = goal.goal_player_name                                    
                                assistName = goal.assist_player_name                                    
                            } else if (goal.goal_type == "자살골") {
                                playerName = goal.goal_player_name                                    
                            }
    
                            return (
                                <li
                                    key={goal.goal_idx}
                                    className={`goal-item ${
                                        goal.goal_type === "득점" ? "goal-left" : "goal-right"
                                    }`}
                                >
                                    <div className="goal-score-container">
                                        <img src={football_ball} alt="Football" className="goal-icon" />
                                        <span className="goal-score">
                                            {totalHomeScore} : {totalAwayScore}
                                        </span>
                                    </div>
                                    <div className="goal-description">
                                        <p className="goal-player" data-result={goal.goal_type}>
                                            {goal.goal_type === "득점" ? playerName
                                                : goal.goal_type === "자살골" ? `${playerName} (자살골)`
                                                : "실점"}
                                        </p>
                                        {assistName && goal.goal_type === "득점" && (
                                            <p className="assist-player">({assistName})</p>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p>골 정보가 없습니다.</p>
                )}
            </div>
        ));
    };

    const renderLineups = () => {
        if (!quarters.length || !lineups.length) {
            return <p>라인업 정보가 없습니다.</p>;
        }
    
        const filteredLineups = lineups.filter(
            (lineup) => lineup.quarter_number === selectedQuarter
        );
    
        const startingPlayers = filteredLineups.filter(player => player.lineup_status === '선발');
        const substitutePlayers = filteredLineups.filter(player => player.lineup_status === '후보');
    
        return (
            <div>
                <div className="quarter-buttons">
                    {quarters.map((quarter) => (
                        <button
                            key={quarter.quarter_number}
                            className={`quarter-btn ${selectedQuarter === quarter.quarter_number ? "active" : ""}`}
                            onClick={() => setSelectedQuarter(quarter.quarter_number)}
                        >
                            {quarter.quarter_number}
                        </button>
                    ))}
                </div>
                <div className="quarter-tactics">{startingPlayers[0]?.tactics}</div>
                <SoccerField lineup={startingPlayers}/> 
    
                <div className="lineup-container">
                    <div className="lineup-section">
                        <h3 className="section-title">선발</h3>
                        <table className="lineup-table">
                            <thead>
                                <tr>
                                    <th>포지션</th>
                                    <th>등번호</th>
                                    <th>사람</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {startingPlayers.map((lineup) => (
                                    <tr key={lineup.lineup_idx}>
                                        <td>{lineup.position_name}</td>
                                        <td>{lineup.back_number}</td>
                                        <td>{lineup.user_name}</td>
                                        <td className="starter">선발</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
    
                    <div className="lineup-section">
                        <h3 className="section-title">후보</h3>
                        <table className="lineup-table">
                            <thead>
                                <tr>
                                    <th>등번호</th>
                                    <th>사람</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {substitutePlayers.map((lineup) => (
                                    <tr key={lineup.lineup_idx}>
                                        <td>{lineup.back_number}</td>
                                        <td>{lineup.user_name}</td>
                                        <td className="substitute">후보</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };
    
    
    const renderContent = () => {
        if (activeTab === "goals") {
            return renderQuarters();
        } else if (activeTab === "lineup") {
            return renderLineups();
        }
    };

    const renderResult = () => {
        return <>
        <div className="match-results">
            <div className="header-card" data-result={matchDetails.result}>
                <h2>경기결과</h2>
                <p data-result={matchDetails.result}>{matchDetails.result}</p>
            </div>
            <div className="card-container">
                <div className="card">
                    <span>스코어</span>
                    <p>{matchDetails.winning_point} : {matchDetails.losing_point}</p>
                </div>
                <div className="card">
                    <span>상대</span>
                    <p>{matchDetails.opposing_team}</p>
                </div>
                <div className="card">
                    <span>날짜</span>
                    <p>{matchDetails.dt}</p>
                </div>
                <div className="card">
                    <span>시간</span>
                    <p>{`${formatTime(matchDetails.start_time)} ~ ${formatTime(matchDetails.end_time)}`}</p>
                </div>
                <div className="card">
                    <span>날씨</span>
                    <p>{matchDetails.weather}</p>
                </div>
                <div className="card">
                    <span>장소</span>
                    <p>{matchDetails.location}</p>
                </div>
                <div className="card">
                    <span>참가인원</span>
                    <p>{matchDetails.num_players} 명</p>
                </div>
                <div className="card">
                    <span>메인전술</span>
                    <p>{matchDetails.main_tactics}</p>
                </div>    
            </div>                                                                    
        </div>
    </>
    }

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">                
                {loading ? (
                    <p>Loading...</p>
                ) : matchDetails ? (
                    <>                        
                        {renderResult()}
                        <div className="match-details">
                            <div className="header-card">
                                <h2>경기상세</h2>
                                <div className="tabs">
                                    <button
                                        className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('goals')}
                                    >
                                        개요
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'lineup' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('lineup')}
                                    >
                                        라인업
                                    </button>
                                </div>
                            </div>
                            {renderContent()}
                        </div>
                    </>
                ) : (
                    <p>매치 상세 정보가 없습니다.</p>
                )}
            </div>
            <FloatingBar onEdit={handleEdit} mode='edit'/>
        </div>
    );
}

export default MatchDetails;
