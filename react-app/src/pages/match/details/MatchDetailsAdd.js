
import './Details.scss';
import axios from "axios";
import {useForm} from "react-hook-form";
import EditResultForm from "./EditResultForm";
import EditLineupForm from "./EditLineupForm";
import EditQuarterForm from "./EditQuarterForm";
import EditMaterialsForm from "./EditMaterialsForm";
import React, { useState, useEffect } from "react";
import { useAlert } from "../../../context/AlertContext";
import { useNavigate, useParams } from "react-router-dom";
import FloatingBar from "../../../components/FloatingBar";
import NavigationBar from "../../../components/NavigationBar";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ImageCropper from "../../../components/ImageCropper"; 


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

function MatchDetailsAdd() {
    // Config
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const API_URL = process.env.REACT_APP_API_URL;
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('goals');

    // API DATA
    const [users, setUsers] = useState([]);;
    const [positions, setPositions] = useState([]);

    // Image Upload States
    const [selectedFile, setSelectedFile] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [matchPhotoUrl, setMatchPhotoUrl] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    // Form Define
    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
        mode: "onChange",
    });
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const [positionResponse, userResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/positions`),
                axios.get(`${API_URL}/users`)
            ]);

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
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };    

    const initMatchData = () => {
        const tactics = "4-3-3";
        
        const newQuarters = Array.from({ length: 4 }, (_, index) => {
            const quarterNumber = index + 1;
            
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
                quarter_number: quarterNumber
            }));

            return {
                quarter_number: quarterNumber,
                goals: [],
                tactics: tactics,
                lineups: defaultLineups,
            };
        });
        
        const newMatch = {
            dt: '',
            winning_point: '',
            losing_point: '',
            opposing_team: '',
            location: '',
            start_time: '',
            end_time: '',
            weather: '',
            num_players: '',
            main_tactics: tactics,
            quarters: newQuarters
        };

        Object.entries(newMatch).forEach(([key, value]) => {
            setValue(key, value);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (positions.length > 0) {
            initMatchData();
        }
    }, [positions]);

    const handleOpenFilePicker = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = (e) => {
            const file = e.target.files && e.target.files[0];
            if (file) {
                setSelectedFile(file);
                setShowCropper(true);
            }
        };

        input.click();
    };

    const handleCroppedImage = (blob, previewUrl) => {
        setCroppedImage(previewUrl);
        setMatchPhotoUrl(previewUrl);
        setShowCropper(false);
    };

    const handlePhotoDelete = () => {
        setCroppedImage(null);
        setMatchPhotoUrl(null);
        setSelectedFile(null);
    };

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
        console.log('ADD formattedStart', formattedStart)
        console.log('ADD formattedEnd', formattedEnd)
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
        console.log("최종 제출 데이터:", data);
        try {
            setLoading(true);

            // FormData 생성
            const formData = new FormData();
            formData.append("data", JSON.stringify(data));

            // 이미지가 있으면 추가
            if (croppedImage) {
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                formData.append("photo", blob, "match.jpeg");
            }

            const response = await axios.post(`${API_URL}/matches`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            console.log("✅ 응답 상태 코드:", response.status);
            console.log("✅ 성공:", response.data);

            // ✅ 서버 응답이 정상적이라면 페이지 이동
            if (response.status === 200 || response.status === 201) {
                showAlert("success", '매치가 성공적으로 생성되었습니다!');
                navigate(`/matches`);
            }
        } catch (error) {
            if (error.response?.status === 403) {
                showAlert("warning", "로그인을 하지 않는 경우 데이터 수정 및 추가가 불가합니다.");
            } else {
                showAlert("warning", '데이터 저장에 실패했습니다. 다시 시도해주세요.');
            }
            console.error("❌ 오류 발생:", error.response?.data || error.message);
        } finally {
            setLoading(false); // 로딩 상태 해제
        }   

    });

    const handleConfirmSubmit = () => {
        showAlert("confirm", "새 매치를 생성하시겠습니까?", async () => {
            await handleFormSubmit();
        });
    };
    
    const handleCancel = () => {
        navigate(`/matches`);
    };    

    return (
        <div className="gray-background">
            <NavigationBar />
            <div className="content">                
                {loading ? (
                    <LoadingSpinner />
                ) : (
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
                        <EditMaterialsForm
                            register={register}
                            matchPhotoUrl={matchPhotoUrl}
                            onPhotoClick={handleOpenFilePicker}
                            onPhotoDelete={handlePhotoDelete}
                        />
                    </>
                )}
            </div>
            <FloatingBar
                mode="confirm_cancel"
                onConfirm={handleConfirmSubmit}
                onCancel={handleCancel}
            />
            {showCropper && (
                <ImageCropper
                    file={selectedFile}
                    onCrop={handleCroppedImage}
                    onClose={() => setShowCropper(false)}
                />
            )}
        </div>
    );
}

export default MatchDetailsAdd;