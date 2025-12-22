import React, { useState, useEffect } from 'react';
import { generateReadingExercise } from '../services/geminiService';
import { ReadingExercise } from '../types';
import { Button } from './Button';
import { ArrowLeft, CheckCircle, XCircle, Mail } from 'lucide-react';

interface ReadingViewProps {
  level: number;
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({ level, onComplete, onExit }) => {
  const [loading, setLoading] = useState(true);
  const [exercise, setExercise] = useState<ReadingExercise | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let mounted = true;
    generateReadingExercise(level)
      .then(data => {
        if (mounted) {
          setExercise(data);
          setAnswers(new Array(data.questions.length).fill(-1));
          setLoading(false);
        }
      })
      .catch(err => {
        console.error(err);
        if (mounted) setLoading(false);
      });
      
    return () => { mounted = false; };
  }, [level]);

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!exercise) return;
    setSubmitted(true);
    
    // Calculate score
    let correctCount = 0;
    exercise.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correctCount++;
    });
    
    // Auto complete after 3 seconds to let user see results
    setTimeout(() => {
        const score = Math.round((correctCount / exercise.questions.length) * 100);
        onComplete(score);
    }, 4000);
  };

  if (loading || !exercise) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Generating Level {level} content...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 animate-fade-in pb-20">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onExit} className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Reading Task</h2>
      </div>

      {/* Email Display */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <Mail className="w-5 h-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">{exercise.subject}</h3>
            <p className="text-sm text-slate-500">From: {exercise.sender}</p>
          </div>
        </div>
        <div className="p-6 md:p-8 font-mono text-sm md:text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
          {exercise.body}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {exercise.questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white p-6 rounded-xl border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-4">{qIndex + 1}. {q.question}</h4>
            <div className="space-y-2">
              {q.options.map((opt, optIndex) => {
                const isSelected = answers[qIndex] === optIndex;
                const isCorrect = submitted && q.correctIndex === optIndex;
                const isWrong = submitted && isSelected && q.correctIndex !== optIndex;

                let btnClass = "w-full text-left p-3 rounded-lg border-2 transition-all ";
                if (submitted) {
                    if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-700";
                    else if (isWrong) btnClass += "border-red-300 bg-red-50 text-red-700";
                    else btnClass += "border-transparent bg-slate-50 text-slate-400";
                } else {
                    if (isSelected) btnClass += "border-brand-500 bg-brand-50 text-brand-700";
                    else btnClass += "border-transparent bg-slate-50 hover:bg-slate-100 text-slate-600";
                }

                return (
                  <button
                    key={optIndex}
                    onClick={() => handleSelect(qIndex, optIndex)}
                    disabled={submitted}
                    className={btnClass}
                  >
                    <div className="flex justify-between items-center">
                      <span>{opt}</span>
                      {isCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className="mt-4 text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                <span className="font-bold">Explanation:</span> {q.explanation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg flex justify-center">
        <div className="w-full max-w-3xl">
            <Button 
                onClick={handleSubmit} 
                className="w-full md:w-auto md:px-12"
                disabled={submitted || answers.includes(-1)}
            >
                {submitted ? "Processing Results..." : "Submit Answers"}
            </Button>
        </div>
      </div>
    </div>
  );
};