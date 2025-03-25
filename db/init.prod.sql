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

INSERT INTO users (name, position, back_number, join_date, role, social_uuid, image_url) VALUES
('용병','GK', 0, '2023-11-02 15:15:00', '용병', '12', NULL);

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