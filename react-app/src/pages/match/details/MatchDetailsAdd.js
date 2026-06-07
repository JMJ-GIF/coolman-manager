
import './Details.scss';
import axios from "axios";
import {useForm} from "react-hook-form";
import EditResultForm from "./EditResultForm";
import EditLineupForm from "./EditLineupForm";
import EditQuarterForm from "./EditQuarterForm";
import EditMaterialsForm from "./EditMaterialsForm";
import React, { useState, useEffect, useRef } from "react";
import { useAlert } from "../../../context/AlertContext";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import FloatingBar from "../../../components/FloatingBar";
import NavigationBar from "../../../components/NavigationBar";
import LoadingSpinner from "../../../components/LoadingSpinner";
import ImageCropper from "../../../components/ImageCropper";

const NINE_V_NINE_TACTICS  = ['3-3-2', '3-2-3', '2-3-3'];
const TEN_V_TEN_TACTICS    = ['4-3-2', '3-4-2', '3-3-3'];

const DEFAULT_TACTICS_BY_PLAYER_COUNT = {
    '9v9':   '3-3-2',
    '10v10': '4-3-2',
    '11v11': '4-3-3',
};

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
    const navigate = useNavigate();
    const { showAlert } = useAlert();
    const { authUser } = useAuth();

    const checkDirector = () => {
        if (authUser?.role !== '감독') {
            showAlert('warning', '⚠️ 수정 권한이 없습니다. 감독만 가능합니다.');
            return false;
        }
        return true;
    };
    const API_URL = process.env.REACT_APP_API_URL;
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('goals');

    const [users, setUsers] = useState([]);
    const [positions, setPositions] = useState([]);

    const [selectedFile, setSelectedFile] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [matchPhotoUrl, setMatchPhotoUrl] = useState(null);
    const [showCropper, setShowCropper] = useState(false);

    const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm({
        mode: "onChange",
        defaultValues: {
            player_count: '11v11',
            match_nature: '경기',
            include_in_records: true,
        }
    });

    const prevPlayerCount = useRef('11v11');
    const prevMatchNature = useRef('경기');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [positionResponse, userResponse] = await Promise.allSettled([
                axios.get(`${API_URL}/positions`),
                axios.get(`${API_URL}/users`)
            ]);
            if (userResponse.status === "fulfilled") setUsers(userResponse.value.data);
            else setUsers([]);
            if (positionResponse.status === "fulfilled") setPositions(positionResponse.value.data);
            else setPositions([]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const buildQuarters = (playerCount, matchNature, positionsData) => {
        const tactics = DEFAULT_TACTICS_BY_PLAYER_COUNT[playerCount] || '4-3-3';
        const isNaeJeon = matchNature === '내전';

        return Array.from({ length: 4 }, (_, index) => {
            const quarterNumber = index + 1;
            const filteredPositions = positionsData
                .filter((p) => p.tactics === tactics)
                .sort((a, b) => a.order - b.order);

            const buildLineup = (team) => filteredPositions.map((position) => ({
                user_name: "",
                user_idx: "",
                back_number: "",
                lineup_status: "선발",
                lineup_team: isNaeJeon ? team : null,
                position_name: position.name,
                position_idx: position.position_idx,
                top_coordinate: position.top_coordinate,
                left_coordinate: position.left_coordinate,
                quarter_number: quarterNumber,
            }));

            const defaultLineups = isNaeJeon
                ? [...buildLineup('A'), ...buildLineup('B')]
                : buildLineup(null);

            return {
                quarter_number: quarterNumber,
                goals: [],
                tactics: tactics,
                team_b_tactics: isNaeJeon ? tactics : null,
                lineups: defaultLineups,
            };
        });
    };

    const initMatchData = (playerCount = '11v11', matchNature = '경기') => {
        if (positions.length === 0) return;
        const tactics = DEFAULT_TACTICS_BY_PLAYER_COUNT[playerCount] || '4-3-3';
        const newQuarters = buildQuarters(playerCount, matchNature, positions);

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
            player_count: playerCount,
            match_nature: matchNature,
            team_a_name: '',
            team_b_name: '',
            quarters: newQuarters
        };

        Object.entries(newMatch).forEach(([key, value]) => setValue(key, value));
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (positions.length > 0) {
            initMatchData('11v11', '경기');
        }
    }, [positions]);

    const handlePlayerCountChange = (newPlayerCount) => {
        const matchNature = watch("match_nature") || '경기';
        if (positions.length === 0) return;
        prevPlayerCount.current = newPlayerCount;
        const newQuarters = buildQuarters(newPlayerCount, matchNature, positions);
        setValue("quarters", newQuarters);
    };

    const handleMatchNatureChange = (newMatchNature) => {
        const playerCount = watch("player_count") || '11v11';
        if (positions.length === 0) return;
        prevMatchNature.current = newMatchNature;
        const newQuarters = buildQuarters(playerCount, newMatchNature, positions);
        setValue("quarters", newQuarters);
        // 내전이 아닐 때 팀이름 초기화
        if (newMatchNature !== '내전') {
            setValue("team_a_name", '');
            setValue("team_b_name", '');
        }
    };

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
        const { dt, start_time, end_time, quarters, match_nature, team_a_name, team_b_name } = data;
        const isNaeJeon = match_nature === '내전';

        // 승리점수/패배점수 계산
        const goals = quarters.flatMap((quarter) => quarter.goals || []);

        let winning_point, losing_point, result, opposing_team;

        if (isNaeJeon) {
            winning_point = goals.filter((g) => g.scoring_team === 'A').length;
            losing_point  = goals.filter((g) => g.scoring_team === 'B').length;
            result        = '내전';
            opposing_team = team_b_name || '내전';
        } else {
            winning_point = goals.filter((g) => g.goal_type === "득점").length;
            losing_point  = goals.filter((g) => g.goal_type === "실점" || g.goal_type === "자살골").length;
            result        = determineResult(winning_point, losing_point);
            opposing_team = data.opposing_team;
        }

        data.winning_point  = winning_point;
        data.losing_point   = losing_point;
        data.result         = result;
        data.opposing_team  = opposing_team;

        // 인원수 계산
        const allLineups = quarters.flatMap((quarter) => quarter.lineups || []);
        const uniquePlayers = new Set(
            allLineups
                .filter(({ user_name, back_number }) => user_name !== "용병" && user_name && back_number)
                .map(({ user_name, back_number }) => `${user_name}-${back_number}`)
        );
        data.num_players = uniquePlayers.size;

        // 시간 포맷팅
        let formattedStart = formatDateTime(dt, start_time);
        let formattedEnd   = formatDateTime(dt, end_time);
        const startDate    = new Date(formattedStart);
        const endDate      = new Date(formattedEnd);
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
        data.end_time   = formattedEnd;

        // 검증: 쿼터 최소 1개
        if (!quarters || quarters.length === 0) {
            showAlert("warning", '최소 하나의 쿼터가 필요합니다.');
            return;
        }

        // 검증: 쿼터 번호 연속성
        const quarterNumbers = quarters.map((q) => q.quarter_number).sort((a, b) => a - b);
        if (!quarterNumbers.every((num, idx) => num === idx + 1)) {
            showAlert("warning", '쿼터 번호는 반드시 1부터 시작하는 연속된 숫자여야 합니다.');
            return;
        }

        // 검증: 골 유형
        if (!isNaeJeon) {
            const allGoals = quarters.flatMap((q) => q.goals || []);
            if (!allGoals.every(g => g.goal_type && g.goal_type.trim() !== "")) {
                showAlert("warning", '모든 골의 유형은 반드시 입력되어야 합니다.');
                return;
            }
            // 골 선수 이름 검증
            const invalidGoals = allGoals.filter((goal) => {
                const isConceded = goal.goal_type === "실점";
                const isGoalPlayerValid = isConceded || (goal.goal_player_name && users.some(u => u.name === goal.goal_player_name));
                const isAssistPlayerValid = !goal.assist_player_name || users.some(u => u.name === goal.assist_player_name);
                return !isGoalPlayerValid || !isAssistPlayerValid;
            });
            if (invalidGoals.length > 0) {
                showAlert("warning", '골 플레이어는 반드시 유효한 이름이어야 합니다.');
                return;
            }
        } else {
            // 내전 골 검증
            const allGoals = quarters.flatMap((q) => q.goals || []);
            const invalidGoals = allGoals.filter((goal) =>
                !goal.scoring_team || !goal.goal_player_name || !users.some(u => u.name === goal.goal_player_name)
            );
            if (invalidGoals.length > 0) {
                showAlert("warning", '내전 골은 팀과 선수를 모두 선택해야 합니다.');
                return;
            }
        }

        // 검증: 라인업 중복 (내전 포함 동일 쿼터 내 동일 선수는 팀 무관하게 1명만)
        const invalidQuarters = quarters.filter((quarter) => {
            const seen = new Set();
            return (quarter.lineups || []).some(({ user_name, back_number }) => {
                if (!user_name || user_name.trim() === "") return true;
                if (user_name === "용병" && back_number === 999) return false;
                const key = `${user_name}-${back_number}`;
                if (seen.has(key)) return true;
                seen.add(key);
                return false;
            });
        });
        if (invalidQuarters.length > 0) {
            showAlert("warning", '라인업 내에서 중복된 선수가 있거나, 빈 값이 있습니다');
            return;
        }

        console.log("최종 제출 데이터:", data);
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("data", JSON.stringify(data));
            if (croppedImage) {
                const response = await fetch(croppedImage);
                const blob = await response.blob();
                formData.append("photo", blob, "match.jpeg");
            }
            const response = await axios.post(`${API_URL}/matches`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
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
            setLoading(false);
        }
    });

    const handleConfirmSubmit = () => {
        if (!checkDirector()) return;
        showAlert("confirm", "새 매치를 생성하시겠습니까?", async () => {
            await handleFormSubmit();
        });
    };

    const handleCancel = () => navigate(`/matches`);

    const matchNature = watch("match_nature") || "경기";

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
                            onPlayerCountChange={handlePlayerCountChange}
                            onMatchNatureChange={handleMatchNatureChange}
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
                                    matchNature={matchNature}
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
                                    matchNature={matchNature}
                                    teamAName={watch("team_a_name") || "A팀"}
                                    teamBName={watch("team_b_name") || "B팀"}
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
