import './Details.scss';
import React from "react";

const EditResultForm = ({
    register,
    errors,
    watch,
    positions,    
    onSubmit, 
}) => {
    const winningPoint = watch("winning_point");
    const losingPoint = watch("losing_point");
    const uniqueTactics = Array.from(
        new Set(positions.map((item) => item.tactics))
    );

    // fetchLocation 함수 내부 구현
    const fetchLocation = () => {
        // 지도 API 호출 로직 (예시)
        alert("지도 API 호출");
    };

    return (
        <form onSubmit={onSubmit}>
            <div className="match-results">
                <div className="header-card">
                    <h2>경기결과</h2>
                    <p data-result={winningPoint > losingPoint ? "승리" : winningPoint < losingPoint ? "패배" : "무승부"}>
                        {winningPoint > losingPoint
                            ? "승리"
                            : winningPoint < losingPoint
                            ? "패배"
                            : "무승부"}
                    </p>
                </div>
                <div className="card-container edit">
                    {/* 스코어 카드 */}
                    <div className="card">
                        <span>스코어</span>
                        <div className="score-input-container">
                            <input
                                type="number"
                                {...register("winning_point", {
                                    required: "승리 점수를 입력하세요",
                                    validate: (value) => value >= 0 || "0 이상의 값을 입력하세요",
                                })}
                                placeholder="승리 점수"
                                className={`score-input ${errors.winning_point ? "error" : ""}`}
                            />                            
                            <span className="colon">:</span>
                            <input
                                type="number"
                                {...register("losing_point", {
                                    required: "패배 점수를 입력하세요",
                                    validate: (value) => value >= 0 || "0 이상의 값을 입력하세요",
                                })}
                                placeholder="패배 점수"
                                className={`score-input ${errors.losing_point ? "error" : ""}`}
                            />
                        </div>
                        {errors.winning_point && <p className="result-error-message">{errors.winning_point.message}</p>}
                        {errors.losing_point && <p className="result-error-message">{errors.losing_point.message}</p>}
                    </div>

                    {/* 경기 상대 */}
                    <div className="card">
                        <span>상대</span>
                        <input
                            type="text"
                            {...register("opposing_team", { required: "경기 상대를 입력하세요" })}
                            placeholder="경기 상대"
                            className={`text-input ${errors.opposing_team ? "error" : ""}`}
                        />
                        {errors.opposing_team && <p className="result-error-message">{errors.opposing_team.message}</p>}
                    </div>

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
                        <select {...register("weather")}>
                            <option value="맑음">맑음</option>
                            <option value="흐림">흐림</option>
                            <option value="눈">눈</option>
                            <option value="비">비</option>
                            <option value="안개">안개</option>
                            <option value="바람">바람</option>
                        </select>
                    </div>

                    {/* 경기 장소 */}
                    <div className="card">
                        <span>장소</span>
                        <input
                            type="text"
                            {...register("location", { required: "장소를 입력하세요" })}
                            placeholder="경기장소"
                            className={`text-input ${errors.location ? "error" : ""}`}
                            onClick={fetchLocation} 
                        />
                        {errors.location && <p className="result-error-message">{errors.location.message}</p>}
                    </div>

                    {/* 경기 인원 */}
                    <div className="card">
                        <span>참가인원 (용병제외)</span>
                        <input
                            type="text"
                            {...register("num_players", { required: "인원을 입력하세요" })}
                            placeholder="참가인원"
                            className={`text-input ${errors.num_players ? "error" : ""}`}
                        />
                        {errors.num_players && <p className="result-error-message">{errors.num_players.message}</p>}
                    </div>

                    {/* 메인 전술 */}
                    <div className="card">
                        <span>메인전술</span>
                        <select {...register("main_tactics")}>
                            {uniqueTactics.map((tactic, index) => (
                                <option key={index} value={tactic}>
                                    {tactic}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>                
            </div>
        </form>
    );
};

export default EditResultForm;
