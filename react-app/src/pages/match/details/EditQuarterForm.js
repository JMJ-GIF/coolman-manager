import './Details.scss';
import React, { useMemo } from "react";
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
    onSubmit,
    matchNature,
}) => {
    const { match_id } = useParams();
    const isNaeJeon = matchNature === '내전';

    const { fields: quarterFields, append: appendQuarter, remove: removeQuarter } = useFieldArray({
        control,
        name: "quarters",
    });

    const sortedUsers = useMemo(
        () => [...users].sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko")),
        [users]
    );

    const goalTypeOptions = [
        { value: "득점", label: "득점" },
        { value: "실점", label: "실점" },
        { value: "자살골", label: "자살골" },
    ];

    const scoringTeamOptions = [
        { value: "A", label: "A팀" },
        { value: "B", label: "B팀" },
    ];

    const addGoal = (quarterIndex) => {
        const goalsPath = `quarters.${quarterIndex}.goals`;
        const goals = watch(goalsPath) || [];
        const newGoal = isNaeJeon
            ? { goal_player_id: null, assist_player_id: null, goal_type: "득점", scoring_team: "A" }
            : { goal_player_id: null, assist_player_id: null, goal_type: "득점" };
        setValue(goalsPath, [...goals, newGoal]);
    };

    const removeGoal = (quarterIndex, goalIndex) => {
        const goalsPath = `quarters.${quarterIndex}.goals`;
        const goals = watch(goalsPath) || [];
        setValue(goalsPath, goals.filter((_, index) => index !== goalIndex));
    };

    const addQuarter = () => {
        const quarters = watch("quarters") || [];
        const tactics = quarters.length > 0 ? quarters[0].tactics : "4-3-3";
        const maxQuarterNumber = quarterFields.length > 0
            ? Math.max(...quarterFields.map(q => q.quarter_number))
            : 0;
        const quarter_number = maxQuarterNumber + 1;

        const filteredPositions = positions
            .filter((p) => p.tactics === tactics)
            .sort((a, b) => a.order - b.order);

        const buildLineup = (team) => filteredPositions.map((position) => ({
            user_name: "", back_number: "", lineup_status: "선발",
            lineup_team: team,
            position_name: position.name,
            top_coordinate: position.top_coordinate,
            left_coordinate: position.left_coordinate,
            quarter_number,
        }));

        const defaultLineups = isNaeJeon
            ? [...buildLineup('A'), ...buildLineup('B')]
            : buildLineup(null);

        appendQuarter({
            match_idx: match_id,
            quarter_number,
            goals: [],
            tactics,
            team_b_tactics: isNaeJeon ? tactics : null,
            lineups: defaultLineups,
        });
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
                                const goalType    = watch(`${goalsPath}.${goalIndex}.goal_type`);
                                const scoringTeam = watch(`${goalsPath}.${goalIndex}.scoring_team`);
                                const goalPlayerName = watch(`${goalsPath}.${goalIndex}.goal_player_name`, "");
                                const isGoalPlayerInvalid = (goalType === "득점" || goalType === "자살골") && !goalPlayerName;
                                const isGoalTypeInvalid   = !isNaeJeon && !goalType;

                                return (
                                    <div key={goalIndex} className="goal-item">

                                        {/* 내전: 팀 선택 / 일반: 골 타입 */}
                                        {isNaeJeon ? (
                                            <div className="react-select-container">
                                                <Select
                                                    options={scoringTeamOptions}
                                                    value={scoringTeamOptions.find(o => o.value === scoringTeam) || null}
                                                    onChange={(opt) => setValue(`${goalsPath}.${goalIndex}.scoring_team`, opt?.value)}
                                                    placeholder="팀"
                                                    classNamePrefix="custom-select"
                                                    isClearable={false}
                                                    isSearchable={false}
                                                    components={{ DropdownIndicator: null }}
                                                    menuPortalTarget={document.body}
                                                    styles={{
                                                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                        singleValue: (base) => ({
                                                            ...base,
                                                            color: scoringTeam === 'A' ? "#007bff" : "#ff4d4f",
                                                            fontWeight: "bold",
                                                        }),
                                                        option: (base) => ({ ...base, fontSize: "14px", textAlign: "center" }),
                                                        menu:   (base) => ({ ...base, fontSize: "14px" }),
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="react-select-container">
                                                <Select
                                                    options={goalTypeOptions}
                                                    value={goalTypeOptions.find(o => o.value === goalType) || null}
                                                    onChange={(opt) => {
                                                        const path = `${goalsPath}.${goalIndex}`;
                                                        setValue(`${path}.goal_type`, opt?.value);
                                                        if (opt?.value === "실점") {
                                                            setValue(`${path}.goal_player_name`, "");
                                                            setValue(`${path}.goal_player_back_number`, "");
                                                            setValue(`${path}.goal_player_id`, null);
                                                            setValue(`${path}.assist_player_name`, "");
                                                            setValue(`${path}.assist_player_back_number`, "");
                                                            setValue(`${path}.assist_player_id`, null);
                                                        }
                                                        if (opt?.value === "자살골") {
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
                                                            color: goalType === "득점" ? "#007bff"
                                                                : (goalType === "실점" || goalType === "자살골") ? "#ff4d4f"
                                                                : base.color,
                                                            fontWeight: "bold",
                                                        }),
                                                        option: (base) => ({ ...base, fontSize: "14px", textAlign: "center" }),
                                                        menu:   (base) => ({ ...base, fontSize: "14px" }),
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* 골 선수 */}
                                        <img src={football_ball} alt="goal" />
                                        <Select
                                            className={`react-select-container ${isGoalPlayerInvalid ? "error" : ""}`}
                                            classNamePrefix="custom-select"
                                            placeholder={(!isNaeJeon && goalType === "실점") ? "" : "골"}
                                            isClearable={false}
                                            isSearchable={false}
                                            components={{ DropdownIndicator: null }}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    backgroundColor: (!isNaeJeon && goalType === "실점") ? "#fff" : "gray",
                                                    opacity: (!isNaeJeon && goalType === "실점") ? 0.9 : 1,
                                                }),
                                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                option: (base) => ({ ...base, fontSize: "12px", textAlign: "center" }),
                                                menu:   (base) => ({ ...base, fontSize: "12px" }),
                                            }}
                                            value={sortedUsers
                                                .map((u) => ({ label: `${u.name} (${u.back_number})`, value: u.user_idx, name: u.name, back_number: u.back_number }))
                                                .find((opt) => opt.value === watch(`${goalsPath}.${goalIndex}.goal_player_id`)) || null}
                                            options={sortedUsers.map((u) => ({
                                                label: `${u.name} (${u.back_number})`, value: u.user_idx, name: u.name, back_number: u.back_number,
                                            }))}
                                            formatOptionLabel={(data, { context }) =>
                                                context === "menu" ? `${data.name} (${data.back_number})` : data.name
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
                                            isDisabled={!isNaeJeon && goalType === "실점"}
                                        />

                                        {/* 어시스트 선수 */}
                                        <img src={shoes} alt="assist" />
                                        <Select
                                            className="react-select-container"
                                            classNamePrefix="custom-select"
                                            placeholder={(!isNaeJeon && (goalType === "실점" || goalType === "자살골")) ? "" : "어시"}
                                            isClearable={false}
                                            isSearchable={false}
                                            components={{ DropdownIndicator: null }}
                                            menuPortalTarget={document.body}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    backgroundColor: (!isNaeJeon && (goalType === "실점" || goalType === "자살골")) ? "#fff" : "gray",
                                                    opacity: (!isNaeJeon && (goalType === "실점" || goalType === "자살골")) ? 0.9 : 1,
                                                }),
                                                menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                                option: (base) => ({ ...base, fontSize: "12px", textAlign: "center" }),
                                                menu:   (base) => ({ ...base, fontSize: "12px" }),
                                            }}
                                            value={sortedUsers
                                                .map((u) => ({ label: `${u.name} (${u.back_number})`, value: u.user_idx, name: u.name, back_number: u.back_number }))
                                                .find((opt) => opt.value === watch(`${goalsPath}.${goalIndex}.assist_player_id`)) || null}
                                            options={sortedUsers.map((u) => ({
                                                label: `${u.name} (${u.back_number})`, value: u.user_idx, name: u.name, back_number: u.back_number,
                                            }))}
                                            formatOptionLabel={(data, { context }) =>
                                                context === "menu" ? `${data.name} (${data.back_number})` : data.name
                                            }
                                            onChange={(selected) => {
                                                if (!selected) {
                                                    setValue(`${goalsPath}.${goalIndex}.assist_player_name`, "");
                                                    setValue(`${goalsPath}.${goalIndex}.assist_player_back_number`, "");
                                                    setValue(`${goalsPath}.${goalIndex}.assist_player_id`, null);
                                                    return;
                                                }
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_name`, selected.name);
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_back_number`, selected.back_number);
                                                setValue(`${goalsPath}.${goalIndex}.assist_player_id`, selected.value);
                                            }}
                                            isDisabled={!isNaeJeon && (goalType === "실점" || goalType === "자살골")}
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
