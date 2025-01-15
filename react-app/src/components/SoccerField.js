import React from "react";
import "./SoccerField.scss";
import defaultImage from "../assets/images/coolman-profile.png";

function SoccerField({ lineup }) {
    return (
        <div className="soccer-field">
            {lineup.map((player, index) => (
                <div key={index} className="player-marker"
                    style={{
                        top: `${player.top_coordinate}%`,
                        left: `${player.left_coordinate}%`,
                    }}>
                    <div className="position-label">{player.position_name}</div>
                    <div className="player-circle"
                        style={{
                            backgroundImage: `url(${player.image_url || defaultImage})`,
                        }}></div>
                    <div className="player-name">{player.user_name}</div>
                </div>
            ))}
        </div>
    );
}

export default SoccerField;
