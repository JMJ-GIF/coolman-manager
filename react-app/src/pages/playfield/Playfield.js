import './Playfield.scss';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import NavigationBar from '../../components/NavigationBar';
import LoadingSpinner from '../../components/LoadingSpinner';

const API_URL = process.env.REACT_APP_API_URL;

const SCHOOLS = [
    '신도림고등학교',
    '인헌고등학교',
    '경문고등학교',
    '상문고등학교',
    '중경고등학교',
    '대영고등학교',
    '언남고등학교',
    '장훈고등학교',
    '영락고등학교',
    '동작고등학교',
    '남강고등학교',
];

export default function Playfield() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState('전체');
    const [lastCrawledAt, setLastCrawledAt] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = selectedSchool !== '전체' ? { school: selectedSchool } : {};
            const res = await axios.get(`${API_URL}/playfield`, { params });
            setAnnouncements(res.data);
        } catch (e) {
            console.error(e);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    }, [selectedSchool]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        axios.get(`${API_URL}/playfield/status`)
            .then(res => setLastCrawledAt(res.data.last_crawled_at))
            .catch(() => {});
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await axios.put(`${API_URL}/playfield/read-all`);
            setAnnouncements(prev => prev.map(a => ({ ...a, is_new: false })));
        } catch (e) {
            console.error(e);
        }
    };

    const handleCardClick = async (item) => {
        window.open(item.link, '_blank', 'noopener,noreferrer');
        if (item.is_new) {
            try {
                await axios.put(`${API_URL}/playfield/${item.id}/read`);
                setAnnouncements(prev =>
                    prev.map(a => a.id === item.id ? { ...a, is_new: false } : a)
                );
            } catch (e) {
                console.error(e);
            }
        }
    };

    const newCount = announcements.filter(a => a.is_new).length;

    const formatCrawledAt = (raw) => {
        if (!raw) return null;
        const normalized = raw.replace(' ', 'T').replace(/\+00$/, '+00:00');
        const utc = new Date(normalized);
        if (isNaN(utc)) return raw.slice(0, 16);
        const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000);
        const pad = n => String(n).padStart(2, '0');
        return `${kst.getUTCFullYear()}.${pad(kst.getUTCMonth() + 1)}.${pad(kst.getUTCDate())} ${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}`;
    };

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">
                {loading && <LoadingSpinner />}

                <div className="playfield-top-card">
                    <div className="playfield-header">
                        <div className="playfield-title-row">
                            <h2 className="playfield-title">
                                운동장 공고
                                {newCount > 0 && (
                                    <span className="new-count-badge">{newCount}건 신규</span>
                                )}
                            </h2>
                            {newCount > 0 && (
                                <button className="mark-all-btn" onClick={handleMarkAllRead}>
                                    전체 확인
                                </button>
                            )}
                        </div>
                        <p className="playfield-subtitle">학교별 운동장 사용 신청 공고를 확인하세요.</p>
                        {lastCrawledAt && (
                            <p className="crawled-at">마지막 수집: {formatCrawledAt(lastCrawledAt)}</p>
                        )}
                    </div>

                    <div className="school-filter">
                        {['전체', ...SCHOOLS].map(school => (
                            <button
                                key={school}
                                className={`filter-btn ${selectedSchool === school ? 'active' : ''}`}
                                onClick={() => setSelectedSchool(school)}
                            >
                                {school}
                            </button>
                        ))}
                    </div>
                </div>

                {!loading && announcements.length === 0 && (
                    <div className="empty-state">
                        <p>공고가 없습니다.</p>
                        <p className="empty-hint">크롤러가 매일 새벽 3시에 자동으로 정보를 수집합니다.</p>
                    </div>
                )}

                <div className="announcement-list">
                    {announcements.map(item => (
                        <div
                            key={item.id}
                            className={`announcement-card ${item.is_new ? 'is-new' : ''}`}
                            onClick={() => handleCardClick(item)}
                        >
                            <div className="card-top">
                                <span className="school-tag">{item.school_name}</span>
                                {item.is_new && <span className="new-badge">NEW</span>}
                            </div>
                            <p className="card-title">{item.title}</p>
                            <p className="card-date">{item.upload_date || '날짜 미상'}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
