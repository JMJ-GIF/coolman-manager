import './Details.scss';
import Select from "react-select";
import { useFieldArray } from "react-hook-form";
import React, { useState, useEffect, useMemo } from "react";
import x_square_svg from "../../../assets/icons/x_square.svg";
import add_square_svg from "../../../assets/icons/add_square.svg";
import coolman_logo from "../../../assets/images/coolman-logo-transparent.png";

const NINE_V_NINE_TACTICS  = ['3-3-2', '3-2-3', '2-3-3'];
const TEN_V_TEN_TACTICS    = ['4-3-2', '3-4-2', '3-3-3'];
const SMALL_TACTICS        = [...NINE_V_NINE_TACTICS, ...TEN_V_TEN_TACTICS];

const getFilteredTactics = (playerCount, allTactics) => {
    if (playerCount === '9v9')   return allTactics.filter(t => NINE_V_NINE_TACTICS.includes(t));
    if (playerCount === '10v10') return allTactics.filter(t => TEN_V_TEN_TACTICS.includes(t));
    return allTactics.filter(t => !SMALL_TACTICS.includes(t));
};

const EditLineupForm = ({
    control,
    setValue,
    register,
    watch,
    users,
    positions,
    onSubmit,
    matchNature,
    teamAName,
    teamBName,
}) => {
    const isNaeJeon = matchNature === '내전';
    const quartersData = watch("quarters", []);
    const playerCount  = watch("player_count") || "11v11";

    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedTactics, setSelectedTactics] = useState("");
    const [selectedTeam, setSelectedTeam]       = useState("A");
    const [duplicateIndexes, setDuplicateIndexes] = useState(new Set());

    const filteredQuarter      = quartersData.find((q) => q.quarter_number === selectedQuarter);
    const filteredQuarterIndex = quartersData.findIndex((q) => q.quarter_number === selectedQuarter);
    const filteredQuarterPath  = filteredQuarterIndex !== -1 ? `quarters.${filteredQuarterIndex}` : null;

    const { fields: lineupFields, append: appendLineup, remove: deleteLineup } = useFieldArray({
        control,
        name: filteredQuarterPath ? `${filteredQuarterPath}.lineups` : "quarters.0.lineups",
    });

    const filteredLineups = filteredQuarter ? filteredQuarter.lineups : [];

    // 내전: 팀별 필터링
    const visibleLineups = isNaeJeon
        ? filteredLineups.filter(p => p.lineup_team === selectedTeam)
        : filteredLineups;

    const startingPlayers    = visibleLineups.filter(p => p.lineup_status === '선발');
    const substitutePlayers  = visibleLineups.filter(p => p.lineup_status === '후보');

    // 전술 옵션 (인원수에 따라 필터)
    const allTactics = Array.from(new Set(positions.map((item) => item.tactics)));
    const uniqueTacticOptions = getFilteredTactics(playerCount, allTactics).map(t => ({ value: t, label: t }));

    const sortedUsers = useMemo(
        () => [...users].sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko")),
        [users]
    );

    useEffect(() => {
        if (filteredQuarter && filteredQuarter.tactics) {
            setSelectedTactics(filteredQuarter.tactics);
        }
    }, [selectedQuarter]);

    useEffect(() => {
        const checkDuplicates = (lineups) => {
            const seen = new Map(); // user_idx → user_idx (for marking first occurrence too)
            const duplicates = new Set();
            lineups.forEach((lineup) => {
                if (lineup.role !== "용병" && lineup.user_idx) {
                    const key = `${lineup.user_idx}`;
                    if (seen.has(key)) {
                        duplicates.add(lineup.user_idx);
                        duplicates.add(seen.get(key));
                    } else {
                        seen.set(key, lineup.user_idx);
                    }
                }
            });
            return duplicates;
        };

        const currentLineups = watch("quarters")?.[filteredQuarterIndex]?.lineups || [];
        setDuplicateIndexes(checkDuplicates(currentLineups));

        const subscription = watch((values) => {
            const rt = values?.quarters?.[filteredQuarterIndex]?.lineups || [];
            setDuplicateIndexes(checkDuplicates(rt));
        });
        return () => subscription.unsubscribe();
    }, [watch, filteredQuarterIndex, isNaeJeon]);

    useEffect(() => {
        setOpenDropdown(null);
    }, [selectedQuarter, selectedTactics, selectedTeam]);

    // 내전일 때 팀별 lineup의 실제 인덱스를 계산
    const getActualIndex = (visibleIndex, lineup_team) => {
        if (!isNaeJeon) return visibleIndex;
        return filteredLineups.findIndex((l, idx) => {
            const sameTeam = l.lineup_team === lineup_team;
            if (!sameTeam) return false;
            const teamLineups = filteredLineups.filter(ll => ll.lineup_team === lineup_team);
            return teamLineups[visibleIndex] === l;
        });
    };

    const addSubstitute = () => {
        if (!filteredQuarterPath) return;
        appendLineup({
            user_name: "", user_idx: "", back_number: "",
            lineup_status: "후보",
            lineup_team: isNaeJeon ? selectedTeam : null,
        });
    };

    const deleteSubstitute = (visibleSubIndex) => {
        // 전체 lineups 배열에서 해당 항목의 실제 인덱스 찾기
        const teamStartingCount = startingPlayers.length;
        const targetVisible = visibleSubIndex; // substitute 내에서의 인덱스

        if (isNaeJeon) {
            const teamSubs = filteredLineups
                .map((l, idx) => ({ ...l, realIdx: idx }))
                .filter(l => l.lineup_team === selectedTeam && l.lineup_status === '후보');
            if (teamSubs[targetVisible]) {
                deleteLineup(teamSubs[targetVisible].realIdx);
            }
        } else {
            deleteLineup(teamStartingCount + targetVisible);
        }
    };

    const updateLineups = (newTactics, team = null) => {
        if (!filteredQuarter) return;
        const filteredPositions = positions.filter((p) => p.tactics === newTactics);

        let startingIdx = 0;
        const updatedLineups = filteredLineups.map((lineup) => {
            const belongsToTarget = !isNaeJeon || lineup.lineup_team === team;
            if (lineup.lineup_status === "선발" && belongsToTarget) {
                const position = filteredPositions[startingIdx++];
                return {
                    ...lineup,
                    tactics: newTactics,
                    position_name: position?.name,
                    position_idx: position?.position_idx,
                    top_coordinate: position?.top_coordinate,
                    left_coordinate: position?.left_coordinate,
                };
            }
            return lineup;
        });

        setValue(`${filteredQuarterPath}.lineups`, updatedLineups);
        if (!isNaeJeon || team === 'A') {
            setValue(`${filteredQuarterPath}.tactics`, newTactics);
        }
        if (isNaeJeon && team === 'B') {
            setValue(`${filteredQuarterPath}.team_b_tactics`, newTactics);
        }
    };

    const handleTacticsChange = (selectedOption) => {
        const newTactics = selectedOption?.value;
        setSelectedTactics(newTactics);
        updateLineups(newTactics, isNaeJeon ? selectedTeam : null);
    };

    const [openDropdown, setOpenDropdown] = useState(null);

    // 현재 보이는 starting players에서의 인덱스 → 전체 lineups 배열에서의 실제 인덱스
    const getStartingRealIndex = (visibleStartIdx) => {
        if (!isNaeJeon) return visibleStartIdx;
        const teamStarters = filteredLineups
            .map((l, idx) => ({ ...l, realIdx: idx }))
            .filter(l => l.lineup_team === selectedTeam && l.lineup_status === '선발');
        return teamStarters[visibleStartIdx]?.realIdx ?? visibleStartIdx;
    };

    const getSubstituteRealIndex = (visibleSubIdx) => {
        if (!isNaeJeon) return startingPlayers.length + visibleSubIdx;
        const teamSubs = filteredLineups
            .map((l, idx) => ({ ...l, realIdx: idx }))
            .filter(l => l.lineup_team === selectedTeam && l.lineup_status === '후보');
        return teamSubs[visibleSubIdx]?.realIdx ?? (startingPlayers.length + visibleSubIdx);
    };

    const currentTacticsValue = isNaeJeon
        ? (selectedTeam === 'A' ? filteredQuarter?.tactics : filteredQuarter?.team_b_tactics) || selectedTactics
        : selectedTactics;

    return (
        <form onSubmit={onSubmit}>
            <div className="lineup-group">
                {/* 쿼터 선택 */}
                <div className="quarter-buttons">
                    {quartersData.map((quarter) => (
                        <button
                            key={quarter.quarter_number}
                            className={`quarter-btn ${selectedQuarter === quarter.quarter_number ? "active" : ""}`}
                            onClick={() => setSelectedQuarter(quarter.quarter_number)}
                            type="button"
                        >
                            {quarter.quarter_number}
                        </button>
                    ))}
                </div>

                {/* 내전: 팀 선택 버튼 */}
                {isNaeJeon && (
                    <div className="quarter-buttons" style={{ marginTop: '8px' }}>
                        <button
                            type="button"
                            className={`quarter-btn ${selectedTeam === 'A' ? 'active' : ''}`}
                            onClick={() => { setSelectedTeam('A'); setSelectedTactics(filteredQuarter?.tactics || ''); }}
                        >
                            {teamAName || 'A팀'}
                        </button>
                        <button
                            type="button"
                            className={`quarter-btn ${selectedTeam === 'B' ? 'active' : ''}`}
                            onClick={() => { setSelectedTeam('B'); setSelectedTactics(filteredQuarter?.team_b_tactics || filteredQuarter?.tactics || ''); }}
                        >
                            {teamBName || 'B팀'}
                        </button>
                    </div>
                )}

                {/* 전술 선택 */}
                <div className="quarter-tactics">
                    <Select
                        options={uniqueTacticOptions}
                        value={uniqueTacticOptions.find((opt) => opt.value === currentTacticsValue) || null}
                        onChange={handleTacticsChange}
                        placeholder="전술 선택"
                        className="react-select-container"
                        classNamePrefix="custom-select"
                        isClearable={false}
                        isSearchable={false}
                        components={{ DropdownIndicator: null }}
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({
                                ...base, padding: "5px", border: "1px solid #ccc",
                                borderRadius: "4px", fontSize: "16px", fontWeight: "bold",
                                textAlign: "center", width: "auto", height: "auto", minHeight: "auto",
                            }),
                            singleValue: (base) => ({ ...base, textAlign: "center", fontWeight: "bold" }),
                            menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                            option: (base) => ({ ...base, fontSize: "16px", textAlign: "center" }),
                        }}
                    />
                </div>

                {/* 선발 필드 */}
                <div className="soccer-field">
                    {startingPlayers.map((lineup, visibleIdx) => {
                        const realIdx = getStartingRealIndex(visibleIdx);
                        const selectedUserIdx = watch(`${filteredQuarterPath}.lineups.${realIdx}.user_idx`, "");
                        const selectedUser = users.find((u) => u.user_idx === selectedUserIdx);
                        const isDuplicate  = duplicateIndexes.has(selectedUserIdx);

                        return (
                            <div key={realIdx}>
                                <div
                                    className="player-marker"
                                    style={{ top: `${lineup.top_coordinate}%`, left: `${lineup.left_coordinate}%` }}
                                    onClick={() => setOpenDropdown(realIdx)}
                                >
                                    <div className="position-label">{lineup.position_name}</div>
                                    <div
                                        className="player-circle"
                                        style={{ backgroundImage: `url(${lineup.image_url || coolman_logo})` }}
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        className={`selected-user-input ${selectedUserIdx === "" || isDuplicate ? "error" : ""}`}
                                        value={selectedUser ? selectedUser.name : ""}
                                        onClick={() => setOpenDropdown(openDropdown === realIdx ? null : realIdx)}
                                        onFocus={() => {
                                            setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_name`, "");
                                            setValue(`${filteredQuarterPath}.lineups.${realIdx}.back_number`, "");
                                            setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_idx`, "");
                                            setValue(`${filteredQuarterPath}.lineups.${realIdx}.role`, "");
                                            setValue(`${filteredQuarterPath}.lineups.${realIdx}.image_url`, "");
                                        }}
                                    />
                                </div>
                                {openDropdown === realIdx && (
                                    <ul
                                        className="dropdown-menu"
                                        style={{ top: `${lineup.top_coordinate}%`, left: `${lineup.left_coordinate}%` }}
                                    >
                                        {sortedUsers.map((user) => (
                                            <li
                                                key={user.user_idx}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_name`, user.name);
                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.back_number`, user.back_number);
                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_idx`, user.user_idx);
                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.role`, user.role);
                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.image_url`, user.image_url);
                                                    setOpenDropdown(null);
                                                }}
                                            >
                                                {user.name} ({user.back_number})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* 후보 테이블 */}
                <div className="lineup-container">
                    <div className="lineup-section">
                        <h3 className="section-title">후보</h3>
                        <table className="lineup-table">
                            <thead>
                                <tr>
                                    <th>등번호</th>
                                    <th>사람</th>
                                    <th>상태</th>
                                    <th>삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {substitutePlayers.map((lineup, visibleIdx) => {
                                    const realIdx = getSubstituteRealIndex(visibleIdx);
                                    const selectedUserIdx = watch(`${filteredQuarterPath}.lineups.${realIdx}.user_idx`, "");
                                    const selectedUser = users.find((u) => u.user_idx === selectedUserIdx);
                                    const isDuplicate  = duplicateIndexes.has(selectedUserIdx);

                                    return (
                                        <tr key={realIdx}>
                                            <td>{lineup.back_number}</td>
                                            <td>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className={`selected-user-input ${selectedUserIdx === "" || isDuplicate ? "error" : ""}`}
                                                    value={selectedUser ? selectedUser.name : ""}
                                                    onClick={() => setOpenDropdown(openDropdown === realIdx ? null : realIdx)}
                                                    onFocus={() => {
                                                        setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_name`, "");
                                                        setValue(`${filteredQuarterPath}.lineups.${realIdx}.back_number`, "");
                                                        setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_idx`, "");
                                                        setValue(`${filteredQuarterPath}.lineups.${realIdx}.role`, "");
                                                    }}
                                                />
                                                {openDropdown === realIdx && (
                                                    <ul className="dropdown-menu">
                                                        {sortedUsers.map((user) => (
                                                            <li
                                                                key={user.user_idx}
                                                                className="dropdown-item"
                                                                onClick={() => {
                                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_name`, user.name);
                                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.back_number`, user.back_number);
                                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.user_idx`, user.user_idx);
                                                                    setValue(`${filteredQuarterPath}.lineups.${realIdx}.role`, user.role);
                                                                    setOpenDropdown(null);
                                                                }}
                                                            >
                                                                {user.name} ({user.back_number})
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </td>
                                            <td className="substitute">후보</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="delete-substitute-button"
                                                    onClick={() => deleteSubstitute(visibleIdx)}
                                                >
                                                    <img src={x_square_svg} alt="Delete" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <button
                            type="button"
                            className="add-substitute-button"
                            onClick={addSubstitute}
                        >
                            <img src={add_square_svg} alt="Add Substitute" />
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EditLineupForm;
