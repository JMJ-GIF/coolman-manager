import './Details.scss';
import React from "react";
import { useParams } from "react-router-dom";
import { useFieldArray } from "react-hook-form";
import shoes from "../../../assets/icons/shoes.svg";
import plus_svg from "../../../assets/icons/plus.svg";
import delete_svg from "../../../assets/icons/delete.svg";
import x_square_svg from "../../../assets/icons/x_square.svg";
import add_square_svg from "../../../assets/icons/add_square.svg";
import football_ball from "../../../assets/icons/football_ball.svg";

const EditQuarterForm = ({
    control,
    setValue,
    register,
    watch,
    users,
    positions,
    onSubmit
}) => {    
    const { match_id } = useParams();
    const { fields: quarterFields, append: appendQuarter, remove: removeQuarter } = useFieldArray({
        control,
        name: "quarters",
    });    

    const addGoal = (quarterIndex) => {
        const goalsPath = `quarters.${quarterIndex}.goals`;
        const goals = watch(goalsPath) || []; 
        const newGoal = {
            goal_player_id: "",
            assist_player_id: "",
            goal_type: "득점",
        };
        
        setValue(goalsPath, [...goals, newGoal]);
    };

    const removeGoal = (quarterIndex, goalIndex) => {
        const goalsPath = `quarters.${quarterIndex}.goals`;
        const goals = watch(goalsPath) || [];
        const updatedGoals = goals.filter((_, index) => index !== goalIndex);
        
        setValue(goalsPath, updatedGoals);
    };

    const addQuarter = () => {
        const tactics = "4-3-3";
        const maxQuarterNumber = quarterFields.length > 0
            ? Math.max(...quarterFields.map(q => q.quarter_number))
            : 0;
        const quarter_number = maxQuarterNumber + 1;
        
        const filteredPositions = positions
            .filter((position) => position.tactics === tactics)
            .sort((a, b) => a.order - b.order); 

        const defaultLineups = filteredPositions.map((position) => ({
            user_name: "",
            back_number: "",
            lineup_status: "선발",
            position_name: position.name, 
            top_coordinate: position.top_coordinate,
            left_coordinate: position.left_coordinate, 
            quarter_number: quarter_number
        }));

        const newQuarter = {    
            match_idx: match_id,
            quarter_number: quarter_number,
            goals: [],
            tactics: tactics, 
            lineups: defaultLineups, 
        };
    
        appendQuarter(newQuarter);
    };

    return (
        <form onSubmit={onSubmit}>
            {quarterFields.map((quarter, quarterIndex) => {
                const goalsPath = `quarters.${quarterIndex}.goals`;
                const goals = watch(goalsPath) || []; 

                return (
                    <div key={quarter.id} className="quarter-group">
                        <div className="quarter-header">
                            <h4>쿼터 {quarter.quarter_number}</h4>
                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => removeQuarter(quarterIndex)}
                            >
                                <img src={delete_svg} alt="Delete" />
                            </button>
                        </div>
                        <div className="goal-list edit">
                            {goals.map((goal, goalIndex) => {
                                const goalType = watch(`${goalsPath}.${goalIndex}.goal_type`);
                                const goalPlayerName = watch(`${goalsPath}.${goalIndex}.goal_player_name`, "");                                
                                const isGoalPlayerInvalid =
                                    (goalType === "득점" || goalType === "자살골") && !goalPlayerName;


                                return (
                                    <div key={goalIndex} className='goal-item'>
                                        <select
                                            {...register(`${goalsPath}.${goalIndex}.goal_type`)}
                                        >
                                            <option value="득점">득점</option>
                                            <option value="실점">실점</option>
                                            <option value="자살골">자살골</option>
                                        </select>

                                        <img src={football_ball} alt="goal" />
                                        <input
                                            type="text"
                                            list={`goal-players-${quarterIndex}-${goalIndex}`}
                                            placeholder="골"
                                            value={watch(`${goalsPath}.${goalIndex}.goal_player_name`, "")}
                                            disabled={goalType === "실점"}
                                            onFocus={(e) => {                                                
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_name`, "");
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_back_number`, "");
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_id`, "");
                                            }}                                            
                                            onInput={(e) => {
                                                const selectedValue = e.target.value;
                                                const match = selectedValue.match(/^(.*) \((\d+)\)$/);
                                                if (match) {
                                                    const [_, name, backNumber] = match;                                                    
                                                    const user = users.find(
                                                        (u) => u.name === name && u.back_number.toString() === backNumber
                                                    );
                                        
                                                    if (user) {                                                        
                                                        setValue(`${goalsPath}.${goalIndex}.goal_player_name`, user.name);
                                                        setValue(`${goalsPath}.${goalIndex}.goal_player_back_number`, user.back_number);
                                                        setValue(`${goalsPath}.${goalIndex}.goal_player_id`, user.user_idx);
                                                    }
                                                }
                                            }}
                                            className={isGoalPlayerInvalid ? "error" : ""}
                                        />
                                        <datalist id={`goal-players-${quarterIndex}-${goalIndex}`}>
                                            {users.map((user) => (
                                                <option 
                                                key={user.user_idx} 
                                                value={`${user.name} (${user.back_number})`} 
                                            />
                                            ))}
                                        </datalist>

                                        <img src={shoes} alt="assist" />
                                        <input
                                            type="text"
                                            list={`assist-players-${quarterIndex}-${goalIndex}`}
                                            placeholder="어시"
                                            value={watch(`${goalsPath}.${goalIndex}.assist_player_name`, "")}
                                            disabled={goalType === "실점"}
                                            onFocus={(e) => {                                                
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_name`, "");
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_back_number`, "");
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_id`, "");
                                            }}  
                                            onInput={(e) => {
                                                const selectedValue = e.target.value;
                                                const match = selectedValue.match(/^(.*) \((\d+)\)$/);
                                                if (match) {
                                                    const [_, name, backNumber] = match;                                                    
                                                    const user = users.find(
                                                        (u) => u.name === name && u.back_number.toString() === backNumber
                                                    );
                                        
                                                    if (user) {                                                        
                                                        setValue(`${goalsPath}.${goalIndex}.assist_player_name`, user.name);
                                                        setValue(`${goalsPath}.${goalIndex}.assist_player_back_number`, user.back_number);
                                                        setValue(`${goalsPath}.${goalIndex}.assist_player_id`, user.user_idx);
                                                    }
                                                }
                                            }}
                                        />
                                        <datalist id={`assist-players-${quarterIndex}-${goalIndex}`}>
                                            {users.map((user) => (
                                                <option 
                                                key={user.user_idx} 
                                                value={`${user.name} (${user.back_number})`} 
                                            />
                                            ))}
                                        </datalist>

                                        <button
                                            type="button"
                                            className="delete-goal-button"
                                            onClick={() => removeGoal(quarterIndex, goalIndex)}
                                        >
                                            <img src={x_square_svg} alt="delete goal" />
                                        </button>
                                    </div>
                                );
                            })}
                            <button
                                type="button"
                                className="add-goal-button"
                                onClick={() => addGoal(quarterIndex)}
                            >
                                <img src={add_square_svg} alt="Add Goal" />
                            </button>
                        </div>
                    </div>
                );
            })}
            <button
                type="button"
                className="add-quarter-button"
                onClick={() => addQuarter()}
            >
                <img src={plus_svg} alt="Add Quarter" />
            </button>
        </form>
    );
};

export default EditQuarterForm;
