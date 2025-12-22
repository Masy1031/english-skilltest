import React from 'react';
import { UserState, DifficultyTier } from '../types';
import { Button } from './Button';
import { BookOpen, PenTool, Trophy, Activity } from 'lucide-react';

interface DashboardProps {
  userState: UserState;
  onStartReading: () => void;
  onStartWriting: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userState, onStartReading, onStartWriting }) => {
  
  const getTier = (level: number) => {
    if (level <= 20) return DifficultyTier.BEGINNER;
    if (level <= 40) return DifficultyTier.INTERMEDIATE;
    return DifficultyTier.ADVANCED;
  };

  const tier = getTier(userState.level);
  const progressPercent = (userState.xp / userState.xpToNextLevel) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back, Engineer</h1>
            <p className="text-slate-500 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              Level {userState.level} <span className="text-slate-300">|</span> <span className="font-medium text-brand-600">{tier}</span>
            </p>
          </div>
          <div className="w-full md:w-64">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>XP Progress</span>
              <span>{userState.xp} / {userState.xpToNextLevel}</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer" onClick={onStartReading}>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Reading Comprehension</h2>
          <p className="text-slate-500 mb-6">Analyze technical emails, documentation, and chat logs from overseas teams.</p>
          <Button className="w-full" onClick={onStartReading}>Start Reading Exercise</Button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer" onClick={onStartWriting}>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <PenTool className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Technical Writing</h2>
          <p className="text-slate-500 mb-6">Draft responses to simulated scenarios. Get AI grading on tone, clarity, and grammar.</p>
          <Button variant="secondary" className="w-full" onClick={onStartWriting}>Start Writing Exercise</Button>
        </div>
      </div>

      {/* Recent History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-slate-400" />
          Recent Activity
        </h3>
        {userState.history.length === 0 ? (
          <p className="text-slate-400 text-sm italic">No exercises completed yet. Start one above!</p>
        ) : (
          <div className="space-y-3">
            {userState.history.slice().reverse().slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${entry.type === 'reading' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                  <span className="font-medium text-slate-700 capitalize">{entry.type}</span>
                  <span className="text-xs text-slate-400">Level {entry.level}</span>
                </div>
                <span className={`font-bold ${entry.score >= 80 ? 'text-green-600' : 'text-slate-600'}`}>
                  {entry.score}/100
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};