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
    const { fields: quarterFields } = useFieldArray({
        control,
        name: "quarters",
    });          

    const inputRefs = useRef([]);    
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedTactics, setSelectedTactics] = useState(null); 
    const [duplicateIndexes, setDuplicateIndexes] = useState([]);                               
    
    const { fields: lineupFields, append: appendLineup, remove: deleteLineup } = useFieldArray({
        control,
        name: `quarters.${quarterFields.findIndex((q) => q.quarter_number === selectedQuarter)}.lineups`
    });        
    const quartersData = watch("quarters", []);
    const filteredQuarter = quartersData.find((quarter) => quarter.quarter_number === selectedQuarter);
    const filteredQuarterIndex = quarterFields.findIndex((quarter) => quarter.quarter_number === selectedQuarter);
    const filteredQuarterPath = filteredQuarterIndex !== -1
    ? `quarters.${filteredQuarterIndex}`
    : null;
    const filteredLineups = filteredQuarter ? filteredQuarter.lineups : [];
    const startingPlayers = filteredLineups.filter(player => player.lineup_status === '선발');
    const substitutePlayers = filteredLineups.filter(player => player.lineup_status === '후보');
    
    useEffect(() => {
        if (filteredQuarter && filteredQuarter.tactics) {
            setSelectedTactics(filteredQuarter.tactics);
        }
    }, [filteredQuarter]);

    useEffect(() => {
        
        const subscription = watch((values) => {
            const RealTimeLineups = values?.quarters?.[filteredQuarterIndex]?.lineups || [];
            const seen = new Set();
            const duplicates = [];
    
            RealTimeLineups.forEach((lineup, index) => {
                const key = `${lineup.user_name}-${lineup.back_number}`;
                if (lineup.user_name === "용병" && lineup.back_number === 0) {
                     return;
                }
                if (lineup.user_name && lineup.back_number && seen.has(key)) {
                    duplicates.push(index); 
                } else {
                    seen.add(key); 
                }
            });
    
            setDuplicateIndexes(duplicates); 
        });
    
        return () => subscription.unsubscribe(); // Cleanup subscription
    }, [watch, filteredQuarterIndex]);
    

    const addSubstitute = () => {
        if (!filteredQuarterPath) return;

        const newSubstitute = {
            user_name: "",
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
    
    return (
        <form onSubmit={onSubmit}>   
            <div className='lineup-group'>
                <div className="quarter-buttons">
                    {quarterFields.map((quarter) => (
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
                        {Array.from(new Set(positions.map((item) => item.tactics))).map((tactic, index) => (
                            <option key={index} value={tactic}>
                                {tactic}
                            </option>
                        ))}
                    </select>
                </div>             
                <div className="soccer-field">
                    {startingPlayers.map((lineup, index) => {
                        const selectedUserName = watch(`${filteredQuarterPath}.lineups.${index}.user_name`, "");
                        const isDuplicate = duplicateIndexes.includes(index);                        
                        return (
                            <div
                                key={index}
                                className="player-marker"
                                style={{
                                    top: `${lineup.top_coordinate}%`,
                                    left: `${lineup.left_coordinate}%`,
                                }}
                            >
                                <div className="position-label">{lineup.position_name}</div>
                                <div
                                    className="player-circle"
                                    style={{
                                        backgroundImage: `url(${defaultImage})`,
                                    }}
                                    onClick={() => {
                                        inputRefs.current[index].focus();
                                    }}
                                ></div>
                                <select
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    value={selectedUserName}
                                    className={`${selectedUserName === "" || isDuplicate ? "error" : ""}`}
                                    onChange={(e) => {
                                        const selectedValue = e.target.value;
                                        const user = users.find((u) => u.name === selectedValue);

                                        if (user) {                                            
                                            setValue(`${filteredQuarterPath}.lineups.${index}.user_name`, user.name);
                                            setValue(`${filteredQuarterPath}.lineups.${index}.back_number`, user.back_number);
                                        }
                                    }}
                                    onFocus={() => {                                        
                                        setValue(`${filteredQuarterPath}.lineups.${index}.user_name`, "");
                                        setValue(`${filteredQuarterPath}.lineups.${index}.back_number`, "");
                                    }}                           
                                >                                    
                                    <option value={selectedUserName}>
                                        {selectedUserName}
                                    </option>                                    
                                    {users.map((user) => (
                                        <option key={user.user_idx} value={user.name}>
                                            {user.name} ({user.back_number})
                                        </option>
                                    ))}
                                </select>
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
                                    const selectedUserName = watch(
                                        `${filteredQuarterPath}.lineups.${startingPlayers.length + index}.user_name`,
                                        ""
                                    );
                                    const isDuplicate = duplicateIndexes.includes(index);
                                    return (
                                        <tr key={lineup.lineup_idx}>
                                            <td>{lineup.back_number}</td>
                                            <td>
                                                <select
                                                    value={selectedUserName}
                                                    onChange={(e) => {
                                                        const selectedValue = e.target.value;
                                                        const user = users.find(
                                                            (u) => `${u.name} (${u.back_number})` === selectedValue
                                                        );

                                                        if (user) {
                                                            setValue(
                                                                `${filteredQuarterPath}.lineups.${startingPlayers.length + index}.user_name`,
                                                                user.name
                                                            );
                                                            setValue(
                                                                `${filteredQuarterPath}.lineups.${startingPlayers.length + index}.back_number`,
                                                                user.back_number
                                                            );
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        setValue(
                                                            `${filteredQuarterPath}.lineups.${startingPlayers.length + index}.user_name`,
                                                            ""
                                                        );
                                                        setValue(
                                                            `${filteredQuarterPath}.lineups.${startingPlayers.length + index}.back_number`,
                                                            ""
                                                        );
                                                    }}
                                                    className={`${selectedUserName === "" || isDuplicate ? "error" : ""}`}
                                                >
                                                    <option value={selectedUserName}>
                                                        {selectedUserName || ""}
                                                    </option> 
                                                    {users.map((user) => (
                                                        <option
                                                            key={user.user_idx}
                                                            value={`${user.name} (${user.back_number})`}
                                                        >
                                                            {user.name} ({user.back_number})
                                                        </option>
                                                    ))}
                                                </select>
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