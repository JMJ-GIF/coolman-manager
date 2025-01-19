
import axios from "axios";
import './MatchesEdit.scss';
import {useForm, useFieldArray} from "react-hook-form";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FloatingBar from "../../components/FloatingBar";
import SoccerField from "../../components/SoccerField";
import NavigationBar from "../../components/NavigationBar";
import football_ball from "../../assets/icons/football_ball.svg";
import EditResultForm from "../../components/Match/EditResultForm";
import EditQuarterForm from "../../components/Match/EditQuarterForm";


function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function MatchDetails() {
    // Config
    const navigate = useNavigate();         
    const { match_id } = useParams();    
    const API_URL = process.env.REACT_APP_API_URL;       
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('goals');

    // API DATA
    const [users, setUsers] = useState([]);
    const [goals, setGoals] = useState([]);
    const [lineups, setLineups] = useState([]);
    const [tactics, setTactics] = useState([]);
    const [quarters, setQuarters] = useState([]);
    const [matchDetails, setMatchDetails] = useState(null);    
    const [selectedQuarter, setSelectedQuarter] = useState(1);

    // Form Define
    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
        mode: "onChange",       
    });  
    
    // Init Forms
    const initMatchForm = (matchResponse) => {
        Object.entries(matchResponse.data).forEach(([key, value]) => {                
            if (key === 'start_time' || key === 'end_time'){
                setValue(key, formatTime(value))
            } else {
                setValue(key, value);
            }                                
        });  
    };
    const initQuarterForm = (quarterResponse, goalsResponse) => {
        if (quarterResponse.status === "fulfilled" && goalsResponse.status === "fulfilled") {
            const formattedQuarters = quarterResponse.value.data.map((quarter) => ({
                ...quarter,
                goals: goalsResponse.value.data.filter(
                    (goal) => goal.quarter_idx === quarter.quarter_idx
                ),
            }));
            setValue("quarters", formattedQuarters);
        }
    };
        
    const fetchAndInitData = async () => {
        setLoading(true);
        try {
            // Match details 요청은 항상 실행하고 성공적인 응답을 설정
            const matchResponse = await axios.get(`${API_URL}/matches/${match_id}`);
            setMatchDetails(matchResponse.data);
            initMatchForm(matchResponse);
                      
            // 나머지 API 콜은 실패할 경우 빈 배열로 처리
            const [quarterResponse, goalsResponse, lineupResponse, positionResponse, userResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/matches/${match_id}/quarters`),
                axios.get(`${API_URL}/matches/${match_id}/goals`),
                axios.get(`${API_URL}/matches/${match_id}/lineups`),
                axios.get(`${API_URL}/positions`),
                axios.get(`${API_URL}/users`)
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

            // Quarters & Goals Init
            initQuarterForm(quarterResponse, goalsResponse);
            

            // Lineups API 결과 처리
            if (lineupResponse.status === "fulfilled") {
                setLineups(lineupResponse.value.data);
            } else {
                console.warn("Lineups API failed:", lineupResponse.reason);
                setLineups([]);
            }

            // Positions API 결과 처리
            if (positionResponse.status === "fulfilled") {
                const uniqueTactics = Array.from(
                    new Set(positionResponse.value.data.map((item) => item.tactics))
                );
                setTactics(uniqueTactics);
            } else {
                console.warn("Positions API failed:", positionResponse.reason);
                setTactics([]);
            }

            // Users API 결과 처리
            if (userResponse.status === "fulfilled") {
                setUsers(userResponse.value.data)
            } else {
                console.warn("Users API failed:", userResponse.reason);
                setUsers([]);
            }
    
        } catch (error) {
            console.error("Error fetching match details:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAndInitData();        
    }, [match_id, setValue]);

    
    const handleResultSubmit = handleSubmit(async (data) => {
        console.log("제출된 데이터:", data);
        // API 호출 등 처리
    });
    
    const handleQuarterSubmit = handleSubmit(async (data) => {
        console.log("제출된 데이터:", data);
        // API 호출 등 처리
    });
    
    const handleCancel = () => {
        navigate(`/matches/${match_id}/`);
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
            return <EditQuarterForm
            control={control}
            setValue={setValue}
            register={register}
            watch={watch}
            users={users}
            onSubmit={handleQuarterSubmit}  
        />
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
                        <EditResultForm 
                            register={register}                            
                            errors={errors}
                            watch={watch}                            
                            onSubmit={handleResultSubmit}
                            tactics={tactics}
                        />
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
            <FloatingBar
                mode="confirm_cancel"
                onConfirm={handleResultSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default MatchDetails;


//     const renderEditResult = () => {
//         return (
//         <form onSubmit={handleSubmit(onSubmit)}>
//             <div className="match-results">
//                 <div className="header-card" data-result={matchDetails.result}>
//                     <h2>경기결과</h2>
//                     <p data-result={matchDetails.result}>{matchDetails?.result || "결과 없음"}</p>                
//                 </div>
//                 <div className="card-edit-container">
//                     {/* 스코어 카드 */}
//                     <div className="card-edit">
//                         <span>스코어</span>
//                         <div className="score-input-container">
//                             <input
//                                 type="number"
//                                 {...register("winning_point", {
//                                     required: "승리 점수를 입력하세요",
//                                     validate: (value) => value >= 0 || "0 이상의 값을 입력하세요",
//                                 })}
//                                 placeholder="승리 점수"
//                                 className="score-input"
//                             />
//                             <span className="colon">:</span>
//                             <input
//                                 type="number"
//                                 {...register("losing_point", {
//                                     required: "패배 점수를 입력하세요",
//                                     validate: (value) => value >= 0 || "0 이상의 값을 입력하세요",
//                                 })}
//                                 placeholder="패배 점수"
//                                 className="score-input"
//                             />
//                         </div>
//                         {errors.winning_point && <p>{errors.winning_point.message}</p>}
//                         {errors.losing_point && <p>{errors.losing_point.message}</p>}
//                     </div>

//                     {/* 경기 상대 */}
//                     <div className="card-edit">
//                         <span>상대</span>
//                         <input
//                             type="text"
//                             {...register("opposing_team", { required: "경기 상대를 입력하세요" })}
//                             placeholder="경기 상대"
//                             className="text-input"
//                         />
//                         {errors.opposing_team && <p>{errors.opposing_team.message}</p>}
//                     </div>

//                     {/* 경기 상대 */}
//                     <div className="card-edit">
//                         <span>날짜</span>
//                         <div className="time-input-container">
//                             <input
//                                 type="date"
//                                 {...register("dt", { required: "날짜를 입력하세요" })}
//                                 placeholder="날짜"
//                                 className="time-input"
//                             />                        
//                         </div>
//                         {errors.dt && <p>{errors.dt.message}</p>}                    
//                     </div>

//                     {/* 경기 시간 */}
//                     <div className="card-edit">
//                         <span>시간</span>
//                         <div className="time-input-container">
//                             <input
//                                 type="time"
//                                 {...register("start_time")}
//                                 placeholder="시작 시간"
//                                 className="time-input"
//                             />
//                             <span className="tilde">~</span>
//                             <input
//                                 type="time"
//                                 {...register("end_time")}
//                                 placeholder="종료 시간"
//                                 className="time-input"
//                             />
//                         </div>
//                         {errors.start_time && <p>{errors.start_time.message}</p>}
//                         {errors.end_time && <p>{errors.end_time.message}</p>}
//                     </div>                

//                     {/* 경기 날씨 */}
//                     <div className="card-edit">
//                         <span>날씨</span>
//                         <select {...register("weather")}>
//                             <option value='맑음'>맑음</option>
//                             <option value='흐림'>흐림</option>
//                             <option value='눈'>눈</option>
//                             <option value='비'>비</option>
//                             <option value='안개'>안개</option>
//                         </select>                        
//                     </div>

//                     {/* 경기 장소 */}
//                     <div className="card-edit">
//                         <span>장소</span>
//                         <input
//                             type="text"
//                             {...register("location")}
//                             placeholder="경기장소"
//                             className="text-input"
//                             onClick={fetchLocation}
//                         />
//                     </div>

//                     {/* 경기 인원 */}
//                     <div className="card-edit">
//                         <span>참가인원</span>
//                         <input
//                             type="text"
//                             {...register("num_players")}
//                             placeholder="경기 인원"
//                             className="text-input"
//                         />
//                         {errors.num_players && <p>{errors.num_players.message}</p>}
//                     </div>

//                     {/* 메인 전술 */}
//                     <div className="card-edit">
//                         <span>메인전술</span>
//                             <select {...register("main_tactics")}>
//                                 {tactics.map((tactic, index) => (
//                                     <option key={index} value={tactic}>
//                                         {tactic}
//                                     </option>
//                                 ))}
//                             </select>
//                     </div>
//                 </div>                
//             </div>        
//         </form>
//     )
// }


// const renderQuarters = () => {
    //     if (quarters.length === 0) {
    //         return <p>쿼터 정보가 없습니다.</p>;
    //     }
    
    //     let totalHomeScore = 0; 
    //     let totalAwayScore = 0; 
    
    //     const quartersWithGoals = quarters.map((quarter) => {
    //         const goalsInQuarter = goals.filter((goal) => goal.quarter_idx === quarter.quarter_idx);
                
    //         const quarterHomeScore = goalsInQuarter.filter((goal) => goal.goal_type === "득점").length;
    //         const quarterAwayScore = goalsInQuarter.filter(
    //             (goal) => goal.goal_type === "실점" || goal.goal_type === "자살골"
    //         ).length;
    
    //         return {
    //             ...quarter,
    //             goals: goalsInQuarter,
    //             quarterHomeScore,
    //             quarterAwayScore,
    //         };
    //     });
    
    //     return quartersWithGoals.map((quarter) => (
    //         <div key={quarter.quarter_idx} className="quarter-group">
    //             <div className="quarter-header">
    //                 <h3>쿼터 {quarter.quarter_number}</h3>
    //                 <p>
    //                    ({quarter.quarterHomeScore} : {quarter.quarterAwayScore})
    //                 </p>
    //             </div>
    //             {quarter.goals.length > 0 ? (
    //                 <ul className="goal-list">
    //                     {quarter.goals.map((goal) => {
                            
    //                         if (goal.goal_type === "득점") {
    //                             totalHomeScore += 1; 
    //                         } else if (goal.goal_type === "실점" || goal.goal_type === "자살골") {
    //                             totalAwayScore += 1; 
    //                         }
                                
    //                         let playerName = "N/A";
    //                         let assistName = "N/A";
    
    //                         if (goal.goal_type === "득점") {
    //                             playerName =
    //                                 GoalPlayerNames.find((player) => player.user_idx === goal.goal_player_id)?.name || "N/A";
    //                             assistName = goal.assist_player_id
    //                                 ? GoalPlayerNames.find((player) => player.user_idx === goal.assist_player_id)?.name || "N/A"
    //                                 : null;
    //                         } else if (goal.goal_type == "자살골") {
    //                             playerName = 
    //                                 GoalPlayerNames.find((player) => player.user_idx === goal.goal_player_id)?.name || "N/A";                                
    //                         }
    
    //                         return (
    //                             <li
    //                                 key={goal.goal_idx}
    //                                 className={`goal-item ${
    //                                     goal.goal_type === "득점" ? "goal-left" : "goal-right"
    //                                 }`}
    //                             >
    //                                 <div className="goal-score-container">
    //                                     <img src={football_ball} alt="Football" className="goal-icon" />
    //                                     <span className="goal-score">
    //                                         {totalHomeScore} : {totalAwayScore}
    //                                     </span>
    //                                 </div>
    //                                 <div className="goal-description">
    //                                     <p className="goal-player" data-result={goal.goal_type}>
    //                                         {goal.goal_type === "득점" ? playerName
    //                                             : goal.goal_type === "자살골" ? `${playerName} (자살골)`
    //                                             : "실점"}
    //                                     </p>
    //                                     {assistName && goal.goal_type === "득점" && (
    //                                         <p className="assist-player">({assistName})</p>
    //                                     )}
    //                                 </div>
    //                             </li>
    //                         );
    //                     })}
    //                 </ul>
    //             ) : (
    //                 <p>골 정보가 없습니다.</p>
    //             )}
    //         </div>
    //     ));
    // };