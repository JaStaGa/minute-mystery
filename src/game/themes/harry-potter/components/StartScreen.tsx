"use client";
interface StartScreenProps { onStart: () => void; }
export default function StartScreen({ onStart }: StartScreenProps) {
    return (
        <div className="marauders-container">
            <div className="main-container">
                <h1 className="start-text">Harry Potter Guessing Game</h1>
                <h2 className="start-sub">Guess the mystery character in 5 tries!</h2>
                <button className="play-button" onClick={onStart}>Start</button>
            </div>
        </div>
    );
}
