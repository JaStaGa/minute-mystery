"use client";

import React, { useState, useEffect } from 'react';
import InputBox from './InputBox';
import GuessLog from './GuessLog';
import SilhouetteHint from './SilhouetteHint';
import type { HPDetail } from '../types';
import styled from 'styled-components';

const Link = styled.button`
  padding: 8px 18px;
  font-size: 100%;
  font-family: 'Marauders Map', serif;
  font-color: white;
  background-color: #8B5E3C;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  a {
  color: white;
  text-decoration: none;
  }
`

interface GameScreenProps {
    target: HPDetail;
    characters: HPDetail[];
    attempts: string[];
    result: 'win' | 'lose' | null;
    onGuess: (guess: string) => void;
    onRestart: () => void;
}

const ScreenMainGame: React.FC<GameScreenProps> = ({
    target,
    characters,
    attempts,
    result,
    onGuess,
    onRestart,
}) => {
    const [showSilhouette, setShowSilhouette] = useState(false);
    const [silhouetteError, setSilhouetteError] = useState('');


    useEffect(() => {
        if (result) {
            setShowSilhouette(false);
        }
    }, [result]);

    useEffect(() => {
        if (silhouetteError && attempts.length >= 4) {
            setSilhouetteError('');
        }
    }, [attempts.length, silhouetteError]);

    const handleToggleSilhouette = () => {
        if (attempts.length < 4) {
            setSilhouetteError('You need at least 4 guesses to unlock the silhouette.');
            return;
        }
        setShowSilhouette(prev => !prev);
        setSilhouetteError(''); // clear error on success
    };

    const disableSilhouetteButton = result !== null;

    return (
        <div className={"game-screen"}>
            <Link>
                <a href="https://jsg-websites.onrender.com/">All Apps</a>
            </Link>

            <h1 className="start-title">Harry Potter Guessing Game</h1>

            <InputBox
                onSubmitGuess={onGuess}
                characterNames={characters.map((c) => c.name)}
                disabled={result !== null}
                placeholder={result ? "Game Over!" : "Guess the character's name: "}
                onToggleSilhouette={handleToggleSilhouette}
                silhouetteButtonDisabled={disableSilhouetteButton}
            />

            <GuessLog
                targetCharacter={target}
                characters={characters}
                attempts={attempts}
            />

            {showSilhouette && (
                <SilhouetteHint
                    imageUrl={target.image || 'https://via.placeholder.com/150'}
                    show={true}
                />
            )}

            {silhouetteError && (
                <p style={{ color: 'red', textAlign: 'center', marginTop: '10px' }}>
                    {silhouetteError}
                </p>
            )}

            {result === 'win' && target && (
                <h2>
                    You win! The character was {target.name}.{' '}
                    <p><button className='play-button' onClick={onRestart}>Play again</button></p>
                </h2>
            )}

            {result === 'lose' && target && (
                <h2>
                    You lost. The correct answer was {target.name}.{' '}
                    <p><button className='play-button' onClick={onRestart}>Try again</button></p>
                </h2>
            )}

        </div>
    );
};


export default ScreenMainGame;