import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { motion } from 'framer-motion';

type Difficulty = 'easy' | 'amateur' | 'pro';

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [showHint, setShowHint] = useState(false);
  const [hintMove, setHintMove] = useState<string>('');

  const makeComputerMove = useCallback(() => {
    const possibleMoves = game.moves();
    if (game.isGameOver() || possibleMoves.length === 0) return;

    let move;
    switch (difficulty) {
      case 'easy':
        // Random moves
        move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        break;
      case 'amateur':
        // Basic evaluation with some randomness
        move = findBestMove(game, 2);
        break;
      case 'pro':
        // Deeper evaluation
        move = findBestMove(game, 4);
        break;
    }

    const gameCopy = new Chess(game.fen());
    gameCopy.move(move);
    setGame(gameCopy);
  }, [game, difficulty]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    try {
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;
      setGame(gameCopy);

      // Computer makes move after player
      setTimeout(makeComputerMove, 300);
      return true;
    } catch (error) {
      return false;
    }
  }

  const findBestMove = (game: Chess, depth: number): string => {
    const moves = game.moves();
    let bestMove = moves[0];
    let bestValue = -Infinity;

    moves.forEach(move => {
      const gameCopy = new Chess(game.fen());
      gameCopy.move(move);
      const value = evaluatePosition(gameCopy) + Math.random() * (depth === 2 ? 2 : 0.5);
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    });

    return bestMove;
  };

  const evaluatePosition = (game: Chess): number => {
    const pieceValues = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
      k: 0,
    };

    let value = 0;
    game.board().forEach(row => {
      row.forEach(piece => {
        if (piece) {
          const multiplier = piece.color === 'w' ? 1 : -1;
          value += pieceValues[piece.type] * multiplier;
        }
      });
    });

    return value;
  };

  const getHint = () => {
    const hint = findBestMove(game, 3);
    setHintMove(hint);
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2000);
  };

  const resetGame = () => {
    setGame(new Chess());
    setShowHint(false);
    setHintMove('');
  };

  return (
    <div className="flex flex-col bg-cyan-500 items-center justify-center  p-4">
      <div className="w-full max-w-[600px]">
        <div className="mb-6 flex justify-between items-center">
          <div className="space-x-2">
            {['easy', 'amateur', 'pro'].map((d) => (
              <button
                key={d}
                className={`difficulty-btn ${
                  difficulty === d ? 'difficulty-btn-active' : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => {
                  setDifficulty(d as Difficulty);
                  resetGame();
                }}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <button className="hint-btn" onClick={getHint}>
            Get Hint
          </button>
        </div>

        <div className="relative h-[400px]" style={{ height: '400px' }}>
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            customBoardStyle={{
              borderRadius: '4px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Suggested move: {hintMove}
            </motion.div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-lg font-semibold">
            {game.isCheckmate()
              ? 'Checkmate!'
              : game.isDraw()
              ? 'Draw!'
              : game.isCheck()
              ? 'Check!'
              : ''}
          </div>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            onClick={resetGame}
          >
            Reset Game
          </button>
        </div>
      </div>
    </div>
  );
}
