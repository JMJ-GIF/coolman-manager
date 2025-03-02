
import './Details.scss';
import axios from "axios";
import {useForm} from "react-hook-form";
import EditResultForm from "./EditResultForm";
import EditLineupForm from "./EditLineupForm";
import EditQuarterForm from "./EditQuarterForm";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FloatingBar from "../../../components/FloatingBar";
import NavigationBar from "../../../components/NavigationBar";


function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function MatchDetailsEdit() {
    // Config
    const navigate = useNavigate();         
    const { match_id } = useParams();    
    const API_URL = process.env.REACT_APP_API_URL;       
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('goals');

    // API DATA
    const [users, setUsers] = useState([]);;   
    const [positions, setPositions] = useState([]); 
    const [matchDetails, setMatchDetails] = useState(null);        

    // Form Define
    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
        mode: "onChange",       
    });  
    
    // Init Forms
    const initMatchForm = (matchResponse) => {
        Object.entries(matchResponse.data).forEach(([key, value]) => {                
            if (key === 'start_time' || key === 'end_time'){
                setValue(key, formatTime(value))
            } else {
                setValue(key, value);
            }                                
        });  
    };
    const initQuarterForm = (quarterResponse, goalsResponse, lineupResponse) => {
        if (
            quarterResponse.status === "fulfilled"            
        ) {
            const formattedQuarters = quarterResponse.value.data.map((quarter) => ({
                ...quarter,
                ['goals']: (goalsResponse.status === "fulfilled" ? goalsResponse.value.data : []).filter(
                    (item) => item.quarter_idx === quarter.quarter_idx
                ),
                ['lineups']: (lineupResponse.status === "fulfilled" ? lineupResponse.value.data : []).filter(
                    (item) => item.quarter_idx === quarter.quarter_idx
                )
            }));
            setValue("quarters", formattedQuarters);
        }
    };
    
    const fetchAndInitData = async () => {
        setLoading(true);
        try {
            // Match details 요청은 항상 실행하고 성공적인 응답을 설정
            const matchResponse = await axios.get(`${API_URL}/matches/${match_id}`);
            setMatchDetails(matchResponse.data);
            initMatchForm(matchResponse);
                      
            // 나머지 API 콜은 실패할 경우 빈 배열로 처리
            const [quarterResponse, goalsResponse, lineupResponse, positionResponse, userResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/matches/${match_id}/quarters`),
                axios.get(`${API_URL}/matches/${match_id}/goals`),
                axios.get(`${API_URL}/matches/${match_id}/lineups`),
                axios.get(`${API_URL}/positions`),
                axios.get(`${API_URL}/users`)
            ]);
    
            // Goals 및 Lineups 초기화
            initQuarterForm(quarterResponse, goalsResponse, lineupResponse);
    
            if (userResponse.status === "fulfilled") {
                setUsers(userResponse.value.data);
            } else {
                console.warn("Users API failed:", userResponse.reason);
                setUsers([]);
            }

            if (positionResponse.status === "fulfilled") {
                setPositions(positionResponse.value.data);
            } else {
                console.warn("Positions API failed:", positionResponse.reason);
                setPositions([]);
            }
    
        } catch (error) {
            console.error("Error fetching match details:", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAndInitData();        
    }, [match_id, setValue]);

    
    const handleFormSubmit = handleSubmit(async (data) => {
        const { winning_point, losing_point, quarters } = data;
    
        // 1. 쿼터 번호가 연속적인지 확인
        const areQuarterNumbersSequential = () => {
            const quarterNumbers = quarters
                .map((quarter) => quarter.quarter_number)
                .sort((a, b) => a - b);
            return quarterNumbers.every((num, index) => num === index + 1);
        };        
    
        // 2. 스코어와 골 수가 일치하는지 확인
        const areScoresValid = () => {
            const goals = quarters.flatMap((quarter) => quarter.goals || []);
            const totalWinningGoals = goals.filter((goal) => goal.goal_type === "득점").length;
            const totalLosingGoals = goals.filter(
                (goal) => goal.goal_type === "실점" || goal.goal_type === "자살골"
            ).length;
            return (
                parseInt(winning_point, 10) === totalWinningGoals &&
                parseInt(losing_point, 10) === totalLosingGoals
            );
        };        

        // 3. 유저 이름이 유효한지 검증
        const validateGoalUserNames = () => {
            const allGoals = quarters.flatMap((quarter) => quarter.goals || []);            
        
            const invalidGoals = allGoals.filter((goal) => {
                // 실점 여부 확인
                const isConcededGoal = goal.goal_type === "실점";
        
                // 골 플레이어 이름 검증: 실점이 아닌 경우에만 이름이 비어있으면 에러
                const isGoalPlayerValid =
                    isConcededGoal || // 실점인 경우 통과
                    (goal.goal_player_name && // 이름이 비어 있으면 false
                        users.some((user) => user.name === goal.goal_player_name)); // 유저 이름이 목록에 존재하는지 확인
        
                // 어시스트 플레이어 이름 검증: 빈 값이어도 되고, 유효하지 않은 이름이면 에러
                const isAssistPlayerValid =
                    !goal.assist_player_name || // 어시스트 이름이 비어 있으면 통과
                    users.some((user) => user.name === goal.assist_player_name); // 이름이 있으면 목록에 존재해야 함
        
                // 골 플레이어가 유효하지 않거나 어시스트 플레이어가 유효하지 않으면 에러
                return !isGoalPlayerValid || !isAssistPlayerValid;
            });
        
            // 유효하지 않은 골이 있는 경우 false 반환
            return invalidGoals.length === 0;
        };
        

        // 4. 쿼터별 라인업에서 중복 유저 이름 + 등번호 조합 확인
        const validateUniqueLineupPlayers = () => {
            const invalidQuarters = quarters.filter((quarter) => {
                const uniquePlayers = new Set();
        
                // 쿼터 내 모든 라인업 플레이어 가져오기
                const lineupPlayers = (quarter.lineups || []).map((lineup) => ({
                    userName: lineup.user_name,
                    backNumber: lineup.back_number,
                }));
        
                // 쿼터 내에서 중복 플레이어 검증
                return lineupPlayers.some(({ userName, backNumber }) => {
                    // 이름이 유효하지 않은 경우 에러로 처리
                    if (!userName || userName.trim() === "") {
                        return true;
                    }
        
                    // 용병과 등번호가 0인 경우 중복 허용
                    if (userName === "용병" && backNumber === 0) {
                        return false; // 중복 검사 건너뛰기
                    }
        
                    // 중복 값 검증
                    const playerKey = `${userName}-${backNumber}`;
                    if (uniquePlayers.has(playerKey)) {
                        return true; // 중복 발견
                    }
        
                    uniquePlayers.add(playerKey);
                    return false; // 고유값
                });
            });
        
            // 유효하지 않은 쿼터가 있는 경우 false 반환
            return invalidQuarters.length === 0;
        };

        // 5. 참가 인원 확인
        const validateNumPlayers = () => {            
            const allLineups = quarters.flatMap((quarter) => quarter.lineups || []);            
            const uniquePlayers = new Set(
                allLineups
                    .filter(({ user_name, back_number }) => user_name !== "용병" && user_name && back_number) // "용병" 제외
                    .map(({ user_name, back_number }) => `${user_name}-${back_number}`) // 고유 키 생성
            );         
            const lineupNumPlayers = uniquePlayers.size;
            const ResultNumPlayers = parseInt(data.num_players, 10)
            
            return ResultNumPlayers === lineupNumPlayers;
            
        };
        
        if (!areQuarterNumbersSequential()) {
            alert("쿼터 번호는 반드시 1부터 시작하는 연속된 숫자여야 합니다.");
            return;
        }
        if (!validateGoalUserNames()) {
            alert("골 플레이어는 반드시 유효한 이름이어야 하며, 어시스트 플레이어는 빈 값이거나 유효한 이름이어야 합니다.");
            return;
        }
        if (!areScoresValid()) {
            const totalWinningGoals = quarters.flatMap((q) => q.goals || []).filter(
                (goal) => goal.goal_type === "득점"
            ).length;
            const totalLosingGoals = quarters.flatMap((q) => q.goals || []).filter(
                (goal) => goal.goal_type === "실점" || goal.goal_type === "자살골"
            ).length;
            alert(
                `스코어(${winning_point}:${losing_point})와 골 수(${totalWinningGoals}:${totalLosingGoals})가 일치하지 않습니다. 폼을 수정해주세요.`
            );
            return;
        }
        if (!validateUniqueLineupPlayers()) {
            alert("라인업 내에서 중복된 선수가 있거나, 빈 값이 있습니다");
            return;
        }
        if (!validateNumPlayers()) {
            alert("참가 인원 수가 라인업에서 계산된 고유 인원과 일치하지 않습니다.");
            return;
        }

        // 4. 데이터 제출
        console.log("폼 데이터:", data);
    });
    

    const handleCancel = () => {
        navigate(`/matches/${match_id}/`);
    };    

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">                
                {loading ? (
                    <p>Loading...</p>
                ) : matchDetails ? (
                    <>   
                        <EditResultForm 
                            register={register}                            
                            errors={errors}
                            watch={watch}                            
                            onSubmit={handleFormSubmit}
                            positions={positions}
                        />
                        <div className="match-details">
                            <div className="header-card">
                                <h2>경기상세</h2>
                                <div className="tabs">
                                    <button
                                        className={`tab-button ${activeTab === 'goals' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('goals')}
                                    >
                                        개요
                                    </button>
                                    <button
                                        className={`tab-button ${activeTab === 'lineup' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('lineup')}
                                    >
                                        라인업
                                    </button>
                                </div>
                            </div>
                            {activeTab === "goals" ? (
                                <EditQuarterForm
                                    control={control}
                                    setValue={setValue}
                                    register={register}
                                    watch={watch}
                                    users={users}
                                    positions={positions}
                                    onSubmit={handleFormSubmit}
                                />
                            ) : activeTab === "lineup" ? (
                                <EditLineupForm
                                    control={control}
                                    setValue={setValue}
                                    register={register}
                                    watch={watch}
                                    users={users}
                                    positions={positions}
                                    onSubmit={handleFormSubmit}
                                />
                            ) : null}
                        </div>
                    </>
                ) : (
                    <p>매치 상세 정보가 없습니다.</p>
                )}
            </div>
            <FloatingBar
                mode="confirm_cancel"
                onConfirm={handleFormSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default MatchDetailsEdit;