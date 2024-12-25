import { useState, useEffect } from "react";
import { WordsList } from "./WordsList";
import { PlayersList } from "./PlayersList";

interface RoundStartedStateProps {
  secretWord?: string;
  susPlayer?: string;
  playerId: string;
  words?: string[];
  players: Record<string, { name: string; score: number }>;
  onTransitionToVoting: () => void;
  onSkipRound: () => void;
}

export function RoundStartedState({
  secretWord,
  susPlayer,
  playerId,
  words,
  players,
  onTransitionToVoting,
  onSkipRound,
}: RoundStartedStateProps) {
  const [countdown, setCountdown] = useState<number | null>(20);
  const [showSecretWord, setShowSecretWord] = useState(false);

  useEffect(() => {
    setCountdown(20);
    setShowSecretWord(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          setShowSecretWord(true);
          setTimeout(() => {
            setShowSecretWord(false);
            onTransitionToVoting();
          }, 3000);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTransitionToVoting, words]);

  return (
    <>
      <PlayersList players={players} />
      <div style={{ marginTop: "20px" }}>
        {countdown !== null && (
          <div style={{ fontSize: "24px", margin: "10px 0" }}>{countdown}</div>
        )}
        {showSecretWord && (
          <div style={{ fontSize: "24px", margin: "10px 0", color: "#646cff" }}>
            {susPlayer === playerId ? "you sus" : secretWord}
          </div>
        )}
      </div>

      {words && <WordsList words={words} />}

      <button onClick={onSkipRound}>Skip Round</button>
    </>
  );
}
