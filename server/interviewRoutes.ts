import { Router } from 'express';
import mongoose from 'mongoose';
import { InterviewSessionModel } from './models.js';
import { extractBearer, verifyToken } from './jwt.js';
import axios from 'axios';

const router = Router();

// ── Auth Middleware ──────────────────────────────────────────
router.use((req, res, next) => {
    const token = extractBearer(req.headers.authorization as string || '');
    if (!token) { res.status(401).json({ error: 'Unauthorized' }); return; }
    try {
        const payload = verifyToken(token);
        (req as any).user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

interface TestCase {
    input: any[];
    expectedOutput: any;
    description: string;
}

interface Question {
    text: string;
    functionName: string;
    params: string[];
    testCases: TestCase[];
    initialCode: Record<string, string>;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    tags?: string[];
    company?: string[];
}

// ── Expanded Question Banks ──────────────────────────────────
const DSA_QUESTIONS: Question[] = [
    {
        text: "Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        functionName: "twoSum", params: ["nums", "target"], difficulty: 'Easy', tags: ['Arrays', 'Hash Map'], company: ['Google', 'Amazon', 'Microsoft'],
        testCases: [
            { input: [[2, 7, 11, 15], 9], expectedOutput: [0, 1], description: "Standard case" },
            { input: [[3, 2, 4], 6], expectedOutput: [1, 2], description: "Middle elements" },
            { input: [[3, 3], 6], expectedOutput: [0, 1], description: "Duplicates" }
        ],
        initialCode: {
            javascript: "function twoSum(nums, target) {\n    // Write your code here\n    \n}",
            python: "def twoSum(nums, target):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
            java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}"
        }
    },
    {
        text: "Valid Parentheses: Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if: open brackets are closed by the same type, open brackets are closed in the correct order, and every close bracket has a corresponding open bracket.",
        functionName: "isValid", params: ["s"], difficulty: 'Easy', tags: ['Stacks', 'Strings'], company: ['Meta', 'Amazon'],
        testCases: [
            { input: ["()[]{}"], expectedOutput: true, description: "Multiple valid pairs" },
            { input: ["(]"], expectedOutput: false, description: "Mismatch case" },
            { input: ["{[]}"], expectedOutput: true, description: "Nested pairs" }
        ],
        initialCode: {
            javascript: "function isValid(s) {\n    // Write your code here\n    \n}",
            python: "def isValid(s):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
            java: "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}"
        }
    },
    {
        text: "Maximum Subarray: Given an integer array nums, find the subarray with the largest sum and return its sum. This is the classic Kadane's Algorithm problem.",
        functionName: "maxSubArray", params: ["nums"], difficulty: 'Medium', tags: ['Arrays', 'Dynamic Programming'], company: ['Google', 'Apple', 'Bloomberg'],
        testCases: [
            { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expectedOutput: 6, description: "Standard case" },
            { input: [[1]], expectedOutput: 1, description: "Single element" },
            { input: [[5, 4, -1, 7, 8]], expectedOutput: 23, description: "All positive with one neg" }
        ],
        initialCode: {
            javascript: "function maxSubArray(nums) {\n    // Write your code here\n    \n}",
            python: "def maxSubArray(nums):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
            java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}"
        }
    },
    {
        text: "Climbing Stairs: You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
        functionName: "climbStairs", params: ["n"], difficulty: 'Easy', tags: ['Dynamic Programming', 'Memoization'], company: ['Amazon', 'Adobe', 'Uber'],
        testCases: [
            { input: [2], expectedOutput: 2, description: "2 steps = 2 ways" },
            { input: [3], expectedOutput: 3, description: "3 steps = 3 ways" },
            { input: [5], expectedOutput: 8, description: "Fibonacci pattern" }
        ],
        initialCode: {
            javascript: "function climbStairs(n) {\n    // Write your code here\n    \n}",
            python: "def climbStairs(n):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
            java: "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}"
        }
    },
    {
        text: "Merge Intervals: Given an array of intervals where intervals[i] = [starti, endi], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
        functionName: "merge", params: ["intervals"], difficulty: 'Medium', tags: ['Arrays', 'Sorting'], company: ['Google', 'LinkedIn', 'Microsoft'],
        testCases: [
            { input: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expectedOutput: [[1, 6], [8, 10], [15, 18]], description: "Standard overlapping" },
            { input: [[[1, 4], [4, 5]]], expectedOutput: [[1, 5]], description: "Touching intervals" }
        ],
        initialCode: {
            javascript: "function merge(intervals) {\n    // Write your code here\n    \n}",
            python: "def merge(intervals):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        \n    }\n};",
            java: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        \n    }\n}"
        }
    },
    {
        text: "Reverse a Linked List: Given the head of a singly linked list, reverse the list, and return the reversed list.",
        functionName: "reverseList", params: ["head"], difficulty: 'Easy', tags: ['Linked List', 'Recursion'], company: ['Amazon', 'Microsoft', 'Apple'],
        testCases: [
            { input: [[1, 2, 3, 4, 5]], expectedOutput: [5, 4, 3, 2, 1], description: "Standard reversal" },
            { input: [[1, 2]], expectedOutput: [2, 1], description: "Two elements" }
        ],
        initialCode: {
            javascript: "function reverseList(head) {\n    // Write your code here\n    \n}",
            python: "def reverseList(head):\n    # Write your code here\n    pass",
            cpp: "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
            java: "class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}"
        }
    },
];

const SYSTEM_DESIGN_QUESTIONS: Question[] = [
    {
        text: "Design URL Shortener: Design a URL shortening service like bit.ly. The system should be able to generate a unique short URL for any given long URL, redirect users to the original URL, handle high traffic (100M+ daily requests), and optionally track analytics like click counts. Discuss: API design, database schema, hashing strategy, and scalability approach.",
        functionName: "design", params: [], testCases: [], difficulty: 'Medium', tags: ['System Design', 'Scalability'],
        company: ['Google', 'Meta', 'Amazon'],
        initialCode: {
            javascript: "// System Architecture Notes:\n// Key Components:\n// 1. API Layer:\n// 2. Hashing Strategy:\n// 3. Database Schema:\n// 4. Caching Layer:\n// 5. Scalability Considerations:\n",
            python: "# System Architecture Notes:\n# Key Components:\n# 1. API Layer:\n# 2. Hashing Strategy:\n# 3. Database Schema:\n# 4. Caching Layer:\n# 5. Scalability Considerations:\n"
        }
    },
    {
        text: "Design a Rate Limiter: Design a distributed rate limiter that can handle millions of requests per second across multiple servers. It must support per-user, per-IP, and per-endpoint rate limiting. Discuss: algorithm choices (token bucket, sliding window, leaky bucket), Redis usage, cluster synchronization, and graceful degradation.",
        functionName: "design", params: [], testCases: [], difficulty: 'Hard', tags: ['System Design', 'Distributed Systems'],
        company: ['Google', 'Cloudflare', 'Netflix'],
        initialCode: {
            javascript: "// Rate Limiter Design:\n// Algorithm Choice (Token Bucket / Sliding Window / Leaky Bucket):\n// Data Store (Redis):\n// Distributed Sync:\n// API Response Headers:\n",
            python: "# Rate Limiter Design:\n# Algorithm Choice:\n# Data Store:\n# Distributed Sync:\n"
        }
    },
    {
        text: "Design Instagram Scale: Design a photo-sharing platform with 500M daily active users. The system should support: user uploads (photos/videos), feed generation (real-time + algorithmic), follow relationships, likes/comments, and push notifications. Focus on the feed generation system — pull vs push model and fan-out strategies.",
        functionName: "design", params: [], testCases: [], difficulty: 'Hard', tags: ['System Design', 'Social Media', 'Feed Systems'],
        company: ['Meta', 'Instagram', 'Snap'],
        initialCode: {
            javascript: "// Instagram-Scale Design Notes:\n// Components:\n// 1. Photo Upload Service:\n// 2. Feed Generation (Push vs Pull):\n// 3. CDN Strategy:\n// 4. Database Sharding:\n// 5. Notification System:\n",
        }
    }
];

const OS_QUESTIONS: Question[] = [
    {
        text: "Process vs Thread: Explain the difference between a process and a thread. When would you use one over the other? What are the memory isolation implications? Discuss context switching overhead and give a real-world example of where thread pooling is used in production systems.",
        functionName: "explain", params: [], testCases: [], difficulty: 'Easy', tags: ['OS', 'Concurrency'],
        company: ['Amazon', 'Google', 'Meta'],
        initialCode: {
            javascript: "// Process vs Thread - Key Points:\n// 1. Memory Model:\n// 2. Context Switching:\n// 3. Communication:\n// 4. Use Cases:\n// 5. Real-world Example:\n",
            python: "# Process vs Thread - Key Points:\n# 1. Memory Model:\n# 2. Context Switching:\n# 3. Communication:\n"
        }
    },
    {
        text: "Deadlock Prevention: What is a deadlock? Explain Coffman's four necessary conditions for deadlock. For each condition, describe a technique to prevent or break it. Include how modern OSes use banker's algorithm or resource ordering. Give an example in a multi-threaded Node.js or Java application.",
        functionName: "explain", params: [], testCases: [], difficulty: 'Medium', tags: ['OS', 'Deadlocks', 'Concurrency'],
        company: ['Microsoft', 'Oracle', 'IBM'],
        initialCode: {
            javascript: "// Deadlock Analysis:\n// Coffman's Conditions:\n// 1. Mutual Exclusion:\n// 2. Hold and Wait:\n// 3. No Preemption:\n// 4. Circular Wait:\n// Prevention Strategy:\n// Real-world Example:\n",
        }
    },
    {
        text: "Virtual Memory & Paging: Explain virtual memory and how OS paging works. What is the TLB and why is it critical for performance? What causes a page fault and how does the OS handle it? Compare demand paging vs pre-paging strategies.",
        functionName: "explain", params: [], testCases: [], difficulty: 'Hard', tags: ['OS', 'Memory Management'],
        company: ['Intel', 'AMD', 'Google'],
        initialCode: {
            javascript: "// Virtual Memory Architecture:\n// 1. Page Table Structure:\n// 2. TLB Role:\n// 3. Page Fault Handling:\n// 4. Demand Paging vs Pre-paging:\n",
        }
    }
];

const OOP_QUESTIONS: Question[] = [
    {
        text: "Design Patterns in OOP: Explain the SOLID principles with a real-world example for each. Then explain the Singleton, Factory, and Observer design patterns. For the Observer pattern, show a code example (event system, pub-sub) and explain where it's used in frameworks like React or Node.js.",
        functionName: "explain", params: [], testCases: [], difficulty: 'Medium', tags: ['OOP', 'Design Patterns', 'SOLID'],
        company: ['Google', 'Microsoft', 'SAP'],
        initialCode: {
            javascript: "// SOLID Principles:\n// S - Single Responsibility:\n// O - Open/Closed:\n// L - Liskov Substitution:\n// I - Interface Segregation:\n// D - Dependency Inversion:\n\n// Design Patterns:\n// Singleton:\n// Factory:\n// Observer:\n",
            python: "# SOLID Principles:\n# S - Single Responsibility:\n# O - Open/Closed:\n# L - Liskov Substitution:\n# I - Interface Segregation:\n# D - Dependency Inversion:\n"
        }
    },
    {
        text: "Polymorphism & Inheritance Deep Dive: Explain compile-time vs runtime polymorphism. What are the trade-offs between inheritance and composition? Give an example where inheritance causes tight coupling and refactor it using composition. Explain abstract classes vs interfaces.",
        functionName: "explain", params: [], testCases: [], difficulty: 'Easy', tags: ['OOP', 'Polymorphism', 'Inheritance'],
        company: ['Amazon', 'TCS', 'Infosys'],
        initialCode: {
            javascript: "// Polymorphism Analysis:\n// Compile-time (Method Overloading):\n// Runtime (Method Overriding):\n// Inheritance vs Composition Example:\n// Abstract Class vs Interface:\n",
        }
    }
];

const CN_QUESTIONS: Question[] = [
    {
        text: "Browser to Server Journey: What happens when you type 'https://google.com' and press Enter? Walk through: DNS resolution, TCP three-way handshake, TLS/SSL handshake, HTTP request/response, rendering pipeline. Explain how CDNs and browser caching affect this flow.",
        functionName: "explain", params: [], testCases: [], difficulty: 'Medium', tags: ['Networking', 'DNS', 'HTTP', 'TLS'],
        company: ['Google', 'CloudFlare', 'Akamai'],
        initialCode: {
            javascript: "// Browser to Google Step-by-Step:\n// 1. DNS Resolution:\n// 2. TCP Three-way Handshake:\n// 3. TLS/SSL Handshake:\n// 4. HTTP GET Request:\n// 5. Response & Rendering:\n// 6. CDN Role:\n",
        }
    },
    {
        text: "TCP vs UDP: Compare TCP and UDP at the protocol level. Explain flow control, congestion control, and reliability mechanisms in TCP. Give real-world examples where each is preferred (e.g., video streaming, game networking, financial transactions). What is QUIC and how does it improve on TCP+TLS?",
        functionName: "explain", params: [], testCases: [], difficulty: 'Medium', tags: ['Networking', 'TCP', 'UDP', 'QUIC'],
        company: ['Netflix', 'Zoom', 'Google'],
        initialCode: {
            javascript: "// TCP vs UDP Comparison:\n// TCP:\n//   - Reliability:\n//   - Flow Control:\n//   - Congestion Control:\n// UDP:\n//   - Use Cases:\n//   - Advantages:\n// QUIC Protocol:\n",
        }
    }
];

// ── Code Wrapper Generator ──────────────────────────────────
const generateWrapper = (lang: string, code: string, question: Question) => {
    const { functionName, testCases } = question;
    const testCasesJson = JSON.stringify(testCases);

    if (lang === 'python' || lang === '71') {
        return `${code}

import json, sys

def run_tests():
    test_cases = ${testCasesJson}
    if not test_cases:
        print("---CASE_START---")
        print(json.dumps("Explanation-based question passed"))
        print("---CASE_END---")
        return
    for tc in test_cases:
        try:
            actual = ${functionName}(*tc['input'])
            print("---CASE_START---")
            print(json.dumps(actual))
            print("---CASE_END---")
        except Exception as e:
            print("---CASE_START---")
            print(json.dumps({"error": str(e)}))
            print("---CASE_END---")

if __name__ == "__main__":
    run_tests()`;
    }

    if (lang === 'javascript' || lang === '63') {
        return `${code}

const testCases = ${testCasesJson};
if (!testCases || testCases.length === 0) {
    console.log("---CASE_START---");
    console.log(JSON.stringify("Explanation-based question passed"));
    console.log("---CASE_END---");
} else {
    testCases.forEach(tc => {
        try {
            const actual = ${functionName}(...tc.input);
            console.log("---CASE_START---");
            console.log(JSON.stringify(actual));
            console.log("---CASE_END---");
        } catch (e) {
            console.log("---CASE_START---");
            console.log(JSON.stringify({ error: e.message }));
            console.log("---CASE_END---");
        }
    });
}`;
    }
    return code;
};

const AI_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
const getAiConfig = () => ({
    headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
    }
});

// ── POST /api/interview/start ────────────────────────────────
router.post('/start', (req, res) => {
    const { type } = req.body;
    let questions = DSA_QUESTIONS;
    if (type === 'OS') questions = OS_QUESTIONS;
    else if (type === 'System Design') questions = SYSTEM_DESIGN_QUESTIONS;
    else if (type === 'OOP') questions = OOP_QUESTIONS;
    else if (type === 'CN') questions = CN_QUESTIONS;

    const questionData = questions[Math.floor(Math.random() * questions.length)];
    res.json({
        question: questionData.text,
        type,
        difficulty: questionData.difficulty || 'Medium',
        tags: questionData.tags || [],
        company: questionData.company || [],
        testCases: questionData.testCases || [],
        initialCode: questionData.initialCode,
        functionName: questionData.functionName
    });
});

// ── POST /api/interview/evaluate-approach ──────────────────
router.post('/evaluate-approach', async (req, res) => {
    try {
        const { question, approach } = req.body;
        const systemPrompt = `You are a senior engineer at a FAANG company conducting a technical interview.

Question: "${question}"
Candidate's Approach: "${approach}"

Evaluate the approach critically. Analyze:
1. Is the core logic sound?
2. Are the data structures appropriate and optimal?
3. What time and space complexity would this achieve?
4. Are there obvious edge cases being missed?
5. Is this brute-force, suboptimal, or near-optimal?

Respond in 3 paragraphs max. Be direct and professional. End with:
"Complexity: Time O(...), Space O(...) | Approach Rating: [Brute Force / Suboptimal / Optimal]"`;

        const apiRes = await axios.post(AI_BASE_URL, {
            model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.6,
        }, { ...getAiConfig(), timeout: 20000 });

        res.json({ evaluation: apiRes.data.choices[0].message.content });
    } catch (err: any) {
        res.status(500).json({ error: 'Approach evaluation failed' });
    }
});

import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

// ── POST /api/interview/run ─────────────────────────────────
router.post('/run', async (req, res) => {
    try {
        console.log("REQUEST:", {
            language: req.body.language,
            functionName: req.body.functionName,
            testCasesCount: req.body.testCases?.length
        });

        const { code, language, testCases, functionName } = req.body;

        if (!code || !language || !testCases || !Array.isArray(testCases)) {
            return res.status(400).json({ 
                error: "Missing required fields", 
                details: "code, language, and testCases (array) are required in request body" 
            });
        }

        if (testCases.length === 0) {
            return res.json({ results: [] });
        }

        const isJs = language === 'javascript' || language === '63';
        const isPy = language === 'python' || language === '71';

        if (!isJs && !isPy) {
            return res.status(400).json({ 
                error: "Execution failed", 
                details: "Only JavaScript and Python are supported for execution right now" 
            });
        }

        const ext = isJs ? 'js' : 'py';
        const tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`);

        let runnerCode = "";
        const escapedTestCases = JSON.stringify(testCases).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        if (isJs) {
            runnerCode = `
${code}

const testCases = JSON.parse('${escapedTestCases}');
const results = [];
let passedCount = 0;

testCases.forEach((tc, i) => {
    try {
        const input = tc.input;
        const expected = tc.expectedOutput;
        
        console.log(\`\\n--- Test Case \${i + 1} ---\`);
        console.log(\`Input: \${JSON.stringify(input.length === 1 ? input[0] : input)}\`);
        console.log(\`Expected Output: \${JSON.stringify(expected)}\`);
        
        // Extract first element if length is 1, otherwise spread
        const output = input.length === 1 ? ${functionName}(input[0]) : ${functionName}(...input);
        
        console.log(\`Actual Output: \${JSON.stringify(output)}\`);
        
        const passed = JSON.stringify(output) === JSON.stringify(expected);
        if (passed) passedCount++;
        
        console.log(\`Status: \${passed ? 'Passed' : 'Failed'}\`);
        
        results.push({
            input: input,
            expected: expected,
            output: output,
            status: passed ? "Passed" : "Wrong Answer"
        });
    } catch (e) {
        console.log(\`Actual Output: \${e.message}\`);
        console.log(\`Status: Failed\`);
        results.push({
            input: tc.input,
            expected: tc.expectedOutput,
            error: e.message,
            status: "Error"
        });
    }
});
console.log("\\n" + JSON.stringify({ 
    results, 
    summary: { passed: passedCount, total: testCases.length } 
}));
`;
        } else {
            runnerCode = `
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

${code}

def run_tests():
    testCases = json.loads('${escapedTestCases}')
    results = []
    passedCount = 0
    
    for i, tc in enumerate(testCases):
        try:
            input_val = tc["input"]
            expected = tc["expectedOutput"]
            
            print(f"\\n--- Test Case {i + 1} ---")
            print(f"Input: {repr(input_val[0]) if len(input_val) == 1 else repr(input_val)}")
            print(f"Expected Output: {repr(expected)}")
            
            # Extract first element if length is 1
            if len(input_val) == 1:
                output = ${functionName}(input_val[0])
            else:
                output = ${functionName}(*input_val)
                
            print(f"Actual Output: {repr(output)}")
            
            passed = output == expected
            if passed: 
                passedCount += 1
                
            print(f"Status: {'Passed' if passed else 'Failed'}")
            
            results.append({
                "input": input_val,
                "expected": expected,
                "output": output,
                "status": "Passed" if passed else "Wrong Answer"
            })
        except Exception as e:
            print(f"Actual Output: {str(e)}")
            print(f"Status: Failed")
            results.append({
                "input": tc["input"],
                "expected": tc["expectedOutput"],
                "error": str(e),
                "status": "Error"
            })
            
    print("\\n" + json.dumps({ 
        "results": results, 
        "summary": { "passed": passedCount, "total": len(testCases) } 
    }))

if __name__ == "__main__":
    run_tests()
`;
        }

        await fs.writeFile(tempFilePath, runnerCode);

        const command = isJs ? `node "${tempFilePath}"` : `python "${tempFilePath}"`;

        try {
            const { stdout, stderr } = await execAsync(command, { timeout: 3000 });
            
            await fs.unlink(tempFilePath).catch(() => {});

            if (stderr && !stdout) {
                return res.json({
                    results: testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expectedOutput,
                        error: stderr.split('\\n')[0] || "Syntax/Runtime Error",
                        status: "Error"
                    }))
                });
            }

            try {
                // Find the JSON block from output (helps ignore unexpected prints inside code)
                const outLines = stdout.trim().split('\n');
                const lastLine = outLines[outLines.length - 1];
                const parsed = JSON.parse(lastLine);
                
                // Return both the structured results AND the raw console output (minus the JSON string)
                return res.json({
                    ...parsed,
                    stdout: stdout.replace(lastLine, '').trim()
                });
            } catch (err: any) {
                console.error("Parse Error:", err);
                return res.json({
                    results: testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expectedOutput,
                        error: "Failed to parse structured output. Keep your code clean from outer prints.",
                        status: "Error"
                    }))
                });
            }
            
        } catch (execErr: any) {
            await fs.unlink(tempFilePath).catch(() => {});
            
            if (execErr.killed || execErr.signal === 'SIGTERM') {
                return res.json({
                    results: testCases.map(tc => ({
                        input: tc.input,
                        expected: tc.expectedOutput,
                        error: "Time Limit Exceeded (3s)",
                        status: "Time Limit Exceeded"
                    }))
                });
            }
            
            return res.json({
                results: testCases.map(tc => ({
                    input: tc.input,
                    expected: tc.expectedOutput,
                    error: execErr.stderr ? execErr.stderr.split('\\n').slice(0,3).join(' ') : (execErr.message || "Runtime Error"),
                    status: "Error"
                }))
            });
        }

    } catch (err: any) {
        console.error("RUN ERROR:", err);
        return res.status(500).json({ 
            error: "Execution failed", 
            details: err.message || "Internal server error" 
        });
    }
});

// ── POST /api/interview/followup ───────────────────────────
router.post('/followup', async (req, res) => {
    try {
        const { question, approach, code } = req.body;
        const systemPrompt = `You are a technical interviewer. The candidate has submitted their solution.

Question: "${question}"
Their Approach: "${approach}"
Their Code:
\`\`\`
${code}
\`\`\`

Generate ONE sharp, probing follow-up question. It should test:
- Their complexity understanding
- OR an edge case they likely missed
- OR how they would optimize further
- OR system-level implications

Ask ONLY one clear, concise question. No preamble.`;

        const apiRes = await axios.post(AI_BASE_URL, {
            model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.8,
        }, { ...getAiConfig(), timeout: 20000 });

        res.json({ followup: apiRes.data.choices[0].message.content });
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to generate follow-up' });
    }
});

// ── POST /api/interview/feedback ───────────────────────────
router.post('/feedback', async (req, res) => {
    try {
        const { question, code, language } = req.body;
        const systemPrompt = `You are a senior code reviewer. Analyze this solution for a technical interview.

Question: "${question}"
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`

Provide:
1. **Complexity**: Time O(...), Space O(...)
2. **Code Quality**: Naming, readability, patterns
3. **Optimization**: The most impactful single change you'd make
4. **One-liner verdict**: Pass / Borderline / Needs work

Keep it under 200 words. Bullet points only.`;

        const apiRes = await axios.post(AI_BASE_URL, {
            model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.5,
        }, { ...getAiConfig(), timeout: 20000 });

        res.json({ feedback: apiRes.data.choices[0].message.content });
    } catch (err: any) {
        res.status(500).json({ error: 'Code feedback failed' });
    }
});

// ── POST /api/interview/submit ─────────────────────────────
router.post('/submit', async (req, res) => {
    try {
        const { question, approach, code, followUpQuestion, followUpAnswer, type } = req.body;
        const userId = (req as any).user.id;

        const systemPrompt = `You are the lead hiring manager at a top-tier tech company. You just conducted a full technical interview. Make the final hiring decision.

QUESTION: "${question}"
CANDIDATE'S APPROACH: "${approach}"
CANDIDATE'S CODE:
\`\`\`
${code}
\`\`\`
FOLLOW-UP ASKED: "${followUpQuestion}"
CANDIDATE'S FOLLOW-UP ANSWER: "${followUpAnswer}"

Provide a comprehensive evaluation. Return ONLY valid JSON (no markdown, no code blocks):
{
  "correctness": <0-100>,
  "optimization": <0-100>,
  "clarity": <0-100>,
  "communication": <0-100>,
  "overallScore": <0-100 weighted average>,
  "approachQuality": "OPTIMAL" | "SUBOPTIMAL" | "BRUTE_FORCE",
  "hireVerdict": "STRONG_HIRE" | "HIRE" | "BORDERLINE" | "NO_HIRE",
  "hireConfidence": <50-100>,
  "hireReasoning": "<one sentence strong justification for the verdict>",
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "weaknesses": ["<specific weakness 1>", "<specific weakness 2>"],
  "improvements": ["<actionable step 1>", "<actionable step 2>"],
  "stepByStepFeedback": ["<step 1 feedback>", "<step 2 feedback>", "<step 3 feedback>"],
  "complexityAnalysis": {
    "time": "<user's time complexity>",
    "space": "<user's space complexity>",
    "optimalTime": "<best possible time complexity>",
    "optimalSpace": "<best possible space complexity>"
  },
  "idealAnswer": "<clean, production-quality solution in the same language, well-commented>",
  "resumeBullet": "<one line resume-ready bullet point summarizing what they demonstrated, e.g. Solved X using Y achieving Z complexity>"
}`;

        const apiRes = await axios.post(AI_BASE_URL, {
            model: process.env.AI_MODEL || 'openai/gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [{ role: 'system', content: systemPrompt }],
            temperature: 0.3,
        }, { ...getAiConfig(), timeout: 25000 });

        let feedback: any;
        try {
            feedback = JSON.parse(apiRes.data.choices[0].message.content);
        } catch {
            const raw = apiRes.data.choices[0].message.content;
            const match = raw.match(/\{[\s\S]*\}/);
            feedback = match ? JSON.parse(match[0]) : {};
        }

        const sessionData = {
            userId,
            type,
            question,
            userAnswer: `[Approach]: ${approach}\n\n[Code]: ${code}\n\n[Follow-up]: ${followUpAnswer}`,
            score: {
                correctness: feedback.correctness || 0,
                optimization: feedback.optimization || 0,
                clarity: feedback.clarity || 0,
                overallScore: feedback.overallScore || 0,
                testCasesPassed: feedback.approachQuality
            },
            feedback: {
                strengths: feedback.strengths || [],
                weaknesses: feedback.weaknesses || [],
                improvements: feedback.improvements || [],
                complexityAnalysis: feedback.complexityAnalysis || { time: 'N/A', space: 'N/A' },
                idealAnswer: feedback.idealAnswer || ''
            },
            createdAt: new Date()
        };

        // Enrich result with full feedback before returning
        const fullResult = {
            ...sessionData,
            feedback: {
                ...sessionData.feedback,
                hireVerdict: feedback.hireVerdict || 'BORDERLINE',
                hireConfidence: feedback.hireConfidence || 70,
                hireReasoning: feedback.hireReasoning || '',
                approachQuality: feedback.approachQuality || 'SUBOPTIMAL',
                communication: feedback.communication || 70,
                stepByStepFeedback: feedback.stepByStepFeedback || [],
                resumeBullet: feedback.resumeBullet || ''
            },
            score: {
                ...sessionData.score,
                communication: feedback.communication || 70
            }
        };

        if (mongoose.connection.readyState === 1) {
            const session = new InterviewSessionModel(sessionData);
            await session.save();
            res.json({ ...fullResult, id: session._id }); return;
        } else {
            res.json({ id: 'local-session', ...fullResult }); return;
        }
    } catch (err: any) {
        console.error('Submit error:', err.message);
        res.status(500).json({ error: 'Evaluation failed. Please retry.' });
    }
});

// ── GET /api/interview/history ─────────────────────────────
router.get('/history', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) { res.json([]); return; }
        const userId = (req as any).user.id;
        const history = await InterviewSessionModel.find({ userId }).sort({ createdAt: -1 }).limit(20);
        res.json(history);
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

export default router;
