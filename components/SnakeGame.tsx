'use client';

import { useEffect, useRef, useState } from 'react';

interface SnakeGameProps {
    onClose?: () => void;
}

export default function SnakeGame({ onClose }: SnakeGameProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Game constants
        const gridSize = 20;
        const tileCount = 20;
        canvas.width = gridSize * tileCount;
        canvas.height = gridSize * tileCount;

        // Snake initial state
        let snake = [{ x: 10, y: 10 }];
        let direction = { x: 0, y: 0 };
        let lastDirection = { x: 0, y: 0 }; // Track actual last movement
        let food = { x: 15, y: 15 };
        let currentScore = 0;
        let gameRunning = false; // Don't start until first keypress

        // Generate random food position
        const generateFood = () => {
            food = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount),
            };
            // Make sure food doesn't spawn on snake
            while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
                food = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount),
                };
            }
        };

        // Handle keyboard input
        const handleKeyPress = (e: KeyboardEvent) => {
            // Restart game after game over
            if (!gameRunning && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                // Reset everything
                snake = [{ x: 10, y: 10 }];
                direction = { x: 0, y: 0 };
                lastDirection = { x: 0, y: 0 };
                currentScore = 0;
                setScore(0);
                setGameOver(false);
                generateFood();
                gameRunning = true;
            }

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    // Prevent reversing - check last actual movement, not just direction
                    if (lastDirection.y === 0) direction = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    if (lastDirection.y === 0) direction = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (lastDirection.x === 0) direction = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (lastDirection.x === 0) direction = { x: 1, y: 0 };
                    break;
                case 'Escape':
                    e.preventDefault();
                    if (onClose) {
                        gameRunning = false;
                        onClose();
                    }
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        // Game loop
        const gameLoop = () => {
            if (!gameRunning) return;

            // Move snake
            const head = {
                x: snake[0].x + direction.x,
                y: snake[0].y + direction.y,
            };

            // Update last direction AFTER we use the current direction
            if (direction.x !== 0 || direction.y !== 0) {
                lastDirection = { ...direction };
            }

            // Check wall collision
            if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
                gameRunning = false;
                setGameOver(true);
                return;
            }

            // Check self collision
            if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                gameRunning = false;
                setGameOver(true);
                return;
            }

            snake.unshift(head);

            // Check food collision
            if (head.x === food.x && head.y === food.y) {
                currentScore += 10;
                setScore(currentScore);
                generateFood();
            } else {
                snake.pop();
            }

            // Clear canvas
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw grid
            ctx.strokeStyle = '#374151';
            for (let i = 0; i <= tileCount; i++) {
                ctx.beginPath();
                ctx.moveTo(i * gridSize, 0);
                ctx.lineTo(i * gridSize, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i * gridSize);
                ctx.lineTo(canvas.width, i * gridSize);
                ctx.stroke();
            }

            // Draw food
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(
                food.x * gridSize + gridSize / 2,
                food.y * gridSize + gridSize / 2,
                gridSize / 2 - 2,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw snake
            snake.forEach((segment, index) => {
                ctx.fillStyle = index === 0 ? '#10b981' : '#34d399';
                ctx.fillRect(
                    segment.x * gridSize + 1,
                    segment.y * gridSize + 1,
                    gridSize - 2,
                    gridSize - 2
                );
            });
        };

        const intervalId = setInterval(gameLoop, 150);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, [onClose]);

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="bg-gray-800 rounded-xl p-4 shadow-2xl">
                <canvas
                    ref={canvasRef}
                    className="border-2 border-gray-600 rounded-lg"
                />
            </div>
            <div className="text-center">
                <p className="text-2xl font-bold text-white mb-1">
                    Score: {score}
                </p>
                <p className="text-sm text-gray-300">
                    {gameOver
                        ? 'Game Over! Press arrow key to restart'
                        : score === 0
                            ? 'Press any arrow key to start'
                            : 'Use arrow keys • ESC to close'
                    }
                </p>
                {gameOver && (
                    <p className="text-amber-400 font-semibold mt-2">
                        Score: {score}
                    </p>
                )}
            </div>
        </div>
    );
}
