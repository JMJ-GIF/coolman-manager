import './Details.scss';
import { useFieldArray } from "react-hook-form";
import React, { useState, useRef, useEffect } from "react";
import x_square_svg from "../../../assets/icons/x_square.svg";
import add_square_svg from "../../../assets/icons/add_square.svg";
import defaultImage from "../../../assets/images/coolman-profile.png";

const EditLineupForm = ({
    control,
    setValue,
    register,
    watch,
    users,
    positions,
    onSubmit
}) => { 
 
    const quartersData = watch("quarters", []);  
    
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedTactics, setSelectedTactics] = useState(""); 
    const [duplicateIndexes, setDuplicateIndexes] = useState([]);    
    
    const filteredQuarter = quartersData.find((quarter) => quarter.quarter_number === selectedQuarter);
    const filteredQuarterIndex = quartersData.findIndex((quarter) => quarter.quarter_number === selectedQuarter);
    const filteredQuarterPath = filteredQuarterIndex !== -1 ? `quarters.${filteredQuarterIndex}`: null;
    
    const { fields: lineupFields, append: appendLineup, remove: deleteLineup } = useFieldArray({
        control,
        name: filteredQuarterPath ? `${filteredQuarterPath}.lineups` : "quarters.0.lineups",
    });        
    
    
    const filteredLineups = filteredQuarter ? filteredQuarter.lineups : [];
    const startingPlayers = filteredLineups.filter(player => player.lineup_status === '선발');
    const substitutePlayers = filteredLineups.filter(player => player.lineup_status === '후보');
    
    useEffect(() => {
        if (filteredQuarter && filteredQuarter.tactics) {
            setSelectedTactics(filteredQuarter.tactics);
            updateLineups(filteredQuarter.tactics);
        }
    }, [filteredQuarter]);

    useEffect(() => {
        const subscription = watch((values) => {
            const RealTimeLineups = values?.quarters?.[filteredQuarterIndex]?.lineups || [];
            const seen = new Set();
            const duplicates = [];
    
            RealTimeLineups.forEach((lineup, index) => {
                if (lineup.role === "용병") {
                    return;
                }                
                if (lineup.user_idx && seen.has(lineup.user_idx)) {
                    duplicates.push(index);
                } else {
                    seen.add(lineup.user_idx);
                }
            });
    
            setDuplicateIndexes(duplicates);
        });
    
        return () => subscription.unsubscribe();
    }, [watch, filteredQuarterIndex]);

    useEffect(() => {
        setOpenDropdown(null);
    }, [selectedQuarter, selectedTactics]);
    
    
    const addSubstitute = () => {
        if (!filteredQuarterPath) return;

        const newSubstitute = {
            user_name: "",
            user_idx : "",
            back_number: "",
            lineup_status: "후보",                
        };

        appendLineup(newSubstitute);
    };  
    
    const deleteSubstitute = (index) => {
        const startingCount = startingPlayers.length; 
        deleteLineup(startingCount + index); 
    };
     
    
    const updateLineups = (newTactics) => {
        if (!filteredQuarter) return; 
                
        const filteredPositions = positions.filter((position) => position.tactics === newTactics);
        const reversedPositions = [...filteredPositions].reverse();
            
        const updatedLineups = filteredLineups.map((lineup, index) => {
            if (lineup.lineup_status === "선발") {
                const position = reversedPositions[index];
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
        setValue(`${filteredQuarterPath}.tactics`, newTactics);
        
    };
    
    
    const handleTacticsChange = (event) => {
        const newTactics = event.target.value;
        setSelectedTactics(newTactics);
        updateLineups(newTactics);        
    };

    const [openDropdown, setOpenDropdown] = useState(null);
    
    return (
        <form onSubmit={onSubmit}>   
            <div className='lineup-group'>
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
                <div className="quarter-tactics">
                    <select value={selectedTactics} onChange={handleTacticsChange}>                    
                    {Array.from(new Set(positions.map((item) => item.tactics))).map((tactic) => (
                        <option key={tactic} value={tactic}>
                            {tactic}
                        </option>
                    ))}
                    </select>
                </div>             
                <div className="soccer-field">
                    {startingPlayers.map((lineup, index) => {
                        const selectedUserIdx = watch(`${filteredQuarterPath}.lineups.${index}.user_idx`, "");
                        const selectedUser = users.find((u) => u.user_idx === selectedUserIdx);
                        const isDuplicate = duplicateIndexes.includes(index);

                        return (
                            <div>
                                <div
                                    key={index}
                                    className="player-marker"                                    
                                    style={{
                                        top: `${lineup.top_coordinate}%`,
                                        left: `${lineup.left_coordinate}%`,
                                    }}
                                    onClick={() => {
                                        setOpenDropdown(index);                                          
                                    }}
                                    
                                >
                                    <div className="position-label">{lineup.position_name}</div>
                                    <div
                                        className="player-circle"
                                        style={{
                                            backgroundImage: `url(${defaultImage})`,
                                        }}                                        
                                    ></div>                                                                
                                        <input
                                            type="text"
                                            readOnly
                                            className={`selected-user-input ${selectedUserIdx === "" || isDuplicate ? "error" : ""}`}
                                            value={selectedUser ? selectedUser.name : ""}
                                            onClick={() => setOpenDropdown(openDropdown === index ? null : index)}
                                            onFocus={() => { 
                                                setValue(`${filteredQuarterPath}.lineups.${index}.user_name`, "");
                                                setValue(`${filteredQuarterPath}.lineups.${index}.back_number`, "");
                                                setValue(`${filteredQuarterPath}.lineups.${index}.user_idx`, "");
                                                setValue(`${filteredQuarterPath}.lineups.${index}.role`, "");
                                            }}
                                            
                                        />                                                                                                            
                                </div>
                                {openDropdown === index && (
                                    <ul className="dropdown-menu"
                                    style={{                                        
                                        top: `${lineup.top_coordinate}%`,
                                        left: `${lineup.left_coordinate}%`,                                                                                
                                    }}>
                                        {users.map((user) => (
                                            <li
                                                key={user.user_idx}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setValue(`${filteredQuarterPath}.lineups.${index}.user_name`, user.name);
                                                    setValue(`${filteredQuarterPath}.lineups.${index}.back_number`, user.back_number);
                                                    setValue(`${filteredQuarterPath}.lineups.${index}.user_idx`, user.user_idx);
                                                    setValue(`${filteredQuarterPath}.lineups.${index}.role`, user.role);
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
                                {substitutePlayers.map((lineup, index) => {
                                    const subIndex = startingPlayers.length + index;
                                    const selectedUserIdx = watch(`${filteredQuarterPath}.lineups.${subIndex}.user_idx`, "");
                                    const selectedUser = users.find((u) => u.user_idx === selectedUserIdx);
                                    const isDuplicate = duplicateIndexes.includes(subIndex);
              
                                    return (
                                        <tr key={lineup.lineup_idx}>
                                            <td>{lineup.back_number}</td>
                                            <td>
                                                
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className={`selected-user-input ${selectedUserIdx === "" || isDuplicate ? "error" : ""}`}
                                                    value={selectedUser ? selectedUser.name : ""}
                                                    onClick={() => setOpenDropdown(openDropdown === subIndex ? null : subIndex)}
                                                    onFocus={() => {
                                                        setValue(`${filteredQuarterPath}.lineups.${subIndex}.user_name`, "");
                                                        setValue(`${filteredQuarterPath}.lineups.${subIndex}.back_number`, "");
                                                        setValue(`${filteredQuarterPath}.lineups.${subIndex}.user_idx`, "");
                                                        setValue(`${filteredQuarterPath}.lineups.${subIndex}.role`, "");
                                                    }}
                                                />
                                                {openDropdown === subIndex && (
                                                    <ul className="dropdown-menu">
                                                        {users.map((user) => (
                                                            <li
                                                                key={user.user_idx}
                                                                className="dropdown-item"
                                                                onClick={() => {
                                                                    setValue(`${filteredQuarterPath}.lineups.${subIndex}.user_name`, user.name);
                                                                    setValue(`${filteredQuarterPath}.lineups.${subIndex}.back_number`, user.back_number);
                                                                    setValue(`${filteredQuarterPath}.lineups.${subIndex}.user_idx`, user.user_idx);
                                                                    setValue(`${filteredQuarterPath}.lineups.${subIndex}.role`, user.role);
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
                                                    onClick={() => deleteSubstitute(index)}
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