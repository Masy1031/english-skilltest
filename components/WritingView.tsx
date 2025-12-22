import React, { useState, useEffect } from 'react';
import { generateWritingScenario, evaluateWriting } from '../services/geminiService';
import { WritingScenario, WritingFeedback } from '../types';
import { Button } from './Button';
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface WritingViewProps {
  level: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const WritingView: React.FC<WritingViewProps> = ({ level, onComplete, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [scenario, setScenario] = useState<WritingScenario | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);

  useEffect(() => {
    let mounted = true;
    generateWritingScenario(level)
      .then(data => {
        if (mounted) {
          setScenario(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [level]);

  const handleSubmit = async () => {
    if (!scenario || !userInput.trim()) return;
    setAnalyzing(true);
    
    try {
        const result = await evaluateWriting(level, scenario, userInput);
        setFeedback(result);
    } catch (error) {
        console.error("Failed to evaluate", error);
    } finally {
        setAnalyzing(false);
    }
  };

  const handleFinish = () => {
    if (feedback) {
        onComplete(feedback.score);
    }
  };

  if (loading || !scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Preparing scenario for Level {level}...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Writing Task</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Context Card */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
            <h3 className="text-indigo-900 font-semibold mb-2">Scenario</h3>
            <p className="text-indigo-800 mb-4 text-sm">{scenario.context}</p>
            
            <div className="space-y-3">
                <div>
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Goal</span>
                    <p className="text-sm text-slate-700">{scenario.goal}</p>
                </div>
                <div>
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Recipient</span>
                    <p className="text-sm text-slate-700">{scenario.recipientRole}</p>
                </div>
                <div>
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide">Key Points to Include</span>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-1">
                        {scenario.keyPoints.map((kp, i) => (
                            <li key={i}>{kp}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>

        {/* Writing Area */}
        <div className="flex flex-col">
            <label className="block text-sm font-medium text-slate-700 mb-2">Your Draft</label>
            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={!!feedback}
                placeholder="Hi Team, I wanted to discuss..."
                className="flex-1 w-full p-4 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm"
                style={{ minHeight: '300px' }}
            />
        </div>
      </div>

      {/* Feedback Section */}
      {feedback && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-8 animate-fade-in-up">
            <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <h3 className="font-bold text-lg">AI Analysis</h3>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Score:</span>
                    <span className={`text-xl font-bold ${feedback.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{feedback.score}/100</span>
                </div>
            </div>
            
            <div className="p-6 space-y-6">
                <div>
                    <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        Native Engineer Version
                    </h4>
                    <div className="bg-indigo-50 p-4 rounded-lg text-indigo-900 text-sm font-medium border border-indigo-100">
                        {feedback.improvedVersion}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Critique</h4>
                        <p className="text-sm text-slate-600 leading-relaxed">{feedback.critique}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" />
                            Key Corrections
                        </h4>
                        {feedback.grammarMistakes.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                {feedback.grammarMistakes.map((mistake, i) => (
                                    <li key={i}>{mistake}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-green-600">Great job! No major grammar errors found.</p>
                        )}
                    </div>
                </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Button onClick={handleFinish}>Complete Exercise</Button>
            </div>
        </div>
      )}

      {/* Action Bar (Only visible before feedback) */}
      {!feedback && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg flex justify-center">
            <div className="w-full max-w-4xl flex justify-end">
                <Button 
                    onClick={handleSubmit} 
                    isLoading={analyzing}
                    disabled={userInput.length < 10}
                    variant="secondary"
                    className="w-full md:w-auto px-8"
                >
                    <Send className="w-4 h-4" />
                    Submit for Review
                </Button>
            </div>
        </div>
      )}
    </div>
  );
};