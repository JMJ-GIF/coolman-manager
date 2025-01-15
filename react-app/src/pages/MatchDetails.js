import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import './MatchDetails.scss';
import axios from "axios";
import NavigationBar from "../components/NavigationBar";
import SoccerField from "../components/SoccerField";
import football_ball from "../assets/icons/football_ball.svg";

function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function MatchDetails() {
    const { match_id } = useParams();
    const API_URL = process.env.REACT_APP_API_URL;        
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('goals');
    const [matchDetails, setMatchDetails] = useState(null);
    const [quarters, setQuarters] = useState([])
    const [goals, setGoals] = useState([]);
    const [lineups, setLineups] = useState([]);
    const [GoalPlayerNames, setGoalPlayerNames] = useState({}); 
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
    
            // Player data fetch (goals에 의존하므로 빈 배열일 경우 실행되지 않음)
            if (goalsResponse.status === "fulfilled") {
                const playerIds = [
                    ...new Set([
                        ...goalsResponse.value.data.map((goal) => goal.goal_player_id),
                        ...goalsResponse.value.data.map((goal) => goal.assist_player_id),
                    ]),
                ].filter((id) => id !== null);
    
                if (playerIds.length > 0) {
                    // 한 번의 API 호출로 모든 player 정보를 가져오기
                    const playerResponse = await axios.get(`${API_URL}/users/`, {
                        params: { user_list: playerIds.join(",") } 
                    });
            
                    // 응답 데이터를 처리하여 이름 매핑
                    const players = playerResponse.data.map((player) => ({
                        user_idx: player.user_idx,
                        name: player.name,
                    }));
                        setGoalPlayerNames(players);
                    } else {
                        setGoalPlayerNames([]); 
                    }
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
                                playerName =
                                    GoalPlayerNames.find((player) => player.user_idx === goal.goal_player_id)?.name || "N/A";
                                assistName = goal.assist_player_id
                                    ? GoalPlayerNames.find((player) => player.user_idx === goal.assist_player_id)?.name || "N/A"
                                    : null;
                            } else if (goal.goal_type == "자살골") {
                                playerName = 
                                    GoalPlayerNames.find((player) => player.user_idx === goal.goal_player_id)?.name || "N/A";                                
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
    
        // "선발"과 "교체" 구분
        const startingPlayers = filteredLineups.filter(player => player.is_substitute === false);
        const substitutePlayers = filteredLineups.filter(player => player.is_substitute === true);
    
        return (
            <div>                
                <div className="quarter-buttons">
                    {quarters.map((quarter) => (
                        <button
                            key={quarter.quarter_number}
                            className={`quarter-btn ${
                                selectedQuarter === quarter.quarter_number ? "active" : ""
                            }`}
                            onClick={() => setSelectedQuarter(quarter.quarter_number)}
                        >
                            {quarter.quarter_number}
                        </button>
                    ))}
                </div> 
                <div className="quarter-tactics">{filteredLineups[0]?.tactics}</div>               
                <SoccerField lineup={filteredLineups}/>                
    
                <div className="lineup-container">
                    <div className="lineup-section">
                        <h3 className="section-title">선발</h3>
                        <div className="player-cards">
                            {filteredLineups.map((lineup) => (
                                <div key={lineup.lineup_idx} className="player-card">
                                    <p className="player-position">{lineup.position_name}</p>
                                    <p className="player-name">{lineup.user_name}</p>
                                    <span className="player-status starter">선발</span>
                                </div>
                            ))}
                        </div>
                    </div>
    
                    <div className="lineup-section">
                        <h3 className="section-title">교체</h3>
                        <div className="player-cards">
                            {substitutePlayers.map((lineup) => (
                                <div key={lineup.lineup_idx} className="player-card">
                                    <p className="player-position">{lineup.position_name}</p>
                                    <p className="player-name">{lineup.user_name}</p>
                                    <span className="player-status substitute">교체</span>
                                </div>
                            ))}
                        </div>
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

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">                
                {loading ? (
                    <p>Loading...</p>
                ) : matchDetails ? (
                    <>
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
                                    <span>경기상대</span>
                                    <p>{matchDetails.opposing_team}</p>
                                </div>
                                <div className="card">
                                    <span>경기시간</span>
                                    <p>{`${formatTime(matchDetails.start_time)} ~ ${formatTime(matchDetails.end_time)}`}</p>
                                </div>
                                <div className="card">
                                    <span>경기날씨</span>
                                    <p>{matchDetails.weather}</p>
                                </div>
                                <div className="card">
                                    <span>경기인원</span>
                                    <p>{matchDetails.num_players} 명</p>
                                </div>
                                <div className="card">
                                    <span>메인전술</span>
                                    <p>{matchDetails.main_tactics}</p>
                                </div>    
                            </div>                                                                    
                        </div>
                        
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
        </div>
    );
}

export default MatchDetails;
