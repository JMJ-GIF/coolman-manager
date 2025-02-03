import './PlayerDetails.scss';
import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import NavigationBar from "../../components/NavigationBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import userProfile from "../../assets/images/transparent-profile.png";
import x_svg from "../../assets/icons/x.svg"
import gold_svg from "../../assets/icons/gold.svg"
import silver_svg from "../../assets/icons/silver.svg"
import bronze_svg from "../../assets/icons/bronze.svg"

function formatDate(isoString) {
    if (!isoString) return ""; 
    const date = new Date(isoString);
    return date.toISOString().split("T")[0];
}

function PlayerDetails() {    
    const { user_idx, cardClass } = useParams(); 
    const [loading, setLoading] = useState(false);    
    const API_URL = process.env.REACT_APP_API_URL;
    const [user, setUser] = useState([]);
    const [userPosition, setUserPosition] = useState([]); 
    const [userParticipation, setUserParticipation] = useState([]);
    const [userStatOpposingTeam, setUserStatsOpposingTeam] = useState([]);       
        
    const [matchCnt, setMatchCnt] = useState(0);        
    const [maxMatchCnt, setMaxMatchCnt] = useState(0);
    const [quarterCnt, setQuarterCnt] = useState(0);
    const [goalCnt, setGoalCnt] = useState(0);
    const [assistCnt, setAssistCnt] = useState(0);      
    
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());    
    const [lastDay, setLastDay] = useState(0);
    const [firstDayWeekday, setFirstDayWeekday] = useState(0);    
    const [selectedTable, setSelectedTable] = useState("opposingTeam");

    const fetchData = async () => {
        setLoading(true);
        try {                
            const userResponse = await axios.get(`${API_URL}/users/${user_idx}`);
            const participationResponse = await axios.get(`${API_URL}/rank/${user_idx}/participation`);
            const opposingTeamResponse = await axios.get(`${API_URL}/rank/${user_idx}/opposing_team`);
            const positionResponse = await axios.get(`${API_URL}/rank/${user_idx}/position`);
            
            setUser(userResponse.data);
            setUserParticipation(participationResponse.data);
            setUserStatsOpposingTeam(opposingTeamResponse.data);
            setUserPosition(positionResponse.data);
    
            if (participationResponse.data.length > 0) {            
                const participatedDates = participationResponse.data
                    .filter(item => item.is_participation === 1)
                    .map(item => new Date(item.dt))
                    .sort((a, b) => b - a);
                
                setMatchCnt(participatedDates.length);
                setMaxMatchCnt(participationResponse.data.length);
    
                if (participatedDates.length > 0) {
                    const lastParticipationDate = participatedDates[0];
                    setCurrentYear(lastParticipationDate.getFullYear());
                    setCurrentMonth(lastParticipationDate.getMonth());
                }
                    
                const totalQuarterCnt = participationResponse.data.reduce((sum, item) => sum + (item.quarter_cnt || 0), 0);
                setQuarterCnt(totalQuarterCnt);
            } 
    
            if (opposingTeamResponse.data.length > 0) {
                
                const totalGoalCnt = opposingTeamResponse.data.reduce((sum, item) => sum + (item.goal_cnt || 0), 0);
                const totalAssistCnt = opposingTeamResponse.data.reduce((sum, item) => sum + (item.assist_cnt || 0), 0);
    
                setGoalCnt(totalGoalCnt);
                setAssistCnt(totalAssistCnt);
            } 

        } catch (error) {
            console.error("Error fetching user participation:", error);
            setUserParticipation([]); 
            setUserStatsOpposingTeam([]); 
            setUserPosition([]); 
            setMatchCnt(0);
            setMaxMatchCnt(0);
            setQuarterCnt(0);
            setGoalCnt(0);
            setAssistCnt(0);
        } finally {
            setLoading(false);
        }
    };
    

    
    useEffect(() => {
        fetchData();        
    }, [user_idx]);

    useEffect(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        setFirstDayWeekday(firstDayOfMonth.getDay());
        
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);         
        setLastDay(lastDayOfMonth.getDate());
    
    }, [currentYear, currentMonth]);

    console.log(userStatOpposingTeam)
    
    // ✅ 빈 칸 포함 날짜 배열 생성
    const totalCells = Math.ceil((firstDayWeekday + lastDay) / 7) * 7;
    const daysArray = Array.from({ length: totalCells }, (_, i) => 
        i < firstDayWeekday ? null : (i - firstDayWeekday + 1 > lastDay ? null : i - firstDayWeekday + 1)
    );    

    // ✅ 참여 데이터 정리 (객체 형태로 저장)
    const participationMap = {};
    userParticipation.forEach(({ dt, is_participation }) => {
        participationMap[dt] = is_participation;
    });


    const prevMonth = () => {
        setCurrentMonth(prev => {
            const newMonth = prev === 0 ? 11 : prev - 1;
            setCurrentYear(prev === 0 ? currentYear - 1 : currentYear);
            return newMonth;
        });
    };
    
    const nextMonth = () => {
        setCurrentMonth(prev => {
            const newMonth = prev === 11 ? 0 : prev + 1;
            setCurrentYear(prev === 11 ? currentYear + 1 : currentYear);
            return newMonth;
        });
    };

    const rankData = (data) => {
        return data
            .map((item, index) => ({
                ...item,
                totalPoints: item.goal_cnt + item.assist_cnt, 
                rank: index + 1,
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints); 
    };

    
    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <img src={gold_svg} alt="gold" />;
            case 2:
                return <img src={silver_svg} alt="silver" />;
            case 3:
                return <img src={bronze_svg} alt="bronze" />;
            default:
                return rank; // 4등 이상은 숫자로 반환
        }
    };

    const getRankClass = (rank) => {
        switch (rank) {
            case 1:
                return "gold-rank";
            case 2:
                return "silver-rank";
            case 3:
                return "bronze-rank";
            default:
                return "";
        }
    };
    
    
    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">
                <div className="profile">                    
                    <div className={`profile-section ${cardClass}`} style={{
                        backgroundImage: `url(${user.image_url || userProfile})`,
                    }}></div>        
                    <div className="name-section">
                        {cardClass === "gold" && <img src={gold_svg} alt="Gold Rank" className="rank-icon" />}
                        {cardClass === "silver" && <img src={silver_svg} alt="Silver Rank" className="rank-icon" />}
                        {cardClass === "bronze" && <img src={bronze_svg} alt="Bronze Rank" className="rank-icon" />}
                        <p className="name">{user.name}</p>
                        <p className="back-number">{user.back_number}</p>
                    </div>                                
                    <div className="info-section">
                        <div className="info">                            
                            <span> {user.role} | </span>
                            <span> {user.position} | </span>
                            <span>{formatDate(user.join_date)}</span>
                        </div>
                        <div className="stat">
                            <table>
                                <thead>
                                    <tr>
                                        <th>경기</th>
                                        <th>쿼터</th>
                                        <th>골</th>
                                        <th>어시</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>{matchCnt}</td>
                                        <td>{quarterCnt}</td>
                                        <td>{goalCnt}</td>
                                        <td>{assistCnt}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>                                                 
                    </div>   
                </div>
     
                <div className='participation'>
                    <div className='header'>
                        <h2> 📅 {user.name} 님의 출석률</h2>                                             
                    </div>                    
                    <div className="calendar-header">
                        <button onClick={prevMonth} className="nav-button">◀</button>
                        <h2>{currentYear}년 {currentMonth + 1}월</h2>
                        <button onClick={nextMonth} className="nav-button">▶</button>
                    </div>

                    <div className="calendar">                    
                        {["일", "월", "화", "수", "목", "금", "토"].map(day => (
                            <div key={day} className="calendar-weekday">{day}</div>
                        ))}
                        
                        {daysArray.map((day, index) => {
                            if (day === null) return <div key={`empty-${index}`} className="empty-cell"></div>;
                            
                            const dateString = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;                            
                            const isParticipated = participationMap[dateString] === 1;
                            const isNotParticipated = participationMap[dateString] === 0;
                            const isJoinDate = formatDate(user.join_date) === dateString;

                            return (
                                <div 
                                    key={`day-${index}`}
                                    className={`calendar-day 
                                        ${isParticipated ? "participated" : ""} 
                                        ${isNotParticipated ? "not-participated" : ""} 
                                        ${isJoinDate ? "join-date" : ""}`
                                    }>
                                    {day} 
                                    {isNotParticipated && <img src={x_svg} alt="x" />}
                                </div>
                            );
                        })}
                    </div>                                        
                    <div className="calendar-info">
                        <span>가입한 <strong>{formatDate(user.join_date)}</strong> 이후</span>
                        <span><strong>{maxMatchCnt}</strong> 번 중에 <strong>{matchCnt}</strong> 번 출석하셨어요! ✅</span>                        
                    </div>
                </div>
                <div className='stats'>
                    <div className='header'>
                        <h2> 📊 {user.name} 님의 전적</h2>
                    </div>
                    <div className="table-switch-buttons">
                        <button 
                            className={selectedTable === "opposingTeam" ? "active" : ""}
                            onClick={() => setSelectedTable("opposingTeam")}
                        >
                            팀별
                        </button>
                        <button 
                            className={selectedTable === "positionStats" ? "active" : ""}
                            onClick={() => setSelectedTable("positionStats")}
                        >
                            포지션별
                        </button>
                    </div>                        
                    {selectedTable === "opposingTeam" && (
                        userStatOpposingTeam && userStatOpposingTeam.length > 0 ? (
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>순위</th>
                                        <th>상대 팀</th>                                        
                                        <th>골</th>
                                        <th>어시</th>
                                        <th>경기</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankData(userStatOpposingTeam).map((stat, index) => (
                                        <tr key={index} className={getRankClass(index + 1)}>
                                            <td>{getRankIcon(index + 1)}</td>
                                            <td>{stat.opposing_team}</td>                                            
                                            <td>{stat.goal_cnt}</td>
                                            <td>{stat.assist_cnt}</td>
                                            <td>{stat.match_cnt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data">팀별 골/어시스트 정보가 없습니다!</p>
                        )
                    )}
                    {selectedTable === "positionStats" && (
                        userPosition && userPosition.length > 0 ? (
                            <table className="stats-table">
                                <thead>
                                    <tr>
                                        <th>순위</th>
                                        <th>전술</th>
                                        <th>포지션</th>
                                        <th>골</th>
                                        <th>어시</th>
                                        <th>쿼터</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rankData(userPosition).map((position, index) => (
                                        <tr key={index} className={getRankClass(index + 1)}>
                                            <td>{getRankIcon(index + 1)}</td>
                                            <td>{position.tactics}</td>
                                            <td>{position.position_name}</td>
                                            <td>{position.goal_cnt}</td>
                                            <td>{position.assist_cnt}</td>
                                            <td>{position.quarter_cnt}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="no-data">포지션별 골/어시스트 정보가 없습니다!</p>
                        )
                    )}                                                            
                </div>                             
            </div>            
            {loading && <LoadingSpinner />}          
        </div>      
    );
}

export default PlayerDetails;