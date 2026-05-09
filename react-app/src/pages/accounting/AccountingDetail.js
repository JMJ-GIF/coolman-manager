import './AccountingDetail.scss';
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import back_arrow from '../../assets/icons/back_arrow.svg';
import delete_svg from '../../assets/icons/delete.svg';
import plus_svg from '../../assets/icons/plus.svg';

const API_URL = process.env.REACT_APP_API_URL;

const FEE_TYPES = ['분기회비', '월회비', '휴회비', '휴회경기참가비'];
const FEE_DEFAULTS = { '분기회비': 75000, '월회비': 27000, '휴회비': 10000, '휴회경기참가비': 9000 };

function formatDt(dtStr) {
    if (!dtStr) return '';
    const d = new Date(dtStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
}

function quarterLabel(year, quarter) {
    return `${String(year).slice(2)}-${quarter}Q`;
}

function getStatus(amount, paid) {
    if (amount === 0) return '-';
    return paid >= amount ? '납부완료' : '납부필요';
}

let tempId = -1;
function nextTempId() { return tempId--; }

// 숫자 입력 포커스 시 전체 선택 (0 제거 편의)
function NumInput({ value, onChange, ...props }) {
    return (
        <input
            type="number"
            value={value}
            min="0"
            onFocus={e => e.target.select()}
            onChange={e => onChange(parseInt(e.target.value) || 0)}
            {...props}
        />
    );
}

export default function AccountingDetail() {
    const { user_idx } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const year = parseInt(searchParams.get('year'));
    const quarter = parseInt(searchParams.get('quarter'));

    const [userName, setUserName] = useState('');
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleted, setDeleted] = useState(new Set());

    const goBack = () => navigate(`/accounting?year=${year}&quarter=${quarter}`);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [userRes, recRes] = await Promise.all([
                axios.get(`${API_URL}/users/${user_idx}`),
                axios.get(`${API_URL}/accounting/records/${user_idx}`, { params: { year, quarter } })
            ]);
            setUserName(userRes.data.name);
            setRecords(recRes.data.map(r => ({ ...r, _dirty: false })));
            setDeleted(new Set());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user_idx, year, quarter]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const updateRecord = (id, field, value) => {
        setRecords(prev => prev.map(r => {
            if (r.record_idx !== id) return r;
            const updated = { ...r, [field]: value, _dirty: true };
            if (field === 'fee_type') {
                updated.amount = FEE_DEFAULTS[value] ?? r.amount;
            }
            return updated;
        }));
    };

    const addRow = () => {
        const m1 = (quarter - 1) * 3 + 1;
        const defaultDt = `${year}-${String(m1).padStart(2, '0')}-01`;
        setRecords(prev => [...prev, {
            record_idx: nextTempId(),
            user_idx: parseInt(user_idx),
            dt: defaultDt,
            fee_type: '분기회비',
            amount: 75000,
            paid_amount: 0,
            note: '',
            match_idx: null,
            opposing_team: null,
            _dirty: true,
            _new: true
        }]);
    };

    const markDeleted = (id) => {
        if (id < 0) {
            setRecords(prev => prev.filter(r => r.record_idx !== id));
        } else {
            setDeleted(prev => new Set([...prev, id]));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const ops = [];
            for (const rec of records) {
                if (deleted.has(rec.record_idx)) continue;
                if (rec._new) {
                    ops.push(axios.post(`${API_URL}/accounting/records`, {
                        user_idx: rec.user_idx,
                        dt: rec.dt,
                        fee_type: rec.fee_type,
                        amount: rec.amount,
                        paid_amount: rec.paid_amount,
                        note: rec.note || null,
                        match_idx: rec.match_idx || null
                    }));
                } else if (rec._dirty) {
                    ops.push(axios.put(`${API_URL}/accounting/records/${rec.record_idx}`, {
                        dt: rec.dt,
                        fee_type: rec.fee_type,
                        amount: rec.amount,
                        paid_amount: rec.paid_amount,
                        note: rec.note || null,
                        match_idx: rec.match_idx || null
                    }));
                }
            }
            for (const id of deleted) {
                ops.push(axios.delete(`${API_URL}/accounting/records/${id}`));
            }
            await Promise.all(ops);
            goBack();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const visibleRecords = records.filter(r => !deleted.has(r.record_idx));
    const totalAmount = visibleRecords.reduce((s, r) => s + (parseInt(r.amount) || 0), 0);
    const totalPaid = visibleRecords.reduce((s, r) => s + (parseInt(r.paid_amount) || 0), 0);
    const overallStatus = getStatus(totalAmount, totalPaid);

    return (
        <div className="gray-background">
            <div className="content">
                {loading && <LoadingSpinner />}

                <div className="top-floating-area">
                    <img src={back_arrow} alt="back" onClick={goBack} />
                </div>

                {/* 헤더 요약 */}
                <div className="detail-header-card">
                    <h2>{userName} {quarterLabel(year, quarter)} 상세</h2>
                    <div className="detail-summary">
                        <span>회비 합계: <strong>{totalAmount.toLocaleString()}원</strong></span>
                        <span>납입 합계: <strong>{totalPaid.toLocaleString()}원</strong></span>
                        {totalAmount > 0 && (
                            <span className={`status-badge ${overallStatus === '납부완료' ? 'paid' : 'unpaid'}`}>
                                {overallStatus}
                            </span>
                        )}
                    </div>
                </div>

                {/* 기록 테이블 */}
                <div className="detail-section">
                    <div className="table-wrapper">
                        <table className="detail-table">
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>타입</th>
                                    <th>회비</th>
                                    <th>납입금</th>
                                    <th>상태</th>
                                    <th>비고</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleRecords.map(rec => (
                                    <tr key={rec.record_idx}>
                                        <td>
                                            <input
                                                type="date"
                                                value={rec.dt ? rec.dt.slice(0, 10) : ''}
                                                onChange={e => updateRecord(rec.record_idx, 'dt', e.target.value)}
                                            />
                                            <span className="date-label">{formatDt(rec.dt)}</span>
                                        </td>
                                        <td>
                                            <select
                                                value={rec.fee_type}
                                                onChange={e => updateRecord(rec.record_idx, 'fee_type', e.target.value)}
                                            >
                                                {FEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td>
                                            <NumInput
                                                value={rec.amount}
                                                onChange={v => updateRecord(rec.record_idx, 'amount', v)}
                                            />
                                        </td>
                                        <td>
                                            <NumInput
                                                value={rec.paid_amount}
                                                onChange={v => updateRecord(rec.record_idx, 'paid_amount', v)}
                                            />
                                        </td>
                                        <td>
                                            <span className={`status-badge ${getStatus(rec.amount, rec.paid_amount) === '납부완료' ? 'paid' : 'unpaid'}`}>
                                                {getStatus(rec.amount, rec.paid_amount)}
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="text"
                                                className="note-input"
                                                value={rec.note || ''}
                                                placeholder="비고"
                                                onChange={e => updateRecord(rec.record_idx, 'note', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <button className="del-btn" onClick={() => markDeleted(rec.record_idx)}>
                                                <img src={delete_svg} alt="삭제" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <button className="add-row-btn" onClick={addRow}>
                        <img src={plus_svg} alt="추가" /> 행 추가
                    </button>
                </div>

                {/* 저장/취소 — FloatingBar 스타일 */}
                <div className="detail-floating-actions">
                    <button className="action-button cancel" onClick={goBack}>취소</button>
                    <button className="action-button confirm" onClick={handleSave} disabled={saving}>
                        {saving ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
}
