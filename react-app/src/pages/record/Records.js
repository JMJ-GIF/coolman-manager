import './Records.scss';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import NavigationBar from "../../components/NavigationBar";
import LoadingSpinner from "../../components/LoadingSpinner";
import gold_svg from "../../assets/icons/gold.svg"
import silver_svg from "../../assets/icons/silver.svg"
import bronze_svg from "../../assets/icons/bronze.svg"

function Records() {
    const navigate = useNavigate();
    const [userStats, setUserStats] = useState([]);
    const [opposingTeamStats, setOpposingTeamStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'goal_cnt', direction: 'desc' });
    const [teamSortConfig, setTeamSortConfig] = useState({ key: 'win_match', direction: 'desc' });
    const [selectedSeason, setSelectedSeason] = useState('2026'); // 기본값: 25시즌

    const API_URL = process.env.REACT_APP_API_URL;

    const fetchData = async (year) => {
        setLoading(true);
        try {
            const userStatsResponse = await axios.get(`${API_URL}/rank`, {
                params: { year }
            });
            const OpposingTeamStatsResponse = await axios.get(`${API_URL}/rank/opposing_team`, {
                params: { year }
            });
            setUserStats(userStatsResponse.data);
            setOpposingTeamStats(OpposingTeamStatsResponse.data)
        } catch (error) {
            console.error("Error fetching Users:", error);
            setUserStats([]);
            setOpposingTeamStats([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedSeason);
    }, [selectedSeason]);

    const handleSeasonChange = (event) => {
        setSelectedSeason(event.target.value);
    };

    const handleSort = (key, setSortConfig, currentConfig) => {
        let direction = 'asc';
        if (currentConfig.key === key && currentConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const processData = (data, sortConfig, filterCondition, extraFields) => {
        return [...data]
            .filter(filterCondition)
            .map((item, index) => ({
                ...item,
                ...extraFields(item),
                rank: index + 1,
            }))
            .sort((a, b) => {
                if (sortConfig.key) {
                    let aValue = a[sortConfig.key];
                    let bValue = b[sortConfig.key];
                    if (typeof aValue === "string") aValue = parseFloat(aValue);
                    if (typeof bValue === "string") bValue = parseFloat(bValue);
                    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                    return 0;
                }
                return 0;
            });
    };

    const sortedUserStats = processData(userStats, sortConfig,
        user => !(user.name === "용병" && user.back_number === 999),
        item => ({ totalPoints: item.goal_cnt + item.assist_cnt })
    );

    const sortedOpposingTeamStats = processData(opposingTeamStats, teamSortConfig,
        () => true,
        item => ({ totalMatches: item.win_match})
    );

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return <img src={gold_svg} alt="gold" />;
            case 2: return <img src={silver_svg} alt="silver" />;
            case 3: return <img src={bronze_svg} alt="bronze" />;
            default: return rank;
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
                {loading && <LoadingSpinner />}

                {/* 시즌 선택 드롭다운 */}
                <div className="season-filter">
                    <label htmlFor="season-select">시즌 선택: </label>
                    <select
                        id="season-select"
                        value={selectedSeason}
                        onChange={handleSeasonChange}
                        className="season-select"
                    >
                        <option value="2025">25시즌</option>
                        <option value="2026">26시즌</option>
                    </select>
                </div>

                <div className='user-stat'>
                    <div className='header'>
                        <h2>🥇 유저 랭킹</h2>
                    </div>
                    {sortedUserStats.length > 0 ? (
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>순위</th>
                                    <th>유저</th>
                                    <th className={`sortable ${sortConfig.key === 'goal_cnt' ? sortConfig.direction : ''}`} onClick={() => handleSort('goal_cnt', setSortConfig, sortConfig)}>골</th>
                                    <th className={`sortable ${sortConfig.key === 'assist_cnt' ? sortConfig.direction : ''}`} onClick={() => handleSort('assist_cnt', setSortConfig, sortConfig)}>어시</th>
                                    <th className={`sortable ${sortConfig.key === 'quarter_cnt' ? sortConfig.direction : ''}`} onClick={() => handleSort('quarter_cnt', setSortConfig, sortConfig)}>쿼터</th>
                                    <th className={`sortable ${sortConfig.key === 'match_cnt' ? sortConfig.direction : ''}`} onClick={() => handleSort('match_cnt', setSortConfig, sortConfig)}>경기</th>
                                    <th className={`sortable ${sortConfig.key === 'max_match_cnt' ? sortConfig.direction : ''}`} onClick={() => handleSort('max_match_cnt', setSortConfig, sortConfig)}>최대</th>
                                    {/* <th className={`sortable ${sortConfig.key === 'ratio' ? sortConfig.direction : ''}`} onClick={() => handleSort('ratio')}>출석</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedUserStats.map((user, index) => (
                                    <tr key={index} className={getRankClass(index + 1)}>
                                        <td>{getRankIcon(index + 1)}</td>
                                        <td>{user.name}</td>
                                        <td>{user.goal_cnt}</td>
                                        <td>{user.assist_cnt}</td>
                                        <td>{user.quarter_cnt}</td>
                                        <td>{user.match_cnt}</td>
                                        <td>{user.max_match_cnt}</td>
                                        {/* <td>{Math.round(user.ratio * 100)}%</td> */}
                                    </tr>
                                ))}
                                <tr className="total-row">
                                    <td colSpan="2">합계</td>
                                    <td>{sortedUserStats.reduce((sum, user) => sum + user.goal_cnt, 0)}</td>
                                    <td>{sortedUserStats.reduce((sum, user) => sum + user.assist_cnt, 0)}</td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-data">유저 골/어시스트 정보가 없습니다!</p>
                    )}
                </div>
                <div className='team-stat'>
                    <div className='header'>
                        <h2>⚽ 팀 전적</h2>
                    </div>
                    {sortedOpposingTeamStats.length > 0 ? (
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>순위</th>
                                    <th>팀</th>
                                    <th className={`sortable ${teamSortConfig.key === 'win_match' ? teamSortConfig.direction : ''}`} onClick={() => handleSort('win_match', setTeamSortConfig, teamSortConfig)}>승</th>
                                    <th className={`sortable ${teamSortConfig.key === 'lose_match' ? teamSortConfig.direction : ''}`} onClick={() => handleSort('lose_match', setTeamSortConfig, teamSortConfig)}>패</th>
                                    <th className={`sortable ${teamSortConfig.key === 'draw_match' ? teamSortConfig.direction : ''}`} onClick={() => handleSort('draw_match', setTeamSortConfig, teamSortConfig)}>무</th>
                                    <th className={`sortable ${teamSortConfig.key === 'winning_point' ? teamSortConfig.direction : ''}`} onClick={() => handleSort('winning_point', setTeamSortConfig, teamSortConfig)}>득</th>
                                    <th className={`sortable ${teamSortConfig.key === 'losing_point' ? teamSortConfig.direction : ''}`} onClick={() => handleSort('losing_point', setTeamSortConfig, teamSortConfig)}>실</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedOpposingTeamStats.map((team, index) => (
                                    <tr key={index} className={getRankClass(index + 1)}>
                                        <td>{getRankIcon(index + 1)}</td>
                                        <td>{team.opposing_team}</td>
                                        <td>{team.win_match}</td>
                                        <td>{team.lose_match}</td>
                                        <td>{team.draw_match}</td>
                                        <td>{team.winning_point}</td>
                                        <td>{team.losing_point}</td>
                                    </tr>
                                ))}
                                <tr className="total-row">
                                    <td colSpan="2">합계</td>
                                    <td>{sortedOpposingTeamStats.reduce((sum, team) => sum + team.win_match, 0)}</td>
                                    <td>{sortedOpposingTeamStats.reduce((sum, team) => sum + team.lose_match, 0)}</td>
                                    <td>{sortedOpposingTeamStats.reduce((sum, team) => sum + team.draw_match, 0)}</td>
                                    <td>{sortedOpposingTeamStats.reduce((sum, team) => sum + team.winning_point, 0)}</td>
                                    <td>{sortedOpposingTeamStats.reduce((sum, team) => sum + team.losing_point, 0)}</td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-data">유저 골/어시스트 정보가 없습니다!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Records;
