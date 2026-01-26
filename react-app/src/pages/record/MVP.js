import './MVP.scss';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext';
import NavigationBar from '../../components/NavigationBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarIcon from '../../assets/icons/star.png';

function MVP() {
    const { positionType, year } = useParams();
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const API_URL = process.env.REACT_APP_API_URL;

    const [loading, setLoading] = useState(true);
    const [mvpData, setMvpData] = useState(null);
    const [playerStats, setPlayerStats] = useState(null);

    useEffect(() => {
        fetchMvpData();
    }, [positionType, year]);

    const fetchMvpData = async () => {
        setLoading(true);
        try {
            // MVP 데이터 가져오기
            const mvpResponse = await axios.get(`${API_URL}/mvp/${positionType}/${year}`);
            setMvpData(mvpResponse.data);

            // 플레이어 통계 가져오기
            const statsResponse = await axios.get(
                `${API_URL}/mvp/stats/${mvpResponse.data.player_idx}/${year}`
            );
            setPlayerStats(statsResponse.data);
        } catch (error) {
            console.error('Error fetching MVP data:', error);
            showAlert('warning', 'MVP 데이터를 불러올 수 없습니다.');
            navigate('/records');
        } finally {
            setLoading(false);
        }
    };

    const getYearShort = (fullYear) => {
        return String(fullYear).slice(-2);
    };

    if (loading) {
        return (
            <div className="gray-background">
                <NavigationBar />
                <div className="content">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!mvpData || !playerStats) {
        return null;
    }

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content mvp-content">
                <div className="mvp-card">
                    {/* 배경 연도 */}
                    <div className="mvp-year-background">
                        {getYearShort(mvpData.year)}
                    </div>

                    {/* 좌측 섹션 */}
                    <div className="mvp-left-section">
                        {/* 골든 스타 */}
                        <img src={StarIcon} alt="MVP Star" className="mvp-golden-star" />

                        {/* 메인 포지션 */}
                        <div className="mvp-main-position">
                            {mvpData.main_position || mvpData.position_type}
                        </div>

                        {/* 플레이어 이름 */}
                        <div className="mvp-player-name">
                            {mvpData.player_name}
                        </div>

                        {/* 메인 타이틀 (한줄 소개) */}
                        {mvpData.main_title && (
                            <div className="mvp-main-title">
                                {mvpData.main_title}
                            </div>
                        )}
                    </div>

                    {/* 우측 프로필 이미지 */}
                    <div className="mvp-image-container">
                        {mvpData.mvp_image_url ? (
                            <img
                                src={mvpData.mvp_image_url}
                                alt={mvpData.player_name}
                                className="mvp-profile-image"
                            />
                        ) : mvpData.player_image_url ? (
                            <img
                                src={mvpData.player_image_url}
                                alt={mvpData.player_name}
                                className="mvp-profile-image"
                            />
                        ) : (
                            <div className="mvp-profile-image-placeholder">
                                <span>{mvpData.player_back_number}</span>
                            </div>
                        )}
                    </div>

                    {/* 플레이어 통계 */}
                    <div className="mvp-stats">
                        <div className="stat-row">
                            <span className="stat-label">골</span>
                            <span className="stat-value">{playerStats.total_goals}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">어시스트</span>
                            <span className="stat-value">{playerStats.total_assists}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">쿼터</span>
                            <span className="stat-value">{playerStats.total_quarters}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">경기</span>
                            <span className="stat-value">{playerStats.total_matches}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">출석률</span>
                            <span className="stat-value">{playerStats.attendance_rate}%</span>
                        </div>
                    </div>
                </div>

                {/* 댓글 섹션 (카드 외부) */}
                {mvpData.comments && mvpData.comments.length > 0 && (
                    <div className="mvp-comments-section">
                        <h3>평가</h3>
                        {mvpData.comments.map((comment) => (
                            <div key={comment.comment_idx} className="comment-card">
                                <p>{comment.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MVP;
