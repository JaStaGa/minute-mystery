import React from 'react';
import styled from 'styled-components';
import type { HPDetail } from "../types";
import './GuessLog.css';

interface Props {
    targetCharacter: HPDetail;
    characters: HPDetail[];
    attempts: string[];
}

const toNum = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '' || Number.isNaN(Number(v))) return null;
    return Number(v);
};

const GuessLog: React.FC<Props> = ({ targetCharacter, characters, attempts }) => {
    return (
        <div className="guess-log-wrapper guess-log">
            <Table>
                <thead>
                    <tr>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>Name</th>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>House</th>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>Gender</th>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>Year</th>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>Hair</th>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>Ancestry</th>
                        <th style={{ color: 'white', backgroundColor: '#222' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attempts.map((attemptName, idx) => {
                        const guessedChar = characters.find(
                            c => c.name?.toLowerCase() === attemptName.toLowerCase()
                        );

                        const y = toNum(guessedChar?.yearOfBirth as unknown);
                        const t = toNum(targetCharacter.yearOfBirth as unknown);
                        const yearMatch = y !== null && t !== null && y === t;
                        const yearCell =
                            y === null || t === null ? '—' : y === t ? String(y) : `${y} ${y > t ? '↓' : '↑'}`;

                        const aliveGuess = guessedChar?.alive ?? null;
                        const aliveMatch = aliveGuess !== null && aliveGuess === targetCharacter.alive;
                        const aliveCell =
                            aliveGuess === null ? '—' : aliveGuess ? 'Alive' : 'Deceased';

                        return (
                            <tr key={`${attemptName}-${idx}`}>
                                <HintCell isMatch={Boolean(guessedChar?.name) && guessedChar!.name.toLowerCase() === targetCharacter.name.toLowerCase()}>
                                    {guessedChar?.name ?? '—'}
                                </HintCell>
                                <HintCell isMatch={guessedChar?.house === targetCharacter.house}>
                                    {guessedChar?.house ?? '—'}
                                </HintCell>
                                <HintCell isMatch={guessedChar?.gender === targetCharacter.gender}>
                                    {guessedChar?.gender ?? '—'}
                                </HintCell>
                                <HintCell isMatch={yearMatch}>
                                    {yearCell}
                                </HintCell>
                                <HintCell isMatch={guessedChar?.hairColour === targetCharacter.hairColour}>
                                    {guessedChar?.hairColour ?? '—'}
                                </HintCell>
                                <HintCell isMatch={guessedChar?.ancestry === targetCharacter.ancestry}>
                                    {guessedChar?.ancestry ?? '—'}
                                </HintCell>
                                <HintCell isMatch={aliveMatch}>
                                    {aliveCell}
                                </HintCell>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </div>
    );
};

export default GuessLog;

const Table = styled.table`
  width: 100%;
  margin: 0.5rem auto;
  border-collapse: collapse;

  th, td {
    padding: 16px 10px;
    border: 1px solid #444;
    text-align: center;
    white-space: normal;
  }

  th {
    background-color: #222;
  }

  @media (max-width: 600px) {
    th, td {
      font-size: 0.65rem;
      padding: 8px 2px;
    }
  }
`;

const HintCell = styled.td<{ isMatch: boolean }>`
  background-color: ${({ isMatch }) => (isMatch ? 'limegreen' : '#2a2a2a')};
  color: ${({ isMatch }) => (isMatch ? 'black' : 'white')};
`;