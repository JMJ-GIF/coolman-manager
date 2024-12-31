import React from "react";
import { useParams } from "react-router-dom";

function MatchDetails() {
    const { id } = useParams(); // URL에서 id 파라미터 추출

    return (
        <div>
            <h1>Match Details</h1>
            <p>Details for Match ID: {id}</p>
            {/* 필요한 데이터를 추가적으로 표시 */}
        </div>
    );
}

export default MatchDetails;
