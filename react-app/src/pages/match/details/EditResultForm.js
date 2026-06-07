import './Details.scss';
import React from "react";
import Select from "react-select";
import { Controller } from "react-hook-form";

const NINE_V_NINE_TACTICS   = ['3-3-2', '3-2-3', '2-3-3'];
const TEN_V_TEN_TACTICS     = ['4-3-2', '3-4-2', '3-3-3'];
const SMALL_TACTICS         = [...NINE_V_NINE_TACTICS, ...TEN_V_TEN_TACTICS];

const getFilteredTactics = (playerCount, allTactics) => {
    if (playerCount === '9v9')   return allTactics.filter(t => NINE_V_NINE_TACTICS.includes(t));
    if (playerCount === '10v10') return allTactics.filter(t => TEN_V_TEN_TACTICS.includes(t));
    return allTactics.filter(t => !SMALL_TACTICS.includes(t));
};

const EditResultForm = ({
    setValue,
    register,
    errors,
    watch,
    onSubmit,
    control,
    positions,
    onPlayerCountChange,
    onMatchNatureChange,
}) => {
    const allTactics = Array.from(new Set(positions.map((item) => item.tactics)));
    const playerCount = watch("player_count") || "11v11";
    const matchNature = watch("match_nature") || "경기";

    const filteredTacticOptions = getFilteredTactics(playerCount, allTactics).map(t => ({
        value: t, label: t,
    }));

    const weatherOptions = [
        { value: "맑음", label: "맑음" },
        { value: "흐림", label: "흐림" },
        { value: "눈",   label: "눈" },
        { value: "비",   label: "비" },
        { value: "안개", label: "안개" },
        { value: "바람", label: "바람" },
    ];

    const playerCountOptions = [
        { value: "11v11", label: "11 vs 11" },
        { value: "10v10", label: "10 vs 10" },
        { value: "9v9",   label: "9 vs 9" },
    ];

    const matchNatureOptions = [
        { value: "경기",  label: "경기" },
        { value: "내전",  label: "내전" },
    ];

    const handlePlayerCountChange = (value) => {
        setValue("player_count", value);
        // 전술을 해당 인원수의 기본값으로 리셋
        const defaults = { '9v9': '3-3-2', '10v10': '4-3-2', '11v11': '4-3-3' };
        setValue("main_tactics", defaults[value] || '4-3-3');
        if (onPlayerCountChange) onPlayerCountChange(value);
    };

    const handleMatchNatureChange = (value) => {
        setValue("match_nature", value);
        if (onMatchNatureChange) onMatchNatureChange(value);
    };

    return (
        <form onSubmit={onSubmit}>
            <div className="match-results">
                <div className="header-card">
                    <h2>경기결과</h2>
                </div>
                <div className="card-container edit">

                    {/* 인원수 */}
                    <div className="card">
                        <span>인원수</span>
                        <div className="toggle-group">
                            {playerCountOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`toggle-btn ${playerCount === opt.value ? 'active' : ''}`}
                                    onClick={() => handlePlayerCountChange(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 경기 성격 */}
                    <div className="card">
                        <span>경기성격</span>
                        <div className="toggle-group">
                            {matchNatureOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    className={`toggle-btn ${matchNature === opt.value ? 'active' : ''}`}
                                    onClick={() => handleMatchNatureChange(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 내전: 팀 이름 */}
                    {matchNature === '내전' ? (
                        <>
                            <div className="card">
                                <span>A팀 이름</span>
                                <input
                                    type="text"
                                    {...register("team_a_name", {
                                        required: "A팀 이름을 입력하세요",
                                        maxLength: { value: 20, message: "최대 20자" }
                                    })}
                                    placeholder="A팀 이름"
                                    className={`text-input ${errors.team_a_name ? "error" : ""}`}
                                />
                                {errors.team_a_name && <p className="result-error-message">{errors.team_a_name.message}</p>}
                            </div>
                            <div className="card">
                                <span>B팀 이름</span>
                                <input
                                    type="text"
                                    {...register("team_b_name", {
                                        required: "B팀 이름을 입력하세요",
                                        maxLength: { value: 20, message: "최대 20자" }
                                    })}
                                    placeholder="B팀 이름"
                                    className={`text-input ${errors.team_b_name ? "error" : ""}`}
                                />
                                {errors.team_b_name && <p className="result-error-message">{errors.team_b_name.message}</p>}
                            </div>
                        </>
                    ) : (
                        /* 일반 경기: 상대팀 */
                        <div className="card">
                            <span>상대</span>
                            <input
                                type="text"
                                {...register("opposing_team", {
                                    required: "경기 상대를 입력하세요",
                                    maxLength: { value: 20, message: "최대 20자까지 입력 가능합니다." }
                                })}
                                placeholder="경기 상대"
                                className={`text-input ${errors.opposing_team ? "error" : ""}`}
                            />
                            {errors.opposing_team && <p className="result-error-message">{errors.opposing_team.message}</p>}
                        </div>
                    )}

                    {/* 경기 날짜 */}
                    <div className="card">
                        <span>날짜</span>
                        <div className="time-input-container">
                            <input
                                type="date"
                                {...register("dt", { required: "날짜를 입력하세요" })}
                                placeholder="날짜"
                                className={`time-input ${errors.dt ? "error" : ""}`}
                            />
                        </div>
                        {errors.dt && <p className="result-error-message">{errors.dt.message}</p>}
                    </div>

                    {/* 경기 시간 */}
                    <div className="card">
                        <span>시간</span>
                        <div className="time-input-container">
                            <input
                                type="time"
                                {...register("start_time", { required: "시간을 입력하세요" })}
                                placeholder="시작 시간"
                                className={`time-input ${errors.start_time ? "error" : ""}`}
                            />
                            <span className="tilde">~</span>
                            <input
                                type="time"
                                {...register("end_time", { required: "시간을 입력하세요" })}
                                placeholder="종료 시간"
                                className={`time-input ${errors.end_time ? "error" : ""}`}
                            />
                        </div>
                        {errors.start_time && <p className="result-error-message">{errors.start_time.message}</p>}
                        {errors.end_time && <p className="result-error-message">{errors.end_time.message}</p>}
                    </div>

                    {/* 경기 날씨 */}
                    <div className="card">
                        <span>날씨</span>
                        <Controller
                            name="weather"
                            control={control}
                            rules={{
                                required: "날씨를 선택하세요",
                                validate: (value) =>
                                    weatherOptions.map((opt) => opt.value).includes(value) ||
                                    "올바른 날씨를 선택하세요",
                            }}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={weatherOptions}
                                    onChange={(selectedOption) => field.onChange(selectedOption?.value)}
                                    value={weatherOptions.find((opt) => opt.value === field.value) || null}
                                    placeholder="날씨 선택"
                                    className={`react-select-container ${errors.weather ? "error" : ""}`}
                                    classNamePrefix="custom-select"
                                    isClearable={false}
                                    isSearchable={false}
                                    components={{ DropdownIndicator: null }}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                        option: (base) => ({ ...base, fontSize: "16px", textAlign: "center" }),
                                        menu: (base) => ({ ...base, fontSize: "16px" }),
                                    }}
                                />
                            )}
                        />
                        {errors.weather && <p className="result-error-message">{errors.weather.message}</p>}
                    </div>

                    {/* 경기 장소 */}
                    <div className="card">
                        <span>장소</span>
                        <input
                            type="text"
                            {...register("location", {
                                required: "장소를 입력하세요",
                                maxLength: { value: 20, message: "최대 20자까지 입력 가능합니다." }
                            })}
                            placeholder="경기장소"
                            className={`text-input ${errors.location ? "error" : ""}`}
                        />
                        {errors.location && <p className="result-error-message">{errors.location.message}</p>}
                    </div>

                    {/* 기록 포함 여부 (9v9, 10v10만 표시) */}
                    {(playerCount === '9v9' || playerCount === '10v10') && (
                        <div className="card">
                            <span>기록포함</span>
                            <div className="toggle-group">
                                {[{ value: true, label: '포함' }, { value: false, label: '제외' }].map(opt => (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        className={`toggle-btn ${watch("include_in_records") === opt.value ? 'active' : ''}`}
                                        onClick={() => setValue("include_in_records", opt.value)}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 메인 전술 */}
                    <div className="card">
                        <span>메인전술</span>
                        <Controller
                            name="main_tactics"
                            control={control}
                            rules={{
                                required: "전술을 선택하세요",
                                validate: (value) =>
                                    filteredTacticOptions.map((opt) => opt.value).includes(value) || "올바른 전술을 선택하세요",
                            }}
                            render={({ field }) => (
                                <Select
                                    {...field}
                                    options={filteredTacticOptions}
                                    onChange={(selectedOption) => field.onChange(selectedOption?.value)}
                                    value={filteredTacticOptions.find((opt) => opt.value === field.value) || null}
                                    placeholder="전술 선택"
                                    className={`react-select-container ${errors.main_tactics ? "error" : ""}`}
                                    classNamePrefix="custom-select"
                                    isClearable={false}
                                    isSearchable={false}
                                    components={{ DropdownIndicator: null }}
                                    menuPortalTarget={document.body}
                                    styles={{
                                        menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                                        option: (base) => ({ ...base, fontSize: "16px", textAlign: "center" }),
                                        menu: (base) => ({ ...base, fontSize: "16px" }),
                                    }}
                                />
                            )}
                        />
                        {errors.main_tactics && <p className="result-error-message">{errors.main_tactics.message}</p>}
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EditResultForm;
