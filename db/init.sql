-- 사용자 생성 (존재 여부 확인 후 생성)
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'jmj') THEN
      CREATE ROLE jmj WITH LOGIN PASSWORD 'a12345';
      ALTER ROLE jmj CREATEDB;

   END IF;
END
$$;

-- 데이터베이스 생성 (존재 여부 확인)
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'coolman') THEN
      CREATE DATABASE coolman OWNER jmj;
   END IF;
END
$$;

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);
CREATE TABLE IF NOT EXISTS quarters (
    quarter_idx SERIAL PRIMARY KEY,          
    match_idx INT NOT NULL,                  
    quarter_number INT NOT NULL,
    tactics VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             
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
    FOREIGN KEY (match_idx) REFERENCES matches (match_idx) ON DELETE CASCADE,
    FOREIGN KEY (quarter_idx) REFERENCES quarters (quarter_idx) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS positions (
    position_idx SERIAL PRIMARY KEY,               
    tactics VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL,
    top_coordinate INT NOT NULL,
    left_coordinate INT NOT NULL   
);
CREATE TABLE IF NOT EXISTS quarters_lineup (
    lineup_idx SERIAL PRIMARY KEY,
    player_idx INT NOT NULL,
    quarter_idx INT NOT NULL, 
    position_idx INT NULL,
    lineup_status VARCHAR(20) NOT NULL CHECK (lineup_status IN ('선발', '후보')),   
    FOREIGN KEY (quarter_idx) REFERENCES quarters (quarter_idx) ON DELETE CASCADE
);

-- 8RI4g6BlISEiGG8dXsbJgzckc9j_hgH9ZEGRGqXGvzk
-- 기본 데이터 삽입
INSERT INTO users (name, position, back_number, join_date, role, social_uuid) VALUES
('홍길동','GK', 9, '2022-01-10 10:00:00', '선수', '1'),
('김철수','CB', 5, '2022-02-15 11:30:00', '선수', '2'),
('이영희','RM', 8, '2023-03-12 14:45:00', '선수', '3'),
('박민준','ST', 1, '2023-04-20 09:20:00', '선수', '4'),
('최예림','ST', 11, '2021-05-25 16:10:00', '선수', '5'),
('정수현','LB', 6, '2022-06-18 13:40:00', '선수', '6'),
('윤지훈','RB', 4, '2023-07-22 12:50:00', '선수', '7'),
('안도현','RWB', 15, '2021-08-30 15:00:00', '감독', '8'),
('서유리','ST', 10, '2022-09-15 10:05:00', '선수', '9'),
('장준호','RW', 22, '2023-10-05 17:25:00', '감독', '10'),
('진민제','RW', 35, '2023-10-05 17:25:00', '선수', 'xx'),
('장준호','ST', 99, '2023-11-01 15:15:00', '선수', '11'),
('용병','GK', 00, '2023-11-02 15:15:00', '용병', '12');

INSERT INTO matches (dt, result, winning_point, losing_point, opposing_team, location, start_time, end_time, weather, num_players, main_tactics, status)
VALUES 
('2024-12-01', '승리', 3, 1, '라이벌 FC', '국립 경기장', '2024-12-01 15:00:00', '2024-12-01 16:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-02', '패배', 2, 3, '승리 클럽', '시티 아레나', '2024-12-02 18:00:00', '2024-12-02 19:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2024-12-03', '무승부', 2, 2, '레전드 FC', '메트로 스타디움', '2024-12-03 20:00:00', '2024-12-03 21:45:00', '구름', 22, '3-5-2', 'Confirmed'),
('2024-12-04', '승리', 4, 0, '라이벌 FC', '중앙 공원 필드', '2024-12-04 14:00:00', '2024-12-04 15:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-05', '패배', 1, 2, '라이벌 FC', '해안 스타디움', '2024-12-05 19:00:00', '2024-12-05 20:45:00', '바람', 22, '4-4-2', 'Confirmed'),
('2024-12-06', '승리', 3, 1, '내맘대로 FC', '그랜드 아레나', '2024-12-06 16:00:00', '2024-12-06 17:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-07', '승리', 2, 1, '이글스 클럽', '이스트사이드 필드', '2024-12-07 17:00:00', '2024-12-07 18:45:00', '맑음', 22, '3-4-3', 'Confirmed'),
('2024-12-08', '무승부', 1, 1, '내맘대로 FC', '구시가지 스타디움', '2024-12-08 15:00:00', '2024-12-08 16:45:00', '구름', 22, '5-3-2', 'Confirmed'),
('2024-12-09', '패배', 1, 2, '워리어스 FC', '노스사이드 아레나', '2024-12-09 18:00:00', '2024-12-09 19:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2024-12-10', '승리', 5, 3, '샤크스 팀', '코스탈 필드', '2024-12-10 16:00:00', '2024-12-10 17:45:00', '바람', 22, '3-5-2', 'Confirmed'),
('2024-12-11', '승리', 2, 0, '돌핀스 FC', '아일랜드 아레나', '2024-12-11 14:00:00', '2024-12-11 15:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-12', '패배', 0, 3, '워리어스 FC', '마운틴 필드', '2024-12-12 19:00:00', '2024-12-12 20:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2024-12-13', '승리', 4, 2, '드래곤즈 FC', '리버프론트 스타디움', '2024-12-13 18:00:00', '2024-12-13 19:45:00', '맑음', 22, '3-4-3', 'Confirmed'),
('2024-12-14', '무승부', 3, 3, '워리어스 FC', '그랜드 아레나', '2024-12-14 20:00:00', '2024-12-14 21:45:00', '구름', 22, '4-2-3-1', 'Confirmed'),
('2024-12-15', '패배', 1, 2, '나이츠 FC', '중앙 스타디움', '2024-12-15 15:00:00', '2024-12-15 16:45:00', '비', 22, '4-3-3', 'Confirmed'),
('2024-12-16', '승리', 3, 1, '워리어스 FC', '국립 경기장', '2024-12-16 17:00:00', '2024-12-16 18:45:00', '맑음', 22, '4-4-2', 'Confirmed'),
('2024-12-17', '패배', 0, 1, '타이탄스 FC', '시티 아레나', '2024-12-17 18:00:00', '2024-12-17 19:45:00', '구름', 22, '3-5-2', 'Confirmed'),
('2024-12-18', '승리', 5, 2, '내맘대로 FC', '코스탈 필드', '2024-12-18 16:00:00', '2024-12-18 17:45:00', '바람', 22, '4-3-3', 'Confirmed'),
('2024-12-19', '무승부', 0, 0, '불스 클럽', '해안 스타디움', '2024-12-19 19:00:00', '2024-12-19 20:45:00', '비', 22, '5-4-1', 'Confirmed'),
('2024-12-20', '승리', 4, 1, '내맘대로 FC', '그랜드 아레나', '2024-12-20 14:00:00', '2024-12-20 15:45:00', '맑음', 22, '4-2-3-1', 'Confirmed'),
('2024-12-21', '승리', 4, 1, '내맘대로 FC', '그랜드 아레나', '2024-12-20 14:00:00', '2024-12-20 15:45:00', '맑음', 22, '4-2-3-1', 'Confirmed');

INSERT INTO quarters (quarter_idx, match_idx, quarter_number, tactics) VALUES
(1, 1, 1, '3-4-3'),
(2, 1, 2, '5-3-2'),
(3, 1, 3, '4-3-3'),
(4, 1, 4, '5-3-2'),
(5, 2, 1, '4-4-2'),
(6, 2, 2, '3-4-3'),
(7, 2, 3, '4-4-2'),
(8, 2, 4, '4-2-3-1'),
(9, 3, 1, '4-2-3-1'),
(10, 3, 2, '3-5-2'),
(11, 3, 3, '3-5-2'),
(12, 3, 4, '3-4-3'),
(13, 4, 1, '3-4-3'),
(14, 4, 2, '3-4-3'),
(15, 4, 3, '4-2-3-1'),
(16, 4, 4, '4-2-3-1'),
(17, 5, 1, '4-2-3-1'),
(18, 5, 2, '4-4-2'),
(19, 5, 3, '5-3-2'),
(20, 5, 4, '4-3-3'),
(21, 6, 1, '5-3-2'),
(22, 6, 2, '3-5-2'),
(23, 6, 3, '4-2-3-1'),
(24, 6, 4, '4-3-3'),
(25, 7, 1, '4-3-3'),
(26, 7, 2, '4-3-3'),
(27, 7, 3, '5-3-2'),
(28, 7, 4, '4-2-3-1'),
(29, 8, 1, '3-5-2'),
(30, 8, 2, '3-5-2'),
(31, 8, 3, '4-2-3-1'),
(32, 8, 4, '5-4-1'),
(33, 9, 1, '4-2-3-1'),
(34, 9, 2, '5-3-2'),
(35, 9, 3, '5-3-2'),
(36, 9, 4, '4-4-2'),
(37, 10, 1, '4-2-3-1'),
(38, 10, 2, '4-2-3-1'),
(39, 10, 3, '5-3-2'),
(40, 10, 4, '4-4-2'),
(41, 11, 1, '4-4-2'),
(42, 11, 2, '5-3-2'),
(43, 11, 3, '3-5-2'),
(44, 11, 4, '3-4-3'),
(45, 12, 1, '5-4-1'),
(46, 12, 2, '3-4-3'),
(47, 12, 3, '4-4-2'),
(48, 12, 4, '3-4-3'),
(49, 13, 1, '5-3-2'),
(50, 13, 2, '3-5-2'),
(51, 13, 3, '4-3-3'),
(52, 13, 4, '3-5-2'),
(53, 14, 1, '3-4-3'),
(54, 14, 2, '5-3-2'),
(55, 14, 3, '4-3-3'),
(56, 14, 4, '4-4-2'),
(57, 15, 1, '3-5-2'),
(58, 15, 2, '5-4-1'),
(59, 15, 3, '3-5-2'),
(60, 15, 4, '3-5-2'),
(61, 16, 1, '4-2-3-1'),
(62, 16, 2, '4-4-2'),
(63, 16, 3, '4-2-3-1'),
(64, 16, 4, '3-4-3'),
(65, 17, 1, '4-3-3'),
(66, 17, 2, '4-3-3'),
(67, 17, 3, '5-3-2'),
(68, 17, 4, '5-4-1'),
(69, 18, 1, '5-4-1'),
(70, 18, 2, '5-4-1'),
(71, 18, 3, '4-2-3-1'),
(72, 18, 4, '3-5-2'),
(73, 19, 1, '4-2-3-1'),
(74, 19, 2, '4-2-3-1'),
(75, 19, 3, '4-4-2'),
(76, 19, 4, '3-5-2'),
(77, 20, 1, '5-4-1'),
(78, 20, 2, '4-3-3'),
(79, 20, 3, '5-4-1'),
(80, 20, 4, '5-4-1'),
(81, 21, 1, '5-4-1'),
(82, 21, 2, '4-3-3'),
(83, 21, 3, '5-4-1'),
(84, 21, 4, '5-4-1');
INSERT INTO goals (goal_idx, match_idx, quarter_idx, goal_player_id, assist_player_id, goal_type) VALUES
(2, 1, 2, 9, 11, '득점'),
(3, 1, 3, 2, 10, '득점'),
(4, 1, 3, NULL, NULL, '실점'),
(1, 1, 4, 10, 7, '득점'),
(6, 2, 5, 7, 11, '득점'),
(7, 2, 5, NULL, NULL, '실점'),
(9, 2, 6, NULL, NULL, '실점'),
(5, 2, 7, 4, 3, '득점'),
(8, 2, 8, NULL, NULL, '실점'),
(12, 3, 9, NULL, NULL, '실점'),
(11, 3, 11, 11, 11, '득점'),
(10, 3, 12, 7, 6, '득점'),
(13, 3, 12, NULL, NULL, '실점'),
(15, 4, 13, 10, NULL, '득점'),
(17, 4, 14, 5, NULL, '득점'),
(14, 4, 16, 3, 4, '득점'),
(16, 4, 16, 4, NULL, '자살골'),
(19, 5, 17, NULL, NULL, '실점'),
(18, 5, 18, 11, 7, '득점'),
(20, 5, 20, NULL, NULL, '실점'),
(21, 6, 21, 8, NULL, '득점'),
(22, 6, 21, 11, 6, '득점'),
(24, 6, 22, NULL, NULL, '실점'),
(23, 6, 23, 3, NULL, '득점'),
(27, 7, 27, NULL, NULL, '실점'),
(25, 7, 28, 8, NULL, '득점'),
(26, 7, 28, 2, 8, '득점'),
(29, 8, 31, NULL, NULL, '실점'),
(28, 8, 32, 8, NULL, '득점'),
(30, 9, 35, 8, NULL, '득점'),
(31, 9, 36, NULL, NULL, '실점'),
(32, 9, 36, NULL, NULL, '실점'),
(33, 10, 37, 3, NULL, '득점'),
(36, 10, 37, 4, NULL, '득점'),
(38, 10, 37, NULL, NULL, '실점'),
(37, 10, 38, 11, 6, '득점'),
(40, 10, 38, NULL, NULL, '실점'),
(34, 10, 39, 11, 5, '득점'),
(35, 10, 39, 5, NULL, '득점'),
(39, 10, 40, NULL, NULL, '실점'),
(41, 11, 41, 7, NULL, '득점'),
(42, 11, 41, 9, 5, '득점'),
(45, 12, 47, NULL, NULL, '실점'),
(43, 12, 48, NULL, NULL, '실점'),
(44, 12, 48, NULL, NULL, '실점'),
(46, 13, 49, 3, NULL, '자살골'),
(48, 13, 50, 9, 2, '득점'),
(51, 13, 50, NULL, NULL, '실점'),
(47, 13, 51, 9, NULL, '자살골'),
(49, 13, 52, 2, 11, '득점'),
(50, 13, 52, NULL, NULL, '실점'),
(57, 14, 53, NULL, NULL, '실점'),
(52, 14, 55, 10, NULL, '득점'),
(53, 14, 56, 2, 7, '득점'),
(54, 14, 56, 7, NULL, '득점'),
(55, 14, 56, NULL, NULL, '실점'),
(56, 14, 56, NULL, NULL, '실점'),
(59, 15, 57, NULL, NULL, '실점'),
(58, 15, 58, 4, 10, '득점'),
(60, 15, 59, NULL, NULL, '실점'),
(64, 16, 62, NULL, NULL, '실점'),
(62, 16, 63, 3, NULL, '득점'),
(61, 16, 64, 10, 3, '득점'),
(63, 16, 64, 7, NULL, '득점'),
(65, 17, 66, NULL, NULL, '실점'),
(71, 18, 69, NULL, NULL, '실점'),
(68, 18, 70, 6, 6, '득점'),
(69, 18, 70, 4, NULL, '득점'),
(67, 18, 71, 1, NULL, '득점'),
(66, 18, 72, 7, NULL, '득점'),
(70, 18, 72, 2, NULL, '득점'),
(72, 18, 72, NULL, NULL, '실점'),
(77, 20, 78, NULL, NULL, '실점'),
(73, 20, 79, 11, 11, '득점'),
(75, 20, 79, 11, 10, '득점'),
(74, 20, 80, 1, NULL, '득점'),
(76, 20, 80, 10, NULL, '득점');
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
order by quarter_idx, player_idx