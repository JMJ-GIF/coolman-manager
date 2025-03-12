import './Details.scss';
import React, { useState } from "react";

const EditResultForm = ({
    setValue,
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
    
    const weatherOptions = ["맑음", "흐림", "눈", "비", "안개", "바람"];

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
                            {...register("opposing_team", { 
                                required: "경기 상대를 입력하세요", 
                                maxLength: { value: 20, message: "최대 20자까지 입력 가능합니다." } 
                            })}
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
                        <input
                            type="text"
                            list="weather-options"
                            placeholder="날씨 선택"
                            {...register("weather", {
                                required: "날씨를 선택하세요",
                                validate: (value) => weatherOptions.includes(value) || "올바른 날씨를 선택하세요",
                            })}
                            onFocus={() => setValue("weather", "")}
                            className={`text-input ${errors.weather ? "error" : ""}`}
                        />
                        <datalist id="weather-options">
                            {weatherOptions.map((weather, index) => (
                                <option key={index} value={weather} />
                            ))}
                        </datalist>
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
                        <input
                            type="text"
                            list="tactics-options"
                            placeholder="전술 선택"
                            {...register("main_tactics", {
                                required: "전술을 선택하세요",
                                validate: (value) => uniqueTactics.includes(value) || "올바른 전술을 선택하세요",
                            })}
                            onFocus={() => setValue("main_tactics", "")}
                            className={`text-input ${errors.main_tactics ? "error" : ""}`}
                        />
                        <datalist id="tactics-options">
                            {uniqueTactics.map((tactic, index) => (
                                <option key={index} value={tactic} />
                            ))}
                        </datalist>
                        {errors.main_tactics && <p className="result-error-message">{errors.main_tactics.message}</p>}
                    </div>
                </div>                
            </div>
        </form>
    );
};

export default EditResultForm;
