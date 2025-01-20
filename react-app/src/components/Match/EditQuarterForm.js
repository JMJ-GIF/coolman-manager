import React from "react";
import './EditQuarterForm.scss';
import { useFieldArray } from "react-hook-form";
import shoes from "../../assets/icons/shoes.svg";
import plus_svg from "../../assets/icons/plus.svg";
import delete_svg from "../../assets/icons/delete.svg";
import add_square_svg from "../../assets/icons/add_square.svg";
import x_square_svg from "../../assets/icons/x_square.svg";
import football_ball from "../../assets/icons/football_ball.svg";

const EditQuarterForm = ({
    control,
    setValue,
    register,
    watch,
    users,
    onSubmit
}) => {    
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

    return (
        <form onSubmit={onSubmit}>
            {quarterFields.map((quarter, quarterIndex) => {
                const goalsPath = `quarters.${quarterIndex}.goals`;
                const goals = watch(goalsPath) || []; 

                return (
                    <div key={quarter.id} className="quarter-edit-group">
                        <div className="quarter-edit-header">
                            <h4>쿼터 {quarter.quarter_number}</h4>
                            <button
                                type="button"
                                className="delete-button"
                                onClick={() => removeQuarter(quarterIndex)}
                            >
                                <img src={delete_svg} alt="Delete" />
                            </button>
                        </div>
                        <div className="goal-list">
                            {goals.map((goal, goalIndex) => {
                                const goalType = watch(`${goalsPath}.${goalIndex}.goal_type`);

                                return (
                                    <div key={goalIndex} className="goal-item">
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
                                            {...register(`${goalsPath}.${goalIndex}.goal_player_name`)}
                                            disabled={goalType === "실점"}
                                        />
                                        <datalist id={`goal-players-${quarterIndex}-${goalIndex}`}>
                                            {users.map((user) => (
                                                <option key={user.user_idx} value={user.name} />
                                            ))}
                                        </datalist>

                                        <img src={shoes} alt="assist" />
                                        <input
                                            type="text"
                                            list={`assist-players-${quarterIndex}-${goalIndex}`}
                                            placeholder="어시"
                                            {...register(`${goalsPath}.${goalIndex}.assist_player_name`)}
                                            disabled={goalType === "실점"}
                                        />
                                        <datalist id={`assist-players-${quarterIndex}-${goalIndex}`}>
                                            {users.map((user) => (
                                                <option key={user.user_idx} value={user.name} />
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
                onClick={() => appendQuarter({ quarter_number: quarterFields.length + 1, goals: [] })}
            >
                <img src={plus_svg} alt="Add Quarter" />
            </button>
        </form>
    );
};

export default EditQuarterForm;
