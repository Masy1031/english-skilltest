import React, { useState, useEffect } from 'react';
import { UserState, AppMode, ExerciseResult } from './types';
import { Dashboard } from './components/Dashboard';
import { ReadingView } from './components/ReadingView';
import { WritingView } from './components/WritingView';
import { Zap } from 'lucide-react';

const XP_PER_LEVEL = 100;
const MAX_LEVEL = 50;

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  
  // Initialize state from localStorage or default
  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem('techcomm-user');
    return saved ? JSON.parse(saved) : {
      level: 1,
      xp: 0,
      xpToNextLevel: XP_PER_LEVEL,
      history: []
    };
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('techcomm-user', JSON.stringify(userState));
  }, [userState]);

  const handleExerciseComplete = (score: number, type: 'reading' | 'writing') => {
    const xpGained = Math.round(score * 1.5); // 100 score = 150 XP
    
    setUserState(prev => {
      let newXp = prev.xp + xpGained;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;

      // Level up logic
      if (newXp >= newXpToNext && newLevel < MAX_LEVEL) {
        newXp = newXp - newXpToNext;
        newLevel += 1;
        // Simple scaling: each level requires slightly more XP, or flat 100 for simplicity as per MVP
        // Let's keep it flat 100 for predictable progression per spec requirement of "level up each time" roughly
      } else if (newLevel === MAX_LEVEL) {
        newXp = newXpToNext; // Cap at max
      }

      const newHistory: ExerciseResult = {
        id: Date.now().toString(),
        type,
        score,
        date: new Date().toISOString(),
        level: prev.level
      };

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        history: [...prev.history, newHistory]
      };
    });

    setMode(AppMode.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setMode(AppMode.DASHBOARD)}>
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5" fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">TechComm AI</span>
          </div>
          <div className="text-sm text-slate-500 hidden md:block">
            English for Engineering Professionals
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-8">
        {mode === AppMode.DASHBOARD && (
          <Dashboard 
            userState={userState} 
            onStartReading={() => setMode(AppMode.READING)} 
            onStartWriting={() => setMode(AppMode.WRITING)} 
          />
        )}

        {mode === AppMode.READING && (
          <ReadingView 
            level={userState.level} 
            onComplete={(score) => handleExerciseComplete(score, 'reading')}
            onExit={() => setMode(AppMode.DASHBOARD)}
          />
        )}

        {mode === AppMode.WRITING && (
          <WritingView 
            level={userState.level} 
            onComplete={(score) => handleExerciseComplete(score, 'writing')}
            onExit={() => setMode(AppMode.DASHBOARD)}
          />
        )}
      </main>
    </div>
  );
}

export default App;