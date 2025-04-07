import './Details.scss';
import axios from "axios";
import {useForm} from "react-hook-form";
import EditResultForm from "./EditResultForm";
import EditLineupForm from "./EditLineupForm";
import EditQuarterForm from "./EditQuarterForm";
import React, { useState, useEffect } from "react";
import { useAlert } from "../../../context/AlertContext";
import { useNavigate, useParams } from "react-router-dom";
import FloatingBar from "../../../components/FloatingBar";
import NavigationBar from "../../../components/NavigationBar";
import LoadingSpinner from "../../../components/LoadingSpinner";

const determineResult = (winningPoint, losingPoint) => {
    if (winningPoint > losingPoint) return "승리";
    if (winningPoint < losingPoint) return "패배";
    return "무승부";
};

const formatDateTime = (date, timeString) => {
    const dateObj = new Date(date);
    const [hours, minutes] = timeString.split(":").map(Number);
    dateObj.setHours(hours, minutes, 0, 0);

    const pad = (n) => String(n).padStart(2, "0");

    const year = dateObj.getFullYear();
    const month = pad(dateObj.getMonth() + 1);
    const day = pad(dateObj.getDate());
    const hoursStr = pad(dateObj.getHours());
    const minutesStr = pad(dateObj.getMinutes());

    return `${year}-${month}-${day}T${hoursStr}:${minutesStr}:00`;
};


function formatTime(isoString) {
    const date = new Date(isoString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
}

function MatchDetailsEdit() {
    // Config
    const navigate = useNavigate();         
    const { showAlert } = useAlert();
    const { match_idx } = useParams();    
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
            const matchResponse = await axios.get(`${API_URL}/matches/${match_idx}`);
            setMatchDetails(matchResponse.data);
            initMatchForm(matchResponse);
                      
            // 나머지 API 콜은 실패할 경우 빈 배열로 처리
            const [quarterResponse, goalsResponse, lineupResponse, positionResponse, userResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/matches/${match_idx}/quarters`),
                axios.get(`${API_URL}/matches/${match_idx}/goals`),
                axios.get(`${API_URL}/matches/${match_idx}/lineups`),
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
    }, [match_idx, setValue]);

    
    const handleFormSubmit = handleSubmit(async (data) => {
        const { dt, start_time, end_time, quarters } = data;

        // 승리점수, 패배점수 계산하기
        const goals = quarters.flatMap((quarter) => quarter.goals || []);
        const winning_point = goals.filter((goal) => goal.goal_type === "득점").length;
        const losing_point = goals.filter(
            (goal) => goal.goal_type === "실점" || goal.goal_type === "자살골"
        ).length;
        data.winning_point = winning_point
        data.losing_point = losing_point

        // 인원수 계산하기
        const allLineups = quarters.flatMap((quarter) => quarter.lineups || []);            
        const uniquePlayers = new Set(
            allLineups
                .filter(({ user_name, back_number }) => user_name !== "용병" && user_name && back_number) // "용병" 제외
                .map(({ user_name, back_number }) => `${user_name}-${back_number}`) // 고유 키 생성
        );         
        const num_players = uniquePlayers.size;
        data.num_players = num_players
        
        // 시간 KST 로 포맷팅하기
        let formattedStart = formatDateTime(dt, start_time);
        let formattedEnd = formatDateTime(dt, end_time);
        const startDate = new Date(formattedStart);
        const endDate = new Date(formattedEnd);

        if (startDate > endDate) {
            endDate.setDate(endDate.getDate() + 1);
            
            const pad = (n) => String(n).padStart(2, "0");
            const yyyy = endDate.getFullYear();
            const MM = pad(endDate.getMonth() + 1);
            const dd = pad(endDate.getDate());
            const HH = pad(endDate.getHours());
            const mm = pad(endDate.getMinutes());

            formattedEnd = `${yyyy}-${MM}-${dd}T${HH}:${mm}:00`;
        }
        data.start_time = formattedStart;
        data.end_time = formattedEnd;

        // 결과값 입력하기
        data.result = determineResult(winning_point, losing_point);
    
        // 0. 골 유형이 빈값인지 확인
        const validateGoalTypes = () => {
            const allGoals = quarters.flatMap((quarter) => quarter.goals || []);
    
            return allGoals.every(goal => goal.goal_type && goal.goal_type.trim() !== "");
        };
        
        // 1. 쿼터 번호가 연속적인지 확인
        const areQuarterNumbersSequential = () => {
            const quarterNumbers = quarters
                .map((quarter) => quarter.quarter_number)
                .sort((a, b) => a - b);
            return quarterNumbers.every((num, index) => num === index + 1);
        };             

        // 2. 유저 이름이 유효한지 검증
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
        
        // 3. 쿼터별 라인업에서 중복 유저 이름 + 등번호 조합 확인
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
        
                    // 용병과 등번호가 999인 경우 중복 허용
                    if (userName === "용병" && backNumber === 999) {
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

        if (!quarters || quarters.length === 0){
            showAlert("warning", '최소 하나의 쿼터가 필요합니다.');
            return;
        }

        if (!validateGoalTypes()) {
            showAlert("warning", '모든 골의 유형(goal_type)은 반드시 입력되어야 합니다.');            
            return;
        }

        if (!areQuarterNumbersSequential()) {
            showAlert("warning", '쿼터 번호는 반드시 1부터 시작하는 연속된 숫자여야 합니다.');            
            return;
        }
        if (!validateGoalUserNames()) {
            showAlert("warning", '골 플레이어는 반드시 유효한 이름이어야 하며, 어시스트 플레이어는 빈 값이거나 유효한 이름이어야 합니다.');            
            return;
        }

        if (!validateUniqueLineupPlayers()) {
            showAlert("warning", '라인업 내에서 중복된 선수가 있거나, 빈 값이 있습니다');                        
            return;
        }

        // 4. 데이터 제출        
        try {
            setLoading(true);
            const response = await axios.put(`${API_URL}/matches/${match_idx}`, data, {
                headers: { "Content-Type": "application/json" },
            });                     
        
            // ✅ 서버 응답이 정상적이라면 페이지 이동
            if (response.status === 200 || response.status === 201) {
                showAlert("success", '수정이 성공하였습니다!');
                navigate(`/matches/${match_idx}/`);
            }
        } catch (error) {
            showAlert("warning", '수정에 실패했습니다. 입력값을 확인해주세요.');
            console.error("❌ 오류 발생:", error.response?.data || error.message);                        
        } finally {
            setLoading(false); // 로딩 상태 해제
        }   

    });

    const handleConfirmSubmit = () => {
        showAlert("confirm", "매치 정보를 수정하시겠습니까?", async () => {
            await handleFormSubmit();
        });
    };
    
    const handleCancel = () => {
        navigate(`/matches/${match_idx}/`);
    };    

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">                
                {loading ? (
                    <LoadingSpinner />
                ) : matchDetails ? (
                    <>   
                        <EditResultForm 
                            setValue={setValue}
                            register={register}
                            errors={errors}
                            watch={watch}
                            onSubmit={handleFormSubmit}
                            control={control}
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
                onConfirm={handleConfirmSubmit}
                onCancel={handleCancel}
            />
        </div>
    );
}

export default MatchDetailsEdit;