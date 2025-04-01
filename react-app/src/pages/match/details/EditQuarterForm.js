import './Details.scss';
import React from "react";
import Select from "react-select";
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
    
    const goalTypeOptions = [
        { value: "득점", label: "득점" },
        { value: "실점", label: "실점" },
        { value: "자살골", label: "자살골" },
      ];
      

    const addGoal = (quarterIndex) => {
        const goalsPath = `quarters.${quarterIndex}.goals`;
        const goals = watch(goalsPath) || []; 
        const newGoal = {
            goal_player_id: null,
            assist_player_id: null,
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
                                const isGoalTypeInvalid = !goalType;
                                    

                                return (
                                    <div key={goalIndex} className='goal-item'>
                                        <div className="react-select-container">
                                            <Select
                                                options={goalTypeOptions}
                                                value={
                                                goalTypeOptions.find(
                                                    (opt) => opt.value === watch(`${goalsPath}.${goalIndex}.goal_type`)
                                                ) || null
                                                }
                                                onChange={(selectedOption) => {
                                                    const path = `${goalsPath}.${goalIndex}`;
                                                    setValue(`${path}.goal_type`, selectedOption?.value);
                                                                                                
                                                    if (selectedOption?.value === "실점") {
                                                        setValue(`${path}.goal_player_name`, "");
                                                        setValue(`${path}.goal_player_back_number`, "");
                                                        setValue(`${path}.goal_player_id`, null);
                                                        setValue(`${path}.assist_player_name`, "");
                                                        setValue(`${path}.assist_player_back_number`, "");
                                                        setValue(`${path}.assist_player_id`, null);
                                                    }

                                                    if (selectedOption?.value === "자살골") {                                                        
                                                        setValue(`${path}.assist_player_name`, "");
                                                        setValue(`${path}.assist_player_back_number`, "");
                                                        setValue(`${path}.assist_player_id`, null);
                                                    }
                                                }}
                                                placeholder="선택"
                                                classNamePrefix="custom-select"
                                                className={isGoalTypeInvalid ? "error" : ""}
                                                isClearable={false}
                                                isSearchable={false}
                                                components={{ DropdownIndicator: null }}
                                                menuPortalTarget={document.body}
                                                styles={{
                                                    menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                    singleValue: (base) => ({
                                                        ...base,
                                                        color:
                                                            goalType === "득점"
                                                                ? "#007bff"
                                                                : goalType === "실점" || goalType === "자살골"
                                                                ? "#ff4d4f"
                                                                : base.color,
                                                        fontWeight: "bold",
                                                    }),
                                                    option: (base) => ({
                                                        ...base,
                                                        fontSize: "14px",
                                                        textAlign: "center",
                                                    }),
                                                    menu: (base) => ({
                                                        ...base,
                                                        fontSize: "14px",
                                                    }),
                                                }}
                                            />
                                        </div>
                                        <img src={football_ball} alt="goal" />
                                        <Select
                                            className={`react-select-container ${isGoalPlayerInvalid ? "error" : ""}`}
                                            classNamePrefix="custom-select"
                                            placeholder={goalType === "실점" ? "" : "골"}
                                            isClearable={false}
                                            isSearchable={false}                                            
                                            components={{
                                                DropdownIndicator: null,
                                            }}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    backgroundColor: goalType === "실점" ? "#fff" : "gray",
                                                    opacity: goalType === "실점" ? 0.9 : 1,
                                                    
                                                }),
                                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                option: (base) => ({
                                                  ...base,
                                                  fontSize: "12px",  
                                                  textAlign: "center",
                                                }),
                                                menu: (base) => ({
                                                  ...base,
                                                  fontSize: "12px",  
                                                }),
                                              }}
                                            value={users
                                                .map((u) => ({
                                                label: `${u.name} (${u.back_number})`,
                                                value: u.user_idx,
                                                name: u.name,
                                                back_number: u.back_number,
                                                }))
                                                .find((opt) => opt.value === watch(`${goalsPath}.${goalIndex}.goal_player_id`)) || null}
                                            options={users.map((u) => ({
                                                label: `${u.name} (${u.back_number})`,
                                                value: u.user_idx,
                                                name: u.name,
                                                back_number: u.back_number,
                                            }))}
                                            formatOptionLabel={(data, { context }) =>
                                                context === "menu"
                                                ? `${data.name} (${data.back_number})` // 드롭다운에 보일 값
                                                : data.name // 선택됐을 때 보일 값
                                            }
                                            onChange={(selected) => {
                                                if (!selected) {
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_name`, "");
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_back_number`, "");
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_id`, null);
                                                return;
                                                }

                                                setValue(`${goalsPath}.${goalIndex}.goal_player_name`, selected.name);
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_back_number`, selected.back_number);
                                                setValue(`${goalsPath}.${goalIndex}.goal_player_id`, selected.value);
                                            }}
                                            isDisabled={goalType === "실점"}
                                        />


                                        <img src={shoes} alt="assist" />
                                        <Select
                                            className={`react-select-container`}
                                            classNamePrefix="custom-select"
                                            placeholder={goalType === "실점" || goalType === "자살골" ? "" : "어시"}
                                            isClearable={false}
                                            isSearchable={false}
                                            components={{ DropdownIndicator: null }}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    backgroundColor: goalType === "실점" || goalType === "자살골" ? "#fff" : "gray",
                                                    opacity: goalType === "실점" || goalType === "자살골" ? 0.9 : 1,
                                                }),
                                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                option: (base) => ({
                                                  ...base,
                                                  fontSize: "12px",  
                                                  textAlign: "center",
                                                }),
                                                menu: (base) => ({
                                                  ...base,
                                                  fontSize: "12px",  
                                                }),
                                              }}
                                            value={
                                                users
                                                .map((u) => ({
                                                    label: `${u.name} (${u.back_number})`,
                                                    value: u.user_idx,
                                                    name: u.name,
                                                    back_number: u.back_number,
                                                }))
                                                .find(
                                                    (opt) =>
                                                    opt.value === watch(`${goalsPath}.${goalIndex}.assist_player_id`)
                                                ) || null
                                            }
                                            options={users.map((u) => ({
                                                label: `${u.name} (${u.back_number})`,
                                                value: u.user_idx,
                                                name: u.name,
                                                back_number: u.back_number,
                                            }))}
                                            formatOptionLabel={(data, { context }) =>
                                                context === "menu"
                                                ? `${data.name} (${data.back_number})` // 드롭다운에 보이는 값
                                                : data.name // 선택 후 보이는 값
                                            }
                                            onChange={(selected) => {
                                                if (!selected) {
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_name`, "");
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_back_number`, "");
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_id`, null);
                                                return;
                                                }

                                                setValue(`${goalsPath}.${goalIndex}.assist_player_name`, selected.name);
                                                setValue(
                                                `${goalsPath}.${goalIndex}.assist_player_back_number`,
                                                selected.back_number
                                                );
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_id`, selected.value);
                                            }}
                                            isDisabled={goalType === "실점" || goalType === "자살골"}
                                        />


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
