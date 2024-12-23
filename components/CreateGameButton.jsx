import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

export function CreateGameButton() {
  const navigate = useNavigate();

  const handleCreateGame = () => {
    const gameId = uuidv4();
    navigate(`/${gameId}`);
  };

  return (
    <button
      onClick={handleCreateGame}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      Create New Game
    </button>
  );
}
