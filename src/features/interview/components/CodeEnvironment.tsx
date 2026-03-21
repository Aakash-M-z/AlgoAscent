import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Loader2, CheckCircle2, XCircle, Info, ChevronDown } from 'lucide-react';

import { mockInterviewApi } from '../../../api/mockInterviewApi';

interface TestCase {
    input: any[];
    expectedOutput: any;
    description: string;
}

interface CodeEnvironmentProps {
    onCodeChange: (code: string) => void;
    testCases?: TestCase[];
    initialCodes?: Record<string, string>;
    question: string;
    functionName: string;
}

const LANGUAGES = [
    { id: 63, name: 'JavaScript', monaco: 'javascript' },
    { id: 71, name: 'Python', monaco: 'python' },
    { id: 62, name: 'Java', monaco: 'java' },
    { id: 54, name: 'C++', monaco: 'cpp' },
];

const CodeEnvironment: React.FC<CodeEnvironmentProps> = ({ 
    onCodeChange, 
    testCases = [], 
    initialCodes = {}, 
    question,
    functionName
}) => {
    const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
    const [code, setCode] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [output, setOutput] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'console' | 'testcases' | 'ai'>('testcases');
    const [testResults, setTestResults] = useState<any[]>([]);
    const [aiFeedback, setAiFeedback] = useState<string>('');

    // Set initial code based on language
    useEffect(() => {
        const langKey = selectedLang.monaco;
        const initial = initialCodes[langKey] || `// Write your ${selectedLang.name} code here`;
        setCode(initial);
        onCodeChange(initial);
    }, [selectedLang, initialCodes]);

    const handleLanguageChange = (langName: string) => {
        const lang = LANGUAGES.find(l => l.name === langName);
        if (lang) {
            setSelectedLang(lang);
        }
    };

    const runCode = async () => {
        setIsRunning(true);
        setActiveTab('testcases');
        setOutput(null);
        setTestResults([]);
        
        try {
            const res = await mockInterviewApi.runCode({ 
                code, 
                language: selectedLang.monaco, 
                questionText: question,
                functionName
            });
            
            setOutput(res);

            const rawStdout = res.stdout || '';
            const caseInputs = rawStdout.split('---CASE_START---').slice(1).map((c: string) => c.split('---CASE_END---')[0].trim());
            
            const results = testCases.map((tc, i) => {
                try {
                    const actualStr = caseInputs[i];
                    if (!actualStr) throw new Error("No output for this case");
                    
                    const actual = JSON.parse(actualStr);
                    const expected = tc.expectedOutput;
                    
                    // Deep compare for structured data
                    const passed = JSON.stringify(actual) === JSON.stringify(expected);

                    return {
                        ...tc,
                        actualOutput: actualStr,
                        passed,
                        status: passed ? 'Accepted' : 'Wrong Answer'
                    };
                } catch (err: any) {
                    return {
                        ...tc,
                        actualOutput: caseInputs[i] || 'Execution Error',
                        passed: false,
                        status: err.message || 'Error'
                    };
                }
            });
            
            setTestResults(results);
        } catch (error) {
            setOutput({ stderr: 'Internal execution error. Please try again.' });
        } finally {
            setIsRunning(false);
        }
    };

    const getAiFeedback = async () => {
        setIsThinking(true);
        setActiveTab('ai');
        setAiFeedback('🤖 AI is studying your code...');
        try {
            const data = await mockInterviewApi.getCodeFeedback({ question, code, language: selectedLang.name });
            setAiFeedback(data.feedback);
        } catch (error) {
            setAiFeedback('Failed to get feedback. Check connection.');
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-[#0d0d0d] overflow-hidden">
            {/* Top Control Bar */}
            <div className="flex justify-between items-center px-4 py-3 bg-[#111] border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <select 
                            value={selectedLang.name}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="appearance-none bg-[#1a1a1a] text-gray-300 text-xs font-bold px-4 h-10 pr-10 rounded-lg border border-white/10 focus:outline-none focus:border-[#D4AF37] transition-all cursor-pointer hover:border-white/20"
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.id} value={l.name} className="bg-[#1a1a1a]">{l.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none group-focus-within:text-[#D4AF37]" />
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={getAiFeedback}
                        disabled={isThinking}
                        className="flex items-center gap-2 text-[#D4AF37] hover:text-[#FFD700] text-xs font-bold px-4 h-10 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/5 transition-all disabled:opacity-50 hover:bg-[#D4AF37]/10 active:scale-95 whitespace-nowrap"
                    >
                        {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Info className="w-3.5 h-3.5" />}
                        <span>AI Review</span>
                    </button>
                    
                    <button 
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#FFD700] text-black font-bold px-4 h-10 rounded-lg transition-all disabled:opacity-50 shadow-[0_4px_15px_rgba(212,175,55,0.2)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)] active:scale-95 whitespace-nowrap"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        <span>Run Code</span>
                    </button>
                </div>
            </div>

            {/* Code Editor */}
            <div className="flex-1 flex flex-col min-h-0 min-w-0">
                <div className="flex-1 min-h-[400px] w-full relative overflow-hidden bg-[#1e1e1e] border-b border-white/5">
                    <Editor
                        height="100%"
                        width="100%"
                        language={selectedLang.monaco}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => {
                            setCode(val || '');
                            onCodeChange(val || '');
                        }}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineHeight: 24,
                            padding: { top: 16, bottom: 16 },
                            scrollbar: {
                                verticalScrollbarSize: 10,
                                horizontalScrollbarSize: 10,
                                vertical: 'visible',
                                horizontal: 'visible'
                            },
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            smoothScrolling: true,
                            cursorBlinking: 'smooth',
                            cursorSmoothCaretAnimation: 'on',
                            renderLineHighlight: 'all',
                            overviewRulerBorder: false,
                            hideCursorInOverviewRuler: true,
                            scrollBeyondLastLine: false,
                        }}
                    />
                </div>

                {/* Test Result Panel */}
                <div className="mt-3 w-full bg-[#0A0A0A] flex flex-col shrink-0">
                    <div className="flex gap-6 px-6 border-b border-white/5 font-mono">
                        <button 
                            onClick={() => setActiveTab('testcases')}
                            className={`py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'testcases' ? 'text-white border-[#D4AF37]' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                        >
                            Test Results
                        </button>
                        <button 
                            onClick={() => setActiveTab('console')}
                            className={`py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'console' ? 'text-white border-[#D4AF37]' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                        >
                            Standard Output
                        </button>
                        <button 
                            onClick={() => setActiveTab('ai')}
                            className={`py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'ai' ? 'text-white border-[#D4AF37]' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
                        >
                            AI Mentoring
                        </button>
                    </div>

                    <div className="max-h-[250px] overflow-auto p-4 custom-scrollbar bg-black/20">
                        {activeTab === 'testcases' ? (
                            <div className="space-y-4">
                                {testResults.length > 0 ? (
                                    <>
                                        <div className={`p-4 rounded-xl flex items-center justify-between mb-4 border ${testResults.every(r => r.passed) ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                            <div className="flex items-center gap-3 font-bold text-sm">
                                                {testResults.every(r => r.passed) ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                                <span>{testResults.filter(r => r.passed).length}/{testResults.length} Test Cases Passed</span>
                                            </div>
                                        </div>

                                        {testResults.map((res, i) => (
                                            <div key={i} className={`bg-[#111] rounded-xl p-4 border transition-all ${res.passed ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Case {i + 1}</span>
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded flex items-center gap-2 ring-1 ${res.passed ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-red-500/10 text-red-400 ring-red-500/20'}`}>
                                                        {res.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-gray-600 font-bold uppercase">Input</p>
                                                        <code className="block bg-black p-3 rounded-lg text-xs text-blue-300 font-mono border border-white/5">{JSON.stringify(res.input)}</code>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-gray-600 font-bold uppercase">Expected</p>
                                                        <code className="block bg-black p-3 rounded-lg text-xs text-green-300 font-mono border border-white/5">{JSON.stringify(res.expectedOutput)}</code>
                                                    </div>
                                                </div>
                                                {!res.passed && (
                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <p className="text-[10px] font-bold uppercase text-red-500 mb-2">Wrong Answer / Output</p>
                                                        <code className="block p-3 rounded-lg text-xs font-mono bg-red-500/5 border border-red-500/10 text-red-300">
                                                            {res.actualOutput}
                                                        </code>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-600 opacity-30">
                                        <Info className="w-8 h-8 mb-2" />
                                        <p className="text-xs uppercase font-black tracking-widest">Run code to see test results</p>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'console' ? (
                             <div className="font-mono text-sm">
                                {output ? (
                                    <div className="space-y-4">
                                        {(output.stdout || '').replace(/---CASE_START---[\s\S]*?---CASE_END---/g, '') && (
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Standard Output</p>
                                                <pre className="text-gray-300 whitespace-pre-wrap bg-black/40 p-3 rounded-lg">{(output.stdout || '').replace(/---CASE_START---[\s\S]*?---CASE_END---/g, '')}</pre>
                                            </div>
                                        )}
                                        {output.stderr && (
                                            <div>
                                                <p className="text-[10px] text-red-500 font-bold uppercase mb-1">Standard Error</p>
                                                <pre className="text-red-400 whitespace-pre-wrap bg-red-500/5 p-3 rounded-lg border border-red-500/10">{output.stderr}</pre>
                                            </div>
                                        )}
                                        {output.compile_output && (
                                            <div>
                                                <p className="text-[10px] text-amber-500 font-bold uppercase mb-1">Compile Output</p>
                                                <pre className="text-amber-400 whitespace-pre-wrap bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">{output.compile_output}</pre>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-xs italic">No output yet. Click "Run Code" to execute.</p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-[#D4AF37]/5 border-l-2 border-[#D4AF37] p-4 rounded-r-xl">
                                <p className="text-[10px] font-black text-[#D4AF37] uppercase mb-1 tracking-widest">AI Mentor Insight</p>
                                <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                    {aiFeedback || 'Submit your code for AI review to get personalized optimization tips.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeEnvironment;
