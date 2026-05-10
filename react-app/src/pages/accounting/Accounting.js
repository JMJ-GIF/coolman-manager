import './Accounting.scss';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavigationBar from '../../components/NavigationBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import FloatingBar from '../../components/FloatingBar';
import { useAlert } from '../../context/AlertContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL;
const FEE_TYPES = ['정회원', '월회원', '휴회원', '탈퇴회원'];

function generateQuarters() {
    const quarters = [];
    const now = new Date();
    let year = 2026, quarter = 1;
    const curYear = now.getFullYear();
    const curQ = Math.ceil((now.getMonth() + 1) / 3);
    while (year < curYear || (year === curYear && quarter <= curQ)) {
        quarters.push({ year, quarter });
        quarter++;
        if (quarter > 4) { quarter = 1; year++; }
    }
    return quarters;
}

function quarterLabel(year, quarter) {
    return `${String(year).slice(2)}-${quarter}Q`;
}

function getStatus(total_amount, total_paid) {
    if (total_amount === 0 && total_paid === 0) return '납부완료';
    if (total_amount === 0) return null;
    return total_paid >= total_amount ? '납부완료' : '납부필요';
}

function buildNote(row) {
    const parts = [];
    if (row.match_participation_cnt > 0) parts.push(`경기참가 ${row.match_participation_cnt}회`);
    if (row.note) parts.push(row.note);
    return parts.join(', ');
}

export default function Accounting() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showAlert } = useAlert();
    const { authUser } = useAuth();
    const isDirector = authUser?.role === '감독';

    const checkDirector = () => {
        if (!isDirector) {
            showAlert('warning', '⚠️ 수정 권한이 없습니다. 감독만 가능합니다.');
            return false;
        }
        return true;
    };
    const quarters = generateQuarters();

    const lastQ = quarters[quarters.length - 1];
    const initialYear = parseInt(searchParams.get('year')) || lastQ.year;
    const initialQ = parseInt(searchParams.get('quarter')) || lastQ.quarter;

    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedQ, setSelectedQ] = useState(initialQ);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState({});

    const handleQuarterChange = (e) => {
        const [y, q] = e.target.value.split('-').map(Number);
        setSelectedYear(y);
        setSelectedQ(q);
        setSearchParams({ year: y, quarter: q });
        setEditMode(false);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/accounting`, {
                params: { year: selectedYear, quarter: selectedQ }
            });
            setData(res.data);
            const initial = {};
            res.data.forEach(row => {
                initial[row.user_idx] = {
                    member_type: row.member_type || '',
                    note: row.note || ''
                };
            });
            setEditData(initial);
        } catch (e) {
            console.error(e);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedYear, selectedQ]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleGenerate = async () => {
        if (!checkDirector()) return;
        setGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/accounting/generate`, null, {
                params: { year: selectedYear, quarter: selectedQ }
            });
            showAlert('success', `${res.data.created}건의 회비 기록이 생성되었습니다.`);
            fetchData();
        } catch (e) {
            console.error(e);
        } finally {
            setGenerating(false);
        }
    };

    const handleReset = () => {
        if (!checkDirector()) return;
        showAlert(
            'confirm',
            `${quarterLabel(selectedYear, selectedQ)} 회비를 초기화하시겠습니까?\n회비 기록과 유저 타입이 모두 삭제됩니다.`,
            async () => {
                setResetting(true);
                try {
                    await axios.delete(`${API_URL}/accounting/reset`, {
                        params: { year: selectedYear, quarter: selectedQ }
                    });
                    fetchData();
                } catch (e) {
                    console.error(e);
                } finally {
                    setResetting(false);
                }
            }
        );
    };

    const handleSave = async () => {
        try {
            const promises = [];
            data.forEach(row => {
                const ed = editData[row.user_idx];
                if (!ed) return;
                if (ed.member_type !== (row.member_type || '')) {
                    promises.push(axios.put(`${API_URL}/accounting/member_type`, {
                        user_idx: row.user_idx,
                        year: selectedYear,
                        quarter: selectedQ,
                        member_type: ed.member_type
                    }));
                }
            });
            await Promise.all(promises);
            setEditMode(false);
            fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleCancel = () => {
        const initial = {};
        data.forEach(row => {
            initial[row.user_idx] = {
                member_type: row.member_type || '',
                note: row.note || ''
            };
        });
        setEditData(initial);
        setEditMode(false);
    };

    const handleRowClick = (userIdx) => {
        navigate(`/accounting/${userIdx}?year=${selectedYear}&quarter=${selectedQ}`);
    };

    const sortedData = [...data].sort((a, b) => {
        const ti = FEE_TYPES.indexOf(a.member_type ?? '');
        const tj = FEE_TYPES.indexOf(b.member_type ?? '');
        const typeOrder = (ti === -1 ? 999 : ti) - (tj === -1 ? 999 : tj);
        if (typeOrder !== 0) return typeOrder;
        return a.name.localeCompare(b.name, 'ko');
    });

    const summary = (() => {
        const map = {};
        FEE_TYPES.forEach(t => { map[t] = { count: 0, amount: 0, paid: 0 }; });
        data.forEach(row => {
            const t = row.member_type;
            if (t && map[t]) {
                map[t].count++;
                map[t].amount += row.total_amount;
                map[t].paid += row.total_paid;
            }
        });
        return map;
    })();

    const STATUSES = ['납부완료', '납부필요'];

    const crossSummary = (() => {
        const map = {};
        FEE_TYPES.forEach(t => {
            map[t] = {};
            STATUSES.forEach(s => { map[t][s] = { count: 0, amount: 0, paid: 0 }; });
        });
        data.forEach(row => {
            const t = row.member_type;
            const s = getStatus(row.total_amount, row.total_paid);
            if (t && map[t] && s && map[t][s]) {
                map[t][s].count++;
                map[t][s].amount += row.total_amount;
                map[t][s].paid += row.total_paid;
            }
        });
        return map;
    })();

    const summaryTotal = { count: 0, amount: 0, paid: 0 };
    FEE_TYPES.forEach(t => STATUSES.forEach(s => {
        summaryTotal.count += crossSummary[t][s].count;
        summaryTotal.amount += crossSummary[t][s].amount;
        summaryTotal.paid += crossSummary[t][s].paid;
    }));

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">
                {loading && <LoadingSpinner />}

                {/* 분기 선택 */}
                <div className="season-filter">
                    <div className="season-top">
                        <label htmlFor="quarter-select">분기 선택: </label>
                        <select
                            id="quarter-select"
                            className="season-select"
                            value={`${selectedYear}-${selectedQ}`}
                            onChange={handleQuarterChange}
                        >
                            {quarters.map(({ year, quarter }) => (
                                <option key={`${year}-${quarter}`} value={`${year}-${quarter}`}>
                                    {quarterLabel(year, quarter)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="season-actions">
                        <button
                            className="action-btn generate"
                            onClick={handleGenerate}
                            disabled={generating}
                        >
                            {generating ? '생성 중...' : '회비 자동생성'}
                        </button>
                        <button
                            className="action-btn reset"
                            onClick={handleReset}
                            disabled={resetting}
                        >
                            {resetting ? '초기화 중...' : '회비 초기화'}
                        </button>
                    </div>
                </div>

                {/* 회비 표 */}
                <div className="accounting-section">
                    <div className="table-wrapper">
                        <table className="accounting-table">
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>타입</th>
                                    <th>회비</th>
                                    <th>납입금</th>
                                    <th>상태</th>
                                    <th>비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.map(row => {
                                    const status = getStatus(row.total_amount, row.total_paid);
                                    const ed = editData[row.user_idx] || {};
                                    return (
                                        <tr
                                            key={row.user_idx}
                                            className="clickable-row"
                                            onClick={() => !editMode && handleRowClick(row.user_idx)}
                                        >
                                            <td>{row.name}</td>
                                            <td onClick={e => editMode && e.stopPropagation()}>
                                                {editMode ? (
                                                    <select
                                                        value={ed.member_type || ''}
                                                        onChange={e => setEditData(prev => ({
                                                            ...prev,
                                                            [row.user_idx]: { ...prev[row.user_idx], member_type: e.target.value }
                                                        }))}
                                                    >
                                                        <option value="">-</option>
                                                        {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className={`type-badge type-${row.member_type}`}>
                                                        {row.member_type || '-'}
                                                    </span>
                                                )}
                                            </td>
                                            <td>{row.total_amount.toLocaleString()}</td>
                                            <td>{row.total_paid.toLocaleString()}</td>
                                            <td>
                                                {status && (
                                                    <span className={`status-badge ${status === '납부완료' ? 'paid' : 'unpaid'}`}>
                                                        {status}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="note-text">{buildNote(row)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 집계 표 */}
                {data.length > 0 && (
                    <div className="accounting-section">
                        <div className="table-wrapper">
                            <table className="accounting-table summary-table">
                                <thead>
                                    <tr>
                                        <th>타입</th>
                                        <th>상태</th>
                                        <th>인원수</th>
                                        <th>회비총액</th>
                                        <th>납입금총액</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {FEE_TYPES.map(t => (
                                        STATUSES.map((s, si) => (
                                            <tr key={`${t}-${s}`}>
                                                {si === 0 && (
                                                    <td rowSpan={STATUSES.length} className="type-cell">
                                                        <span className={`type-badge type-${t}`}>{t}</span>
                                                    </td>
                                                )}
                                                <td>
                                                    <span className={`status-badge ${s === '납부완료' ? 'paid' : 'unpaid'}`}>{s}</span>
                                                </td>
                                                <td>{crossSummary[t][s].count}명</td>
                                                <td>{crossSummary[t][s].amount.toLocaleString()}원</td>
                                                <td>{crossSummary[t][s].paid.toLocaleString()}원</td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="summary-total-row">
                                        <td colSpan={2}>합계</td>
                                        <td>{summaryTotal.count}명</td>
                                        <td>{summaryTotal.amount.toLocaleString()}원</td>
                                        <td>{summaryTotal.paid.toLocaleString()}원</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                <FloatingBar
                    mode={editMode ? 'save_cancel' : 'edit'}
                    onEdit={() => { if (checkDirector()) setEditMode(true); }}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            </div>
        </div>
    );
}
