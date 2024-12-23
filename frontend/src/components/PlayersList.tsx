import { FC } from "react";

interface Player {
  name: string;
  score: number;
}

interface PlayersListProps {
  players: Record<string, Player>;
  title?: string;
  showScores?: boolean;
}

export const PlayersList: FC<PlayersListProps> = ({
  players,
  title = "Players in game:",
  showScores = true,
}) => {
  return (
    <div style={{ margin: "20px 0" }}>
      <h3>{title}</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(players).map(([id, player]) => (
          <li key={id}>
            <span>
              {player.name}
              {showScores && `: ${player.score}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
