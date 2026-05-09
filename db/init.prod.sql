-- 데이터베이스 생성 (존재 여부 확인)
SELECT 'CREATE DATABASE coolman OWNER jmj'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'coolman')\gexec

-- Demo 데이터베이스 생성 (존재 여부 확인)
SELECT 'CREATE DATABASE demo OWNER jmj'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'demo')\gexec

-- 데이터베이스 접속
\c coolman

-- 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    user_idx SERIAL PRIMARY KEY,    
    name VARCHAR(50) NOT NULL,	
    position VARCHAR(20) NOT NULL,
    back_number INT UNIQUE NOT NULL,
    join_date TIMESTAMP NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('선수', '감독', '용병')),
    social_uuid VARCHAR(50) UNIQUE NOT NULL, 
    image_url TEXT NULL,    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS matches (
    match_idx SERIAL PRIMARY KEY,
    dt DATE NOT NULL,
    result VARCHAR(20) NOT NULL,
    winning_point INT NOT NULL,
    losing_point INT NOT NULL,
    opposing_team VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    weather VARCHAR(100) NOT NULL,
    num_players INT NOT NULL,
    main_tactics VARCHAR(255) NOT NULL,
    photo_url TEXT NULL,
    video_url TEXT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS quarters (
    quarter_idx SERIAL PRIMARY KEY,          
    match_idx INT NOT NULL,                  
    quarter_number INT NOT NULL,
    tactics VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,             
    FOREIGN KEY (match_idx) REFERENCES matches (match_idx) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
    goal_idx SERIAL PRIMARY KEY,               
    match_idx INT NOT NULL,   
    quarter_idx INT NOT NULL,                 
    goal_player_id INT,               
    assist_player_id INT,  
    goal_type VARCHAR(50) NOT NULL,                                    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL, 
    FOREIGN KEY (match_idx) REFERENCES matches (match_idx) ON DELETE CASCADE,
    FOREIGN KEY (quarter_idx) REFERENCES quarters (quarter_idx) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS positions (
    position_idx SERIAL PRIMARY KEY,               
    tactics VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    top_coordinate INT NOT NULL,
    left_coordinate INT NOT NULL,   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS quarters_lineup (
    lineup_idx SERIAL PRIMARY KEY,
    player_idx INT NOT NULL,
    quarter_idx INT NOT NULL, 
    position_idx INT NULL,
    lineup_status VARCHAR(20) NOT NULL CHECK (lineup_status IN ('선발', '후보')),   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (quarter_idx) REFERENCES quarters (quarter_idx) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mvp (
	mvp_idx SERIAL PRIMARY KEY,
	year INT NOT NULL,
	player_idx INT NOT NULL,
	position_type VARCHAR(255) NOT NULL,
    mvp_image_url TEXT NULL,
	main_title TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS mvp_comment (
	comment_idx SERIAL PRIMARY KEY,
	mvp_idx INT NOT NULL,
	description TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
	FOREIGN KEY (mvp_idx) REFERENCES mvp (mvp_idx) ON DELETE CASCADE
);

INSERT INTO users (name, position, back_number, join_date, role, social_uuid, image_url) VALUES
('용병','GK', 999, '2023-11-02 15:15:00', '용병', '12', NULL);

INSERT INTO positions (tactics, name, description, top_coordinate, left_coordinate)
VALUES
-- 4-4-2 Formation
('4-4-2', 'GK', 'Goalkeeper', 90, 50), 
('4-4-2', 'RB', 'Right Back', 70, 80),
('4-4-2', 'RCB', 'Right Center Back', 70, 60),
('4-4-2', 'LCB', 'Left Center Back', 70, 40),
('4-4-2', 'LB', 'Left Back', 70, 20),
('4-4-2', 'RM', 'Right Midfielder', 45, 80),
('4-4-2', 'RCM', 'Right Central Midfielder', 45, 60),
('4-4-2', 'LCM', 'Left Central Midfielder', 45, 40),
('4-4-2', 'LM', 'Left Midfielder', 45, 20),
('4-4-2', 'RST', 'Right Striker', 20, 60),
('4-4-2', 'LST', 'Left Striker', 20, 40),

-- 4-3-3 Formation
('4-3-3', 'GK', 'Goalkeeper', 90, 50), 
('4-3-3', 'RB', 'Right Back', 70, 80),
('4-3-3', 'RCB', 'Right Center Back', 70, 60),
('4-3-3', 'LCB', 'Left Center Back', 70, 40),
('4-3-3', 'LB', 'Left Back', 70, 20),
('4-3-3', 'CDM', 'Central Defensive Midfielder', 45, 50),
('4-3-3', 'RCM', 'Right Central Midfielder', 45, 70),
('4-3-3', 'LCM', 'Left Central Midfielder', 45, 30),
('4-3-3', 'RW', 'Right Winger', 20, 70),
('4-3-3', 'LW', 'Left Winger', 20, 30),
('4-3-3', 'CF', 'Center Forward', 20, 50),

-- 3-5-2 Formation
('3-5-2', 'GK', 'Goalkeeper', 90, 50), 
('3-5-2', 'LCB', 'Left Center Back', 70, 20),
('3-5-2', 'CCB', 'Center Center Back', 70, 50),
('3-5-2', 'RCB', 'Right Center Back', 70, 80),
('3-5-2', 'LWB', 'Left Wing Back', 30, 20),
('3-5-2', 'RWB', 'Right Wing Back', 30, 80),
('3-5-2', 'CDM', 'Central Defensive Midfielder', 50, 50),
('3-5-2', 'CLM', 'Central Left Midfielder', 30, 40),
('3-5-2', 'CRM', 'Central Right Midfielder', 30, 60),
('3-5-2', 'LST', 'Left Striker', 10, 35),
('3-5-2', 'RST', 'Right Striker', 10, 65),

-- 4-2-3-1 Formation
('4-2-3-1', 'GK', 'Goalkeeper', 90, 50), 
('4-2-3-1', 'RB', 'Right Back', 70, 80),
('4-2-3-1', 'RCB', 'Right Center Back', 70, 60),
('4-2-3-1', 'LCB', 'Left Center Back', 70, 40),
('4-2-3-1', 'LB', 'Left Back', 70, 20),
('4-2-3-1', 'RCDM', 'Right Central Defensive Midfielder', 50, 65),
('4-2-3-1', 'LCDM', 'Left Central Defensive Midfielder', 50, 35),
('4-2-3-1', 'RAM', 'Right Attacking Midfielder', 30, 70),
('4-2-3-1', 'CAM', 'Central Attacking Midfielder', 30, 50),
('4-2-3-1', 'LAM', 'Left Attacking Midfielder', 30, 30),
('4-2-3-1', 'ST', 'Striker', 10, 50),

-- 3-4-3 Formation
('3-4-3', 'GK', 'Goalkeeper', 90, 50), 
('3-4-3', 'LCB', 'Left Center Back', 70, 20),
('3-4-3', 'CCB', 'Center Center Back', 70, 50),
('3-4-3', 'RCB', 'Right Center Back', 70, 80),
('3-4-3', 'LWB', 'Left Wing Back', 45, 20),
('3-4-3', 'RWB', 'Right Wing Back', 45, 80),
('3-4-3', 'LCM', 'Left Central Midfielder', 45, 40),
('3-4-3', 'RCM', 'Right Central Midfielder', 45, 60),
('3-4-3', 'LW', 'Left Winger', 20, 20),
('3-4-3', 'RW', 'Right Winger', 20, 80),
('3-4-3', 'CF', 'Center Forward', 20, 50),

-- 5-4-1 Formation
('5-4-1', 'GK', 'Goalkeeper', 90, 50), 
('5-4-1', 'LB', 'Left Back', 70, 15),
('5-4-1', 'LCB', 'Left Center Back', 70, 31),
('5-4-1', 'CCB', 'Center Center Back', 70, 49),
('5-4-1', 'RCB', 'Right Center Back', 70, 67),
('5-4-1', 'RB', 'Right Back', 70, 85),
('5-4-1', 'LM', 'Left Midfielder', 45, 20),
('5-4-1', 'LCM', 'Left Central Midfielder', 45, 40),
('5-4-1', 'RCM', 'Right Central Midfielder', 45, 60),
('5-4-1', 'RM', 'Right Midfielder', 45, 80),
('5-4-1', 'ST', 'Striker', 20, 50),

-- 5-3-2 Formation
('5-3-2', 'GK', 'Goalkeeper', 90, 50), 
('5-3-2', 'LB', 'Left Back', 70, 15), 
('5-3-2', 'LCB', 'Left Center Back', 70, 31),
('5-3-2', 'CCB', 'Center Center Back', 70, 49),
('5-3-2', 'RCB', 'Right Center Back', 70, 67),
('5-3-2', 'RB', 'Right Back', 70, 85),
('5-3-2', 'LCM', 'Left Central Midfielder', 45, 20),
('5-3-2', 'CM', 'Central Midfielder', 45, 50),
('5-3-2', 'RCM', 'Right Central Midfielder', 45, 80),
('5-3-2', 'LST', 'Left Striker', 20, 35),
('5-3-2', 'RST', 'Right Striker', 20, 65);

-- 🔹 updated_at 자동 갱신 함수 (업데이트 발생 시 항상 NOW() 적용)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 🔹 각 테이블에 트리거 추가
CREATE TRIGGER trigger_update_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_matches
BEFORE UPDATE ON matches
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_quarters
BEFORE UPDATE ON quarters
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_goals
BEFORE UPDATE ON goals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_positions
BEFORE UPDATE ON positions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_quarters_lineup
BEFORE UPDATE ON quarters_lineup
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_mvp
BEFORE UPDATE ON mvp
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_mvp_comment
BEFORE UPDATE ON mvp_comment
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Accounting tables
CREATE TABLE IF NOT EXISTS member_types (
    type_idx    SERIAL PRIMARY KEY,
    user_idx    INT NOT NULL REFERENCES users(user_idx) ON DELETE CASCADE,
    year        INT NOT NULL,
    month       INT NOT NULL,
    member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('정회원','월회원','휴회원','탈퇴회원')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL,
    UNIQUE (user_idx, year, month)
);

CREATE TABLE IF NOT EXISTS accounting_records (
    record_idx  SERIAL PRIMARY KEY,
    user_idx    INT NOT NULL REFERENCES users(user_idx) ON DELETE CASCADE,
    dt          DATE NOT NULL,
    fee_type    VARCHAR(20) NOT NULL CHECK (fee_type IN ('분기회비','월회비','휴회비','휴회경기참가비')),
    amount      INT NOT NULL DEFAULT 0,
    paid_amount INT NOT NULL DEFAULT 0,
    note        TEXT NULL,
    match_idx   INT NULL REFERENCES matches(match_idx) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL
);

CREATE TRIGGER trigger_update_member_types
BEFORE UPDATE ON member_types
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_accounting_records
BEFORE UPDATE ON accounting_records
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 데이터베이스 접속
\c demo

-- 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    user_idx SERIAL PRIMARY KEY,    
    name VARCHAR(50) NOT NULL,	
    position VARCHAR(20) NOT NULL,
    back_number INT UNIQUE NOT NULL,
    join_date TIMESTAMP NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('선수', '감독', '용병')),
    social_uuid VARCHAR(50) UNIQUE NOT NULL, 
    image_url TEXT NULL,    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS matches (
    match_idx SERIAL PRIMARY KEY,
    dt DATE NOT NULL,
    result VARCHAR(20) NOT NULL,
    winning_point INT NOT NULL,
    losing_point INT NOT NULL,
    opposing_team VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    weather VARCHAR(100) NOT NULL,
    num_players INT NOT NULL,
    main_tactics VARCHAR(255) NOT NULL,
    photo_url TEXT NULL,
    video_url TEXT NULL,
    status VARCHAR(50) DEFAULT 'Confirmed' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS quarters (
    quarter_idx SERIAL PRIMARY KEY,          
    match_idx INT NOT NULL,                  
    quarter_number INT NOT NULL,
    tactics VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,             
    FOREIGN KEY (match_idx) REFERENCES matches (match_idx) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goals (
    goal_idx SERIAL PRIMARY KEY,               
    match_idx INT NOT NULL,   
    quarter_idx INT NOT NULL,                 
    goal_player_id INT,               
    assist_player_id INT,  
    goal_type VARCHAR(50) NOT NULL,                                    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL, 
    FOREIGN KEY (match_idx) REFERENCES matches (match_idx) ON DELETE CASCADE,
    FOREIGN KEY (quarter_idx) REFERENCES quarters (quarter_idx) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS positions (
    position_idx SERIAL PRIMARY KEY,               
    tactics VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    top_coordinate INT NOT NULL,
    left_coordinate INT NOT NULL,   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS quarters_lineup (
    lineup_idx SERIAL PRIMARY KEY,
    player_idx INT NOT NULL,
    quarter_idx INT NOT NULL, 
    position_idx INT NULL,
    lineup_status VARCHAR(20) NOT NULL CHECK (lineup_status IN ('선발', '후보')),   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    FOREIGN KEY (quarter_idx) REFERENCES quarters (quarter_idx) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mvp (
	mvp_idx SERIAL PRIMARY KEY,
	year INT NOT NULL,
	player_idx INT NOT NULL,
	position_type VARCHAR(255) NOT NULL,
    mvp_image_url TEXT NULL,
    main_title TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS mvp_comment (
	comment_idx SERIAL PRIMARY KEY,
	mvp_idx INT NOT NULL,
	description TEXT NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
	FOREIGN KEY (mvp_idx) REFERENCES mvp (mvp_idx) ON DELETE CASCADE
);

-- 기본 데이터 삽입
INSERT INTO users (name, position, back_number, join_date, role, social_uuid, image_url) VALUES
('홍길동','GK', 9, '2022-01-10 10:00:00', '선수', '1', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/1.png'),
('김철수','CB', 5, '2022-02-15 11:30:00', '선수', '2', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/2.png'),
('이영희','RM', 8, '2023-03-12 14:45:00', '선수', '3', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/3.png'),
('박민준','ST', 1, '2023-04-20 09:20:00', '선수', '4', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/4.png'),
('최예림','ST', 11, '2021-05-25 16:10:00', '선수', '5', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/5.png'),
('정수현','LB', 6, '2022-06-18 13:40:00', '선수', '6', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/6.png'),
('윤지훈','RB', 4, '2023-07-22 12:50:00', '선수', '7', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/7.png'),
('안도현','RWB', 15, '2021-08-30 15:00:00', '감독', '8', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/8.png'),
('서유리','ST', 10, '2022-09-15 10:05:00', '선수', '9', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/9.png'),
('장준호','RW', 22, '2023-10-05 17:25:00', '감독', '10', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/10.png'),
('진민제','RW', 35, '2023-10-05 17:25:00', '선수', 'xx', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/11.png'),
('장준호','ST', 99, '2023-11-01 15:15:00', '선수', '11', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/demo/12.png'),
('용병','GK', 999, '2023-11-02 15:15:00', '용병', '12', NULL);

INSERT INTO matches (dt, result, winning_point, losing_point, opposing_team, location, start_time, end_time, weather, num_players, main_tactics, status)
VALUES 
('2025-12-01', '승리', 3, 1, '라이벌 FC', '국립 경기장', '2024-12-01 15:00:00', '2024-12-01 16:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2025-12-02', '패배', 2, 3, '승리 클럽', '시티 아레나', '2024-12-02 18:00:00', '2024-12-02 19:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2025-12-03', '무승부', 2, 2, '레전드 FC', '메트로 스타디움', '2024-12-03 20:00:00', '2024-12-03 21:45:00', '구름', 22, '3-5-2', 'Confirmed'),
('2025-12-04', '승리', 4, 0, '라이벌 FC', '중앙 공원 필드', '2024-12-04 14:00:00', '2024-12-04 15:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2025-12-05', '패배', 1, 2, '라이벌 FC', '해안 스타디움', '2024-12-05 19:00:00', '2024-12-05 20:45:00', '바람', 22, '4-4-2', 'Confirmed'),
('2025-12-06', '승리', 3, 1, '내맘대로 FC', '그랜드 아레나', '2024-12-06 16:00:00', '2024-12-06 17:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2025-12-07', '승리', 2, 1, '이글스 클럽', '이스트사이드 필드', '2024-12-07 17:00:00', '2024-12-07 18:45:00', '맑음', 22, '3-4-3', 'Confirmed'),
('2025-12-08', '무승부', 1, 1, '내맘대로 FC', '구시가지 스타디움', '2024-12-08 15:00:00', '2024-12-08 16:45:00', '구름', 22, '5-3-2', 'Confirmed'),
('2025-12-09', '패배', 1, 2, '워리어스 FC', '노스사이드 아레나', '2024-12-09 18:00:00', '2024-12-09 19:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2025-12-10', '승리', 5, 3, '샤크스 팀', '코스탈 필드', '2024-12-10 16:00:00', '2024-12-10 17:45:00', '바람', 22, '3-5-2', 'Confirmed'),
('2025-12-11', '승리', 2, 0, '돌핀스 FC', '아일랜드 아레나', '2024-12-11 14:00:00', '2024-12-11 15:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2025-12-12', '패배', 0, 3, '워리어스 FC', '마운틴 필드', '2024-12-12 19:00:00', '2024-12-12 20:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2025-12-13', '승리', 4, 2, '드래곤즈 FC', '리버프론트 스타디움', '2024-12-13 18:00:00', '2024-12-13 19:45:00', '맑음', 22, '3-4-3', 'Confirmed'),
('2025-12-14', '무승부', 3, 3, '워리어스 FC', '그랜드 아레나', '2024-12-14 20:00:00', '2024-12-14 21:45:00', '구름', 22, '4-2-3-1', 'Confirmed'),
('2025-12-15', '패배', 1, 2, '나이츠 FC', '중앙 스타디움', '2024-12-15 15:00:00', '2024-12-15 16:45:00', '비', 22, '4-3-3', 'Confirmed'),
('2025-12-16', '승리', 3, 1, '워리어스 FC', '국립 경기장', '2024-12-16 17:00:00', '2024-12-16 18:45:00', '맑음', 22, '4-4-2', 'Confirmed'),
('2025-12-17', '패배', 0, 1, '타이탄스 FC', '시티 아레나', '2024-12-17 18:00:00', '2024-12-17 19:45:00', '구름', 22, '3-5-2', 'Confirmed'),
('2025-12-18', '승리', 5, 2, '내맘대로 FC', '코스탈 필드', '2024-12-18 16:00:00', '2024-12-18 17:45:00', '바람', 22, '4-3-3', 'Confirmed'),
('2025-12-19', '무승부', 0, 0, '불스 클럽', '해안 스타디움', '2024-12-19 19:00:00', '2024-12-19 20:45:00', '비', 22, '5-4-1', 'Confirmed'),
('2025-12-20', '승리', 4, 1, '내맘대로 FC', '그랜드 아레나', '2024-12-20 14:00:00', '2024-12-20 15:45:00', '맑음', 22, '4-2-3-1', 'Confirmed'),
('2025-12-21', '승리', 4, 1, '내맘대로 FC', '그랜드 아레나', '2024-12-20 14:00:00', '2024-12-20 15:45:00', '맑음', 22, '4-2-3-1', 'Confirmed');

INSERT INTO quarters (match_idx, quarter_number, tactics) VALUES
(1, 1, '3-4-3'),
(1, 2, '5-3-2'),
(1, 3, '4-3-3'),
(1, 4, '5-3-2'),
(2, 1, '4-4-2'),
(2, 2, '3-4-3'),
(2, 3, '4-4-2'),
(2, 4, '4-2-3-1'),
(3, 1, '4-2-3-1'),
(3, 2, '3-5-2'),
(3, 3, '3-5-2'),
(3, 4, '3-4-3'),
(4, 1, '3-4-3'),
(4, 2, '3-4-3'),
(4, 3, '4-2-3-1'),
(4, 4, '4-2-3-1'),
(5, 1, '4-2-3-1'),
(5, 2, '4-4-2'),
(5, 3, '5-3-2'),
(5, 4, '4-3-3'),
(6, 1, '5-3-2'),
(6, 2, '3-5-2'),
(6, 3, '4-2-3-1'),
(6, 4, '4-3-3'),
(7, 1, '4-3-3'),
(7, 2, '4-3-3'),
(7, 3, '5-3-2'),
(7, 4, '4-2-3-1'),
(8, 1, '3-5-2'),
(8, 2, '3-5-2'),
(8, 3, '4-2-3-1'),
(8, 4, '5-4-1'),
(9, 1, '4-2-3-1'),
(9, 2, '5-3-2'),
(9, 3, '5-3-2'),
(9, 4, '4-4-2'),
(10, 1, '4-2-3-1'),
(10, 2, '4-2-3-1'),
(10, 3, '5-3-2'),
(10, 4, '4-4-2'),
(11, 1, '4-4-2'),
(11, 2, '5-3-2'),
(11, 3, '3-5-2'),
(11, 4, '3-4-3'),
(12, 1, '5-4-1'),
(12, 2, '3-4-3'),
(12, 3, '4-4-2'),
(12, 4, '3-4-3'),
(13, 1, '5-3-2'),
(13, 2, '3-5-2'),
(13, 3, '4-3-3'),
(13, 4, '3-5-2'),
(14, 1, '3-4-3'),
(14, 2, '5-3-2'),
(14, 3, '4-3-3'),
(14, 4, '4-4-2'),
(15, 1, '3-5-2'),
(15, 2, '5-4-1'),
(15, 3, '3-5-2'),
(15, 4, '3-5-2'),
(16, 1, '4-2-3-1'),
(16, 2, '4-4-2'),
(16, 3, '4-2-3-1'),
(16, 4, '3-4-3'),
(17, 1, '4-3-3'),
(17, 2, '4-3-3'),
(17, 3, '5-3-2'),
(17, 4, '5-4-1'),
(18, 1, '5-4-1'),
(18, 2, '5-4-1'),
(18, 3, '4-2-3-1'),
(18, 4, '3-5-2'),
(19, 1, '4-2-3-1'),
(19, 2, '4-2-3-1'),
(19, 3, '4-4-2'),
(19, 4, '3-5-2'),
(20, 1, '5-4-1'),
(20, 2, '4-3-3'),
(20, 3, '5-4-1'),
(20, 4, '5-4-1'),
(21, 1, '5-4-1'),
(21, 2, '4-3-3'),
(21, 3, '5-4-1'),
(21, 4, '5-4-1');

INSERT INTO goals (match_idx, quarter_idx, goal_player_id, assist_player_id, goal_type) VALUES
(1, 2, 9, 11, '득점'),
(1, 3, 2, 10, '득점'),
(1, 3, NULL, NULL, '실점'),
(1, 4, 10, 7, '득점'),
(2, 5, 7, 11, '득점'),
(2, 5, NULL, NULL, '실점'),
(2, 6, NULL, NULL, '실점'),
(2, 7, 4, 3, '득점'),
(2, 8, NULL, NULL, '실점'),
(3, 9, NULL, NULL, '실점'),
(3, 11, 11, 11, '득점'),
(3, 12, 7, 6, '득점'),
(3, 12, NULL, NULL, '실점'),
(4, 13, 10, NULL, '득점'),
(4, 14, 5, NULL, '득점'),
(4, 16, 3, 4, '득점'),
(4, 16, 4, NULL, '자살골'),
(5, 17, NULL, NULL, '실점'),
(5, 18, 11, 7, '득점'),
(5, 20, NULL, NULL, '실점'),
(6, 21, 8, NULL, '득점'),
(6, 21, 11, 6, '득점'),
(6, 22, NULL, NULL, '실점'),
(6, 23, 3, NULL, '득점'),
(7, 27, NULL, NULL, '실점'),
(7, 28, 8, NULL, '득점'),
(7, 28, 2, 8, '득점'),
(8, 31, NULL, NULL, '실점'),
(8, 32, 8, NULL, '득점'),
(9, 35, 8, NULL, '득점'),
(9, 36, NULL, NULL, '실점'),
(9, 36, NULL, NULL, '실점'),
(10, 37, 3, NULL, '득점'),
(10, 37, 4, NULL, '득점'),
(10, 37, NULL, NULL, '실점'),
(10, 38, 11, 6, '득점'),
(10, 38, NULL, NULL, '실점'),
(10, 39, 11, 5, '득점'),
(10, 39, 5, NULL, '득점'),
(10, 40, NULL, NULL, '실점'),
(11, 41, 7, NULL, '득점'),
(11, 41, 9, 5, '득점'),
(12, 47, NULL, NULL, '실점'),
(12, 48, NULL, NULL, '실점'),
(12, 48, NULL, NULL, '실점'),
(13, 49, 3, NULL, '자살골'),
(13, 50, 9, 2, '득점'),
(13, 50, NULL, NULL, '실점'),
(13, 51, 9, NULL, '자살골'),
(13, 52, 2, 11, '득점'),
(13, 52, NULL, NULL, '실점'),
(14, 53, NULL, NULL, '실점'),
(14, 55, 10, NULL, '득점'),
(14, 56, 2, 7, '득점'),
(14, 56, 7, NULL, '득점'),
(14, 56, NULL, NULL, '실점'),
(14, 56, NULL, NULL, '실점'),
(15, 57, NULL, NULL, '실점'),
(15, 58, 4, 10, '득점'),
(15, 59, NULL, NULL, '실점'),
(16, 62, NULL, NULL, '실점'),
(16, 63, 3, NULL, '득점'),
(16, 64, 10, 3, '득점'),
(16, 64, 7, NULL, '득점'),
(17, 66, NULL, NULL, '실점'),
(18, 69, NULL, NULL, '실점'),
(18, 70, 6, 6, '득점'),
(18, 70, 4, NULL, '득점'),
(18, 71, 1, NULL, '득점'),
(18, 72, 7, NULL, '득점'),
(18, 72, 2, NULL, '득점'),
(18, 72, NULL, NULL, '실점'),
(20, 78, NULL, NULL, '실점'),
(20, 79, 11, 11, '득점'),
(20, 79, 11, 10, '득점'),
(20, 80, 1, NULL, '득점'),
(20, 80, 10, NULL, '득점');

INSERT INTO positions (tactics, name, description, top_coordinate, left_coordinate)
VALUES
-- 4-4-2 Formation
('4-4-2', 'GK', 'Goalkeeper', 90, 50), 
('4-4-2', 'RB', 'Right Back', 70, 80),
('4-4-2', 'RCB', 'Right Center Back', 70, 60),
('4-4-2', 'LCB', 'Left Center Back', 70, 40),
('4-4-2', 'LB', 'Left Back', 70, 20),
('4-4-2', 'RM', 'Right Midfielder', 45, 80),
('4-4-2', 'RCM', 'Right Central Midfielder', 45, 60),
('4-4-2', 'LCM', 'Left Central Midfielder', 45, 40),
('4-4-2', 'LM', 'Left Midfielder', 45, 20),
('4-4-2', 'RST', 'Right Striker', 20, 60),
('4-4-2', 'LST', 'Left Striker', 20, 40),

-- 4-3-3 Formation
('4-3-3', 'GK', 'Goalkeeper', 90, 50), 
('4-3-3', 'RB', 'Right Back', 70, 80),
('4-3-3', 'RCB', 'Right Center Back', 70, 60),
('4-3-3', 'LCB', 'Left Center Back', 70, 40),
('4-3-3', 'LB', 'Left Back', 70, 20),
('4-3-3', 'CDM', 'Central Defensive Midfielder', 45, 50),
('4-3-3', 'RCM', 'Right Central Midfielder', 45, 70),
('4-3-3', 'LCM', 'Left Central Midfielder', 45, 30),
('4-3-3', 'RW', 'Right Winger', 20, 70),
('4-3-3', 'LW', 'Left Winger', 20, 30),
('4-3-3', 'CF', 'Center Forward', 20, 50),

-- 3-5-2 Formation
('3-5-2', 'GK', 'Goalkeeper', 90, 50), 
('3-5-2', 'LCB', 'Left Center Back', 70, 20),
('3-5-2', 'CCB', 'Center Center Back', 70, 50),
('3-5-2', 'RCB', 'Right Center Back', 70, 80),
('3-5-2', 'LWB', 'Left Wing Back', 30, 20),
('3-5-2', 'RWB', 'Right Wing Back', 30, 80),
('3-5-2', 'CDM', 'Central Defensive Midfielder', 50, 50),
('3-5-2', 'CLM', 'Central Left Midfielder', 30, 40),
('3-5-2', 'CRM', 'Central Right Midfielder', 30, 60),
('3-5-2', 'LST', 'Left Striker', 10, 35),
('3-5-2', 'RST', 'Right Striker', 10, 65),

-- 4-2-3-1 Formation
('4-2-3-1', 'GK', 'Goalkeeper', 90, 50), 
('4-2-3-1', 'RB', 'Right Back', 70, 80),
('4-2-3-1', 'RCB', 'Right Center Back', 70, 60),
('4-2-3-1', 'LCB', 'Left Center Back', 70, 40),
('4-2-3-1', 'LB', 'Left Back', 70, 20),
('4-2-3-1', 'RCDM', 'Right Central Defensive Midfielder', 50, 65),
('4-2-3-1', 'LCDM', 'Left Central Defensive Midfielder', 50, 35),
('4-2-3-1', 'RAM', 'Right Attacking Midfielder', 30, 70),
('4-2-3-1', 'CAM', 'Central Attacking Midfielder', 30, 50),
('4-2-3-1', 'LAM', 'Left Attacking Midfielder', 30, 30),
('4-2-3-1', 'ST', 'Striker', 10, 50),

-- 4-1-4-1 Formation
('4-1-4-1', 'GK', 'Goalkeeper', 90, 50), 
('4-1-4-1', 'RB', 'Right Back', 70, 80),
('4-1-4-1', 'RCB', 'Right Center Back', 70, 60),
('4-1-4-1', 'LCB', 'Left Center Back', 70, 40),
('4-1-4-1', 'LB', 'Left Back', 70, 20),
('4-1-4-1', 'CDM', 'Central Defensive Midfielder', 50, 50),
('4-1-4-1', 'RAM', 'Right Attacking Midfielder', 30, 80),
('4-1-4-1', 'RCAM', 'Right Central Attacking Midfielder', 30, 60),
('4-1-4-1', 'LCAM', 'Left Central Attacking Midfielder', 30, 40),
('4-1-4-1', 'LAM', 'Left Attacking Midfielder', 30, 20),
('4-1-4-1', 'ST', 'Striker', 10, 50),

-- 3-4-3 Formation
('3-4-3', 'GK', 'Goalkeeper', 90, 50), 
('3-4-3', 'LCB', 'Left Center Back', 70, 20),
('3-4-3', 'CCB', 'Center Center Back', 70, 50),
('3-4-3', 'RCB', 'Right Center Back', 70, 80),
('3-4-3', 'LWB', 'Left Wing Back', 45, 20),
('3-4-3', 'RWB', 'Right Wing Back', 45, 80),
('3-4-3', 'LCM', 'Left Central Midfielder', 45, 40),
('3-4-3', 'RCM', 'Right Central Midfielder', 45, 60),
('3-4-3', 'LW', 'Left Winger', 20, 20),
('3-4-3', 'RW', 'Right Winger', 20, 80),
('3-4-3', 'CF', 'Center Forward', 20, 50),

-- 5-4-1 Formation
('5-4-1', 'GK', 'Goalkeeper', 90, 50), 
('5-4-1', 'LB', 'Left Back', 70, 15),
('5-4-1', 'LCB', 'Left Center Back', 70, 31),
('5-4-1', 'CCB', 'Center Center Back', 70, 49),
('5-4-1', 'RCB', 'Right Center Back', 70, 67),
('5-4-1', 'RB', 'Right Back', 70, 85),
('5-4-1', 'LM', 'Left Midfielder', 45, 20),
('5-4-1', 'LCM', 'Left Central Midfielder', 45, 40),
('5-4-1', 'RCM', 'Right Central Midfielder', 45, 60),
('5-4-1', 'RM', 'Right Midfielder', 45, 80),
('5-4-1', 'ST', 'Striker', 20, 50),

-- 5-3-2 Formation
('5-3-2', 'GK', 'Goalkeeper', 90, 50), 
('5-3-2', 'LB', 'Left Back', 70, 15), 
('5-3-2', 'LCB', 'Left Center Back', 70, 31),
('5-3-2', 'CCB', 'Center Center Back', 70, 49),
('5-3-2', 'RCB', 'Right Center Back', 70, 67),
('5-3-2', 'RB', 'Right Back', 70, 85),
('5-3-2', 'LCM', 'Left Central Midfielder', 45, 20),
('5-3-2', 'CM', 'Central Midfielder', 45, 50),
('5-3-2', 'RCM', 'Right Central Midfielder', 45, 80),
('5-3-2', 'LST', 'Left Striker', 20, 35),
('5-3-2', 'RST', 'Right Striker', 20, 65);


-- quarters_lineup 데이터 삽입
INSERT INTO quarters_lineup (player_idx, quarter_idx, position_idx, lineup_status)

select		
		t2.player_idx,
		t1.quarter_idx,			
		t1.position_idx,
		'선발'as lineup_status
from
(
	select
			q.*,
			p.position_idx,			
			ROW_NUMBER() OVER () AS row_num
	from quarters q
		join positions p on q.tactics = p.tactics
) t1
JOIN
(
	select 
			*,
	        ROW_NUMBER() OVER () AS row_num
	from
	(
		SELECT player_idx
	    FROM (
	        SELECT generate_series(1, 11) AS player_idx, repeat_num
	        FROM generate_series(1, 80) AS repeat_num
	    ) AS repeated_series
	) a
) t2 on t1.row_num = t2.row_num

union all

select		
		t2.player_idx,
		t1.quarter_idx,			
		null as position_idx,
		'후보' as lineup_status
from
(
	select
			q.*,					
			ROW_NUMBER() OVER () AS row_num
	from quarters q, (
			SELECT generate_series(12, 13) AS player_idx	        
    ) a
) t1
JOIN
(
	select 
			*,
	        ROW_NUMBER() OVER () AS row_num
	from
	(
		SELECT player_idx
	    FROM (
	        SELECT generate_series(12, 13) AS player_idx, repeat_num
	        FROM generate_series(1, 80) AS repeat_num
	    ) AS repeated_series
	) a
) t2 on t1.row_num = t2.row_num

union all

select		
		t2.player_idx,
		t1.quarter_idx,			
		t1.position_idx,
		'선발'as lineup_status
from
(
	select
			q.*,
			p.position_idx,			
			ROW_NUMBER() OVER () AS row_num
	from quarters q
		join positions p on q.tactics = p.tactics
	where quarter_idx > 80
		and quarter_idx <= 84
) t1
JOIN
(
	select 
			*,
	        ROW_NUMBER() OVER () AS row_num
	from
	(
		SELECT player_idx
	    FROM (
	        SELECT generate_series(1, 11) AS player_idx, repeat_num
	        FROM generate_series(1, 4) AS repeat_num
	    ) AS repeated_series
	) a
) t2 on t1.row_num = t2.row_num
order by quarter_idx, player_idx;

INSERT INTO mvp (mvp_idx, year, player_idx, position_type, mvp_image_url, main_title) VALUES
(1, 2025, 26, '키퍼', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/member/mvp/2025/26.jpeg', '막내키퍼'),
(2, 2025, 16, '수비', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/member/mvp/2025/16.jpeg', '투지&안정감'),
(3, 2025, 11, '미드', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/member/mvp/2025/11.jpeg', '나이를 잊은 체력'),
(4, 2025, 4, '공격', 'https://kr.object.ncloudstorage.com/coolman-storage/prod/member/mvp/2025/4.jpeg', '명불허전 골잡이');

INSERT INTO mvp_comment (comment_idx, mvp_idx, description) VALUES
(1, 1, '막내(전문키퍼 귀하거등요,,,)'),
(2, 1, '우리 막내'),
(3, 1, '어린데 성실하고 묵묵히 잘함'),
(4, 1, '우리 1번키퍼'),
(5, 1, '팀 넘버원 키퍼'),
(6, 1, '잘다녀와'),
(7, 1, '몸을 아끼지 않는 투지'),
(8, 1, '성실'),
(9, 1, '잘함'),
(10, 1, '막내 키퍼'),
(11, 1, '엄청난 선방력'),
(12, 1, '최다경기출장'),
(13, 1, '선방 잘하고 킥도 좋아짐'),
(14, 1, '실점이 많아서 하기 싫을만도 한데 열심히 하는 모습이 보기 좋음'),
(15, 1, '잘함'),

(16, 2, '있고 없고 차이가 큼'),
(17, 2, '잘해서'),
(18, 2, '든든함'),
(19, 2, '잘함.'),
(20, 2, '투지'),
(21, 2, '안정적인 센터백!!'),
(22, 2, '빌드업 Good'),
(23, 2, '헤딩'),

(24, 3, '나이를 잊은 체력'),
(25, 3, '분위기메이커'),
(26, 3, '"활동량 goat, 슛 날리고 자책하기 goat, 팀에 대한 애정도 goat"'),
(27, 3, '잘함'),
(28, 3, '우리 필드에서 제일 많이 뛰는사람 누구??'),
(29, 3, '대지를 가르는 공간 로밍 패스!!'),
(30, 3, '최다경기출장'),
(31, 3, '고민했지만 활동량, 사기진작을 잘 이끌어냄'),
(32, 3, '뛰어난 소통과 지시, 파이팅'),
(33, 3, '높은 활동량과 날카로운 패스로 팀의 공격과 수비에 큰 기여를 했다.'),
(34, 3, '경기 조율 및 패스가 좋습니다'),

(35, 4, '골을 잘넣음'),
(36, 4, '1득점루트'),
(37, 4, '노들의 형의 것'),
(38, 4, '골잡이'),
(39, 4, '골하면 이분이죠!!!'),
(40, 4, '명불허전 골잡이'),
(41, 4, '최다경기출장'),
(42, 4, '참석률도 높으시고 이타적, 기록이 압도적..!'),
(43, 4, '골결정력 좋음'),
(44, 4, '골은 포워드의 꽃'),
(45, 4, '많은 득점과 결정력'),
(46, 4, '매 순간 골 기회를 놓치지 않으며, 꾸준한 경기력으로 득점을 만들어냈다.'),
(47, 4, '골 잘 넣음')
;

-- 🔹 updated_at 자동 갱신 함수 (업데이트 발생 시 항상 NOW() 적용)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 🔹 각 테이블에 트리거 추가
CREATE TRIGGER trigger_update_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_matches
BEFORE UPDATE ON matches
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_quarters
BEFORE UPDATE ON quarters
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_goals
BEFORE UPDATE ON goals
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_positions
BEFORE UPDATE ON positions
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_quarters_lineup
BEFORE UPDATE ON quarters_lineup
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_mvp
BEFORE UPDATE ON mvp
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_mvp_comment
BEFORE UPDATE ON mvp_comment
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Accounting tables
CREATE TABLE IF NOT EXISTS member_types (
    type_idx    SERIAL PRIMARY KEY,
    user_idx    INT NOT NULL REFERENCES users(user_idx) ON DELETE CASCADE,
    year        INT NOT NULL,
    month       INT NOT NULL,
    member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('정회원','월회원','휴회원','탈퇴회원')),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL,
    UNIQUE (user_idx, year, month)
);

CREATE TABLE IF NOT EXISTS accounting_records (
    record_idx  SERIAL PRIMARY KEY,
    user_idx    INT NOT NULL REFERENCES users(user_idx) ON DELETE CASCADE,
    dt          DATE NOT NULL,
    fee_type    VARCHAR(20) NOT NULL CHECK (fee_type IN ('분기회비','월회비','휴회비','휴회경기참가비')),
    amount      INT NOT NULL DEFAULT 0,
    paid_amount INT NOT NULL DEFAULT 0,
    note        TEXT NULL,
    match_idx   INT NULL REFERENCES matches(match_idx) ON DELETE SET NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NULL
);

CREATE TRIGGER trigger_update_member_types
BEFORE UPDATE ON member_types
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_update_accounting_records
BEFORE UPDATE ON accounting_records
FOR EACH ROW EXECUTE FUNCTION update_timestamp();
