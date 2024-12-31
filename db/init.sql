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
    user_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    position VARCHAR(20) NOT NULL,
    back_number INT UNIQUE NOT NULL,
    join_date TIMESTAMP NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('선수', '감독')),   
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
CREATE TABLE IF NOT EXISTS goals (
    goal_idx SERIAL PRIMARY KEY,               
    match_idx INT NOT NULL,                    
    goal_player_id INT,               
    assist_player_id INT,  
    goal_type VARCHAR(50) NOT NULL,            
    quarter INT NOT NULL,                      
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    FOREIGN KEY (match_idx) REFERENCES matches (match_idx) ON DELETE CASCADE 
);
CREATE TABLE IF NOT EXISTS positions (
    position_idx SERIAL PRIMARY KEY,               
    tactics VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL    
);
CREATE TABLE IF NOT EXISTS lineup (
    lineup_idx SERIAL PRIMARY KEY,               
    match_idx INT NOT NULL,
    quarter INT NOT NULL,
    tactics VARCHAR(255) NOT NULL
);
CREATE TABLE IF NOT EXISTS lineup_detail (
    player_idx INT NOT NULL,
    lineup_idx INT NOT NULL, 
    position_idx INT NOT NULL    
);


-- 기본 데이터 삽입
INSERT INTO users (user_id, name, position, back_number, join_date, role) VALUES
('user001', '홍길동', 'GK', 9, '2022-01-10 10:00:00', '선수'),
('user002', '김철수', 'CB', 5, '2022-02-15 11:30:00', '선수'),
('user003', '이영희', 'RM', 8, '2023-03-12 14:45:00', '선수'),
('user004', '박민준', 'ST', 1, '2023-04-20 09:20:00', '선수'),
('user005', '최예림', 'ST', 11, '2021-05-25 16:10:00', '선수'),
('user006', '정수현', 'LB', 6, '2022-06-18 13:40:00', '선수'),
('user007', '윤지훈', 'RB', 4, '2023-07-22 12:50:00', '선수'),
('user008', '안도현', 'RWB', 15, '2021-08-30 15:00:00', '감독'),
('user009', '서유리', 'ST', 10, '2022-09-15 10:05:00', '선수'),
('user010', '장준호', 'RW', 22, '2023-10-05 17:25:00', '감독'),
('user011', '진민제', 'RW', 35, '2023-10-05 17:25:00', '선수');
INSERT INTO matches (dt, result, winning_point, losing_point, opposing_team, location, start_time, end_time, weather, num_players, main_tactics, status)
VALUES 
('2024-12-01', '승리', 3, 1, '라이벌 FC', '국립 경기장', '2024-12-01 15:00:00', '2024-12-01 16:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-02', '패배', 2, 3, '승리 클럽', '시티 아레나', '2024-12-02 18:00:00', '2024-12-02 19:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2024-12-03', '무승부', 2, 2, '레전드 FC', '메트로 스타디움', '2024-12-03 20:00:00', '2024-12-03 21:45:00', '구름', 22, '3-5-2', 'Confirmed'),
('2024-12-04', '승리', 4, 0, '썬더볼트', '중앙 공원 필드', '2024-12-04 14:00:00', '2024-12-04 15:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-05', '패배', 1, 2, '라이언스 클럽', '해안 스타디움', '2024-12-05 19:00:00', '2024-12-05 20:45:00', '바람', 22, '4-4-2', 'Confirmed'),
('2024-12-06', '승리', 3, 1, '타이거스 FC', '그랜드 아레나', '2024-12-06 16:00:00', '2024-12-06 17:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-07', '승리', 2, 1, '이글스 클럽', '이스트사이드 필드', '2024-12-07 17:00:00', '2024-12-07 18:45:00', '맑음', 22, '3-4-3', 'Confirmed'),
('2024-12-08', '무승부', 1, 1, '피닉스 팀', '구시가지 스타디움', '2024-12-08 15:00:00', '2024-12-08 16:45:00', '구름', 22, '5-3-2', 'Confirmed'),
('2024-12-09', '패배', 1, 2, '워리어스 FC', '노스사이드 아레나', '2024-12-09 18:00:00', '2024-12-09 19:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2024-12-10', '승리', 5, 3, '샤크스 팀', '코스탈 필드', '2024-12-10 16:00:00', '2024-12-10 17:45:00', '바람', 22, '3-5-2', 'Confirmed'),
('2024-12-11', '승리', 2, 0, '돌핀스 FC', '아일랜드 아레나', '2024-12-11 14:00:00', '2024-12-11 15:45:00', '맑음', 22, '4-3-3', 'Confirmed'),
('2024-12-12', '패배', 0, 3, '파이오니어스 클럽', '마운틴 필드', '2024-12-12 19:00:00', '2024-12-12 20:45:00', '비', 22, '4-4-2', 'Confirmed'),
('2024-12-13', '승리', 4, 2, '드래곤즈 FC', '리버프론트 스타디움', '2024-12-13 18:00:00', '2024-12-13 19:45:00', '맑음', 22, '3-4-3', 'Confirmed'),
('2024-12-14', '무승부', 3, 3, '울브스 팀', '그랜드 아레나', '2024-12-14 20:00:00', '2024-12-14 21:45:00', '구름', 22, '4-2-3-1', 'Confirmed'),
('2024-12-15', '패배', 1, 2, '나이츠 FC', '중앙 스타디움', '2024-12-15 15:00:00', '2024-12-15 16:45:00', '비', 22, '4-3-3', 'Confirmed'),
('2024-12-16', '승리', 3, 1, '호크스 클럽', '국립 경기장', '2024-12-16 17:00:00', '2024-12-16 18:45:00', '맑음', 22, '4-4-2', 'Confirmed'),
('2024-12-17', '패배', 0, 1, '타이탄스 FC', '시티 아레나', '2024-12-17 18:00:00', '2024-12-17 19:45:00', '구름', 22, '3-5-2', 'Confirmed'),
('2024-12-18', '승리', 5, 2, '스톰 팀', '코스탈 필드', '2024-12-18 16:00:00', '2024-12-18 17:45:00', '바람', 22, '4-3-3', 'Confirmed'),
('2024-12-19', '무승부', 0, 0, '불스 클럽', '해안 스타디움', '2024-12-19 19:00:00', '2024-12-19 20:45:00', '비', 22, '5-4-1', 'Confirmed'),
('2024-12-20', '승리', 4, 1, '팔콘스 FC', '그랜드 아레나', '2024-12-20 14:00:00', '2024-12-20 15:45:00', '맑음', 22, '4-2-3-1', 'Confirmed');
INSERT INTO goals (match_idx, goal_player_id, assist_player_id, goal_type, quarter)
VALUES
(1, 1, 2, '득점', 1),
(1, 3, NULL, '실점', 2),
(1, 4, 5, '자살골', 3),
(1, 6, NULL, '패널티', 4),
(2, 7, 8, '득점', 1),
(2, 9, NULL, '실점', 2),
(2, 10, 1, '자살골', 3),
(2, 2, NULL, '패널티', 4),
(3, 3, 4, '득점', 1),
(3, 5, NULL, '실점', 2),
(3, 6, 7, '자살골', 3),
(3, 8, NULL, '패널티', 4),
(4, 9, 10, '득점', 1),
(4, 1, NULL, '실점', 2),
(4, 2, 3, '자살골', 3),
(4, 4, NULL, '패널티', 4),
(5, 5, 6, '득점', 1),
(5, 7, NULL, '실점', 2),
(5, 8, 9, '자살골', 3),
(5, 10, NULL, '패널티', 4),
(6, 1, 2, '득점', 1),
(6, 3, NULL, '실점', 2),
(6, 4, 5, '자살골', 3),
(6, 6, NULL, '패널티', 4),
(7, 7, 8, '득점', 1),
(7, 9, NULL, '실점', 2),
(7, 10, 1, '자살골', 3),
(7, 2, NULL, '패널티', 4);
INSERT INTO positions (tactics, name, description)
VALUES
-- 4-4-2 Formation
('4-4-2', 'GK', 'Goalkeeper'),
('4-4-2', 'RB', 'Right Back'),
('4-4-2', 'LCB', 'Left Center Back'),
('4-4-2', 'RCB', 'Right Center Back'),
('4-4-2', 'LB', 'Left Back'),
('4-4-2', 'RM', 'Right Midfielder'),
('4-4-2', 'LCM', 'Left Central Midfielder'),
('4-4-2', 'RCM', 'Right Central Midfielder'),
('4-4-2', 'LM', 'Left Midfielder'),
('4-4-2', 'LST', 'Left Striker'),
('4-4-2', 'RST', 'Right Striker'),

-- 4-3-3 Formation
('4-3-3', 'GK', 'Goalkeeper'),
('4-3-3', 'RB', 'Right Back'),
('4-3-3', 'LCB', 'Left Center Back'),
('4-3-3', 'RCB', 'Right Center Back'),
('4-3-3', 'LB', 'Left Back'),
('4-3-3', 'CDM', 'Central Defensive Midfielder'),
('4-3-3', 'CM', 'Central Midfielder'),
('4-3-3', 'CAM', 'Central Attacking Midfielder'),
('4-3-3', 'RW', 'Right Winger'),
('4-3-3', 'LW', 'Left Winger'),
('4-3-3', 'CF', 'Center Forward'),

-- 3-5-2 Formation
('3-5-2', 'GK', 'Goalkeeper'),
('3-5-2', 'LCB', 'Left Center Back'),
('3-5-2', 'CCB', 'Center Center Back'),
('3-5-2', 'RCB', 'Right Center Back'),
('3-5-2', 'RWB', 'Right Wing Back'),
('3-5-2', 'LWB', 'Left Wing Back'),
('3-5-2', 'CDM', 'Central Defensive Midfielder'),
('3-5-2', 'CM', 'Central Midfielder'),
('3-5-2', 'CAM', 'Central Attacking Midfielder'),
('3-5-2', 'LST', 'Left Striker'),
('3-5-2', 'RST', 'Right Striker'),

-- 4-2-3-1 Formation
('4-2-3-1', 'GK', 'Goalkeeper'),
('4-2-3-1', 'RB', 'Right Back'),
('4-2-3-1', 'LCB', 'Left Center Back'),
('4-2-3-1', 'RCB', 'Right Center Back'),
('4-2-3-1', 'LB', 'Left Back'),
('4-2-3-1', 'LCDM', 'Left Central Defensive Midfielder'),
('4-2-3-1', 'RCDM', 'Right Central Defensive Midfielder'),
('4-2-3-1', 'RAM', 'Right Attacking Midfielder'),
('4-2-3-1', 'CAM', 'Central Attacking Midfielder'),
('4-2-3-1', 'LAM', 'Left Attacking Midfielder'),
('4-2-3-1', 'ST', 'Striker'),

-- 3-4-3 Formation
('3-4-3', 'GK', 'Goalkeeper'),
('3-4-3', 'LCB', 'Left Center Back'),
('3-4-3', 'CCB', 'Center Center Back'),
('3-4-3', 'RCB', 'Right Center Back'),
('3-4-3', 'RWB', 'Right Wing Back'),
('3-4-3', 'LWB', 'Left Wing Back'),
('3-4-3', 'LCM', 'Left Central Midfielder'),
('3-4-3', 'RCM', 'Right Central Midfielder'),
('3-4-3', 'RW', 'Right Winger'),
('3-4-3', 'LW', 'Left Winger'),
('3-4-3', 'CF', 'Center Forward'),

-- 5-3-2 Formation
('5-3-2', 'GK', 'Goalkeeper'),
('5-3-2', 'RB', 'Right Back'),
('5-3-2', 'LCB', 'Left Center Back'),
('5-3-2', 'CCB', 'Center Center Back'),
('5-3-2', 'RCB', 'Right Center Back'),
('5-3-2', 'LB', 'Left Back'),
('5-3-2', 'CDM', 'Central Defensive Midfielder'),
('5-3-2', 'LCM', 'Left Central Midfielder'),
('5-3-2', 'RCM', 'Right Central Midfielder'),
('5-3-2', 'LST', 'Left Striker'),
('5-3-2', 'RST', 'Right Striker'),

-- 5-4-1 Formation
('5-4-1', 'GK', 'Goalkeeper'),
('5-4-1', 'RB', 'Right Back'),
('5-4-1', 'LCB', 'Left Center Back'),
('5-4-1', 'CCB', 'Center Center Back'),
('5-4-1', 'RCB', 'Right Center Back'),
('5-4-1', 'LB', 'Left Back'),
('5-4-1', 'RM', 'Right Midfielder'),
('5-4-1', 'LCM', 'Left Central Midfielder'),
('5-4-1', 'RCM', 'Right Central Midfielder'),
('5-4-1', 'LM', 'Left Midfielder'),
('5-4-1', 'ST', 'Striker');

INSERT INTO lineup (match_idx, quarter, tactics)
VALUES
(1, 1, '4-4-2'),
(1, 2, '4-3-3'),
(1, 3, '3-5-2'),
(1, 4, '4-2-3-1'),
(2, 1, '3-4-3'),
(2, 2, '5-3-2'),
(2, 3, '5-4-1'),
(2, 4, '4-4-2'),
(3, 1, '4-3-3'),
(3, 2, '3-5-2'),
(3, 3, '4-2-3-1'),
(3, 4, '3-4-3'),
(4, 1, '5-3-2'),
(4, 2, '5-4-1'),
(4, 3, '4-4-2'),
(4, 4, '4-3-3'),
(5, 1, '3-5-2'),
(5, 2, '4-2-3-1'),
(5, 3, '3-4-3'),
(5, 4, '5-3-2'),
(6, 1, '5-4-1'),
(6, 2, '4-4-2'),
(6, 3, '4-3-3'),
(6, 4, '3-5-2'),
(7, 1, '4-2-3-1'),
(7, 2, '3-4-3'),
(7, 3, '5-3-2'),
(7, 4, '5-4-1'),
(8, 1, '4-4-2'),
(8, 2, '4-3-3'),
(8, 3, '3-5-2'),
(8, 4, '4-2-3-1'),
(9, 1, '3-4-3'),
(9, 2, '5-3-2'),
(9, 3, '5-4-1'),
(9, 4, '4-4-2'),
(10, 1, '4-3-3'),
(10, 2, '3-5-2'),
(10, 3, '4-2-3-1'),
(10, 4, '3-4-3'),
(11, 1, '5-3-2'),
(11, 2, '5-4-1'),
(11, 3, '4-4-2'),
(11, 4, '4-3-3'),
(12, 1, '3-5-2'),
(12, 2, '4-2-3-1'),
(12, 3, '3-4-3'),
(12, 4, '5-3-2'),
(13, 1, '5-4-1'),
(13, 2, '4-4-2'),
(13, 3, '4-3-3'),
(13, 4, '3-5-2'),
(14, 1, '4-2-3-1'),
(14, 2, '3-4-3'),
(14, 3, '5-3-2'),
(14, 4, '5-4-1'),
(15, 1, '4-4-2'),
(15, 2, '4-3-3'),
(15, 3, '3-5-2'),
(15, 4, '4-2-3-1'),
(16, 1, '3-4-3'),
(16, 2, '5-3-2'),
(16, 3, '5-4-1'),
(16, 4, '4-4-2'),
(17, 1, '4-3-3'),
(17, 2, '3-5-2'),
(17, 3, '4-2-3-1'),
(17, 4, '3-4-3'),
(18, 1, '5-3-2'),
(18, 2, '5-4-1'),
(18, 3, '4-4-2'),
(18, 4, '4-3-3'),
(19, 1, '3-5-2'),
(19, 2, '4-2-3-1'),
(19, 3, '3-4-3'),
(19, 4, '5-3-2'),
(20, 1, '5-4-1'),
(20, 2, '4-4-2'),
(20, 3, '4-3-3'),
(20, 4, '3-5-2');

-- lineup_detail 데이터 삽입
INSERT INTO lineup_detail (player_idx, lineup_idx, position_idx)
WITH numbered_rows AS (
    SELECT 
        *,
        ROW_NUMBER() OVER () AS row_num  
    FROM positions
),
repeated_series AS (

	select 
			*,
	        ROW_NUMBER() OVER () AS row_num
	from
	(
		SELECT player_idx
	    FROM (
	        SELECT generate_series(1, 11) AS player_idx, repeat_num
	        FROM generate_series(1, 5) AS repeat_num
	    ) AS repeated_series
	) a

),mapped_series AS (
    SELECT
        n.*,
        r.player_idx AS player_idx
    FROM numbered_rows n
    	JOIN repeated_series r
    ON n.row_num = r.row_num
)

SELECT 
		b.player_idx, a.lineup_idx , b.position_idx 
FROM 
	lineup a
	JOIN
	mapped_series b on a.tactics = b.tactics