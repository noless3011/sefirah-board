import React from "react";
import { useParams } from "react-router-dom";

const BoardPage: React.FC = () => {
    const params = useParams();
    const boardId = params.boardId;

    return (
        <div style={{ padding: 20 }}>
            <h1>Board</h1>
            <p>Placeholder for board {boardId ?? "unknown"}</p>
        </div>
    );
};

export default BoardPage;
