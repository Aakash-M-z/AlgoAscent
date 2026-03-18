import React, { useState, useEffect } from 'react';
import { Activity } from '../types';
import { useToast } from './Toast';

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  constraints: string[];
  hints: string[];
  companies: string[];
  platforms: { name: string; url: string }[];
  timeComplexity: string;
  spaceComplexity: string;
}

interface ProblemPageProps {
  category: string;
  onBack: () => void;
  onAddActivity: (activity: Activity) => void;
}

export const PROBLEMS_BY_CATEGORY: Record<string, Problem[]> = {
  'Arrays & Strings': [
    {
      id: 'two-sum', title: 'Two Sum', difficulty: 'Easy',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution.',
      examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9, return [0, 1].' }],
      constraints: ['2 ≤ nums.length ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Only one valid answer exists.'],
      hints: ['Use a hash map to store the complement of each number.', 'For each number, check if its complement exists in the map.'],
      companies: ['Amazon', 'Google', 'Microsoft', 'Apple'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/two-sum/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    },
    {
      id: 'best-time-stock', title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy',
      description: 'Given an array prices where prices[i] is the price of a stock on day i, find the maximum profit from a single buy-sell transaction.',
      examples: [{ input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price=1), sell on day 5 (price=6), profit = 5.' }],
      constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
      hints: ['Track the minimum price seen so far.', 'For each price, calculate profit if sold at that price.'],
      companies: ['Facebook', 'Amazon', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    },
    {
      id: 'maximum-subarray', title: 'Maximum Subarray', difficulty: 'Medium',
      description: 'Given an integer array nums, find the subarray with the largest sum and return its sum.',
      examples: [{ input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'Subarray [4,-1,2,1] has the largest sum = 6.' }],
      constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
      hints: ["Kadane's algorithm: track current sum and reset when it goes negative.", 'Keep a running max of the best sum seen.'],
      companies: ['Amazon', 'Microsoft', 'Google'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/maximum-subarray/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    },
    {
      id: 'container-with-most-water', title: 'Container With Most Water', difficulty: 'Medium',
      description: 'Given n vertical lines at positions 0..n-1 with heights height[i], find two lines that together with the x-axis form a container holding the most water.',
      examples: [{ input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 and 8 form a container of area 49.' }],
      constraints: ['n == height.length', '2 ≤ n ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
      hints: ['Use two pointers starting from both ends.', 'Move the pointer with the smaller height inward.'],
      companies: ['Amazon', 'Google', 'Bloomberg'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/container-with-most-water/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    },
  ],
  'Linked Lists': [
    {
      id: 'reverse-linked-list', title: 'Reverse Linked List', difficulty: 'Easy',
      description: 'Given the head of a singly linked list, reverse the list and return the reversed list.',
      examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'The list is reversed.' }],
      constraints: ['0 ≤ number of nodes ≤ 5000', '-5000 ≤ Node.val ≤ 5000'],
      hints: ['Use three pointers: prev, curr, next.', 'Iteratively reverse the links.'],
      companies: ['Apple', 'Amazon', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/reverse-linked-list/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    },
    {
      id: 'merge-two-sorted-lists', title: 'Merge Two Sorted Lists', difficulty: 'Easy',
      description: 'Merge two sorted linked lists and return the merged list (sorted).',
      examples: [{ input: 'l1 = [1,2,4], l2 = [1,3,4]', output: '[1,1,2,3,4,4]', explanation: 'Merge by comparing heads.' }],
      constraints: ['0 ≤ number of nodes ≤ 50', '-100 ≤ Node.val ≤ 100'],
      hints: ['Use a dummy head node.', 'Compare the two heads and advance the smaller one.'],
      companies: ['Amazon', 'Microsoft', 'Google'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/merge-two-sorted-lists/' }],
      timeComplexity: 'O(n+m)', spaceComplexity: 'O(1)',
    },
    {
      id: 'linked-list-cycle', title: 'Linked List Cycle', difficulty: 'Easy',
      description: 'Given the head of a linked list, determine if the linked list has a cycle in it.',
      examples: [{ input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'Tail connects to node at index 1.' }],
      constraints: ['0 ≤ number of nodes ≤ 10⁴', '-10⁵ ≤ Node.val ≤ 10⁵'],
      hints: ["Floyd's cycle detection: use slow and fast pointers.", 'If they meet, there is a cycle.'],
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/linked-list-cycle/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    },
  ],
  'Stacks & Queues': [
    {
      id: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Easy',
      description: "Given a string s containing '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      examples: [{ input: 's = "()[]{}"', output: 'true', explanation: 'All brackets are properly matched.' }],
      constraints: ['1 ≤ s.length ≤ 10⁴', "s consists of parentheses only '()[]{}'"],
      hints: ['Use a stack to track opening brackets.', 'For each closing bracket, check if it matches the top of the stack.'],
      companies: ['Google', 'Amazon', 'Facebook'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/valid-parentheses/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(n)',
    },
    {
      id: 'min-stack', title: 'Min Stack', difficulty: 'Medium',
      description: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.',
      examples: [{ input: 'push(-2), push(0), push(-3), getMin(), pop(), top(), getMin()', output: '-3, 0, -2', explanation: 'Track min alongside each element.' }],
      constraints: ['-2³¹ ≤ val ≤ 2³¹ - 1', 'pop/top/getMin called on non-empty stack'],
      hints: ['Use a second stack to track minimums.', 'Push to min-stack only when new value ≤ current min.'],
      companies: ['Amazon', 'Google', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/min-stack/' }],
      timeComplexity: 'O(1) all ops', spaceComplexity: 'O(n)',
    },
  ],
  'Trees & Binary Trees': [
    {
      id: 'max-depth-binary-tree', title: 'Maximum Depth of Binary Tree', difficulty: 'Easy',
      description: "Given the root of a binary tree, return its maximum depth — the number of nodes along the longest path from root to farthest leaf.",
      examples: [{ input: 'root = [3,9,20,null,null,15,7]', output: '3', explanation: 'The tree has 3 levels.' }],
      constraints: ['0 ≤ number of nodes ≤ 10⁴', '-100 ≤ Node.val ≤ 100'],
      hints: ['Use recursion: depth = 1 + max(left, right).', 'Base case: null node returns 0.'],
      companies: ['Microsoft', 'Amazon', 'Apple'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h)',
    },
    {
      id: 'invert-binary-tree', title: 'Invert Binary Tree', difficulty: 'Easy',
      description: 'Given the root of a binary tree, invert the tree and return its root.',
      examples: [{ input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]', explanation: 'Left and right subtrees are swapped at every node.' }],
      constraints: ['0 ≤ number of nodes ≤ 100', '-100 ≤ Node.val ≤ 100'],
      hints: ['Recursively swap left and right children.', 'Can also be done iteratively with a queue (BFS).'],
      companies: ['Google', 'Facebook', 'Amazon'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/invert-binary-tree/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h)',
    },
    {
      id: 'validate-bst', title: 'Validate Binary Search Tree', difficulty: 'Medium',
      description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).',
      examples: [{ input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: "Root's right child 4 is not greater than root 5." }],
      constraints: ['1 ≤ number of nodes ≤ 10⁴', '-2³¹ ≤ Node.val ≤ 2³¹ - 1'],
      hints: ['Pass min/max bounds down the recursion.', 'Left subtree values must be < node.val, right must be > node.val.'],
      companies: ['Amazon', 'Microsoft', 'Bloomberg'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/validate-binary-search-tree/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(h)',
    },
  ],
  'Dynamic Programming': [
    {
      id: 'climbing-stairs', title: 'Climbing Stairs', difficulty: 'Easy',
      description: 'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. How many distinct ways can you reach the top?',
      examples: [{ input: 'n = 5', output: '8', explanation: 'There are 8 distinct ways to climb 5 stairs.' }],
      constraints: ['1 ≤ n ≤ 45'],
      hints: ['This is the Fibonacci sequence.', 'ways(n) = ways(n-1) + ways(n-2).'],
      companies: ['Amazon', 'Google', 'Adobe'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/climbing-stairs/' }],
      timeComplexity: 'O(n)', spaceComplexity: 'O(1)',
    },
    {
      id: 'coin-change', title: 'Coin Change', difficulty: 'Medium',
      description: 'Given coins of different denominations and an amount, find the fewest number of coins needed to make up that amount.',
      examples: [{ input: 'coins = [1,5,11], amount = 15', output: '3', explanation: '11 + 3×1 = 14? No — 11+3 not valid. 5+5+5=15, 3 coins.' }],
      constraints: ['1 ≤ coins.length ≤ 12', '1 ≤ coins[i] ≤ 2³¹-1', '0 ≤ amount ≤ 10⁴'],
      hints: ['Use bottom-up DP: dp[i] = min coins to make amount i.', 'For each coin, update dp[coin..amount].'],
      companies: ['Amazon', 'Google', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/coin-change/' }],
      timeComplexity: 'O(amount × coins)', spaceComplexity: 'O(amount)',
    },
    {
      id: 'longest-common-subsequence', title: 'Longest Common Subsequence', difficulty: 'Medium',
      description: 'Given two strings text1 and text2, return the length of their longest common subsequence.',
      examples: [{ input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'LCS is "ace".' }],
      constraints: ['1 ≤ text1.length, text2.length ≤ 1000'],
      hints: ['Build a 2D DP table.', 'dp[i][j] = LCS of text1[0..i] and text2[0..j].'],
      companies: ['Google', 'Amazon', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/longest-common-subsequence/' }],
      timeComplexity: 'O(m×n)', spaceComplexity: 'O(m×n)',
    },
  ],
  'Graphs': [
    {
      id: 'number-of-islands', title: 'Number of Islands', difficulty: 'Medium',
      description: 'Given an m×n grid of "1"s (land) and "0"s (water), count the number of islands.',
      examples: [{ input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: '2', explanation: 'Two separate islands.' }],
      constraints: ['1 ≤ m, n ≤ 300', 'grid[i][j] is "0" or "1"'],
      hints: ['Use DFS/BFS from each unvisited land cell.', 'Mark visited cells to avoid re-counting.'],
      companies: ['Amazon', 'Google', 'Facebook'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/number-of-islands/' }],
      timeComplexity: 'O(m×n)', spaceComplexity: 'O(m×n)',
    },
    {
      id: 'clone-graph', title: 'Clone Graph', difficulty: 'Medium',
      description: 'Given a reference to a node in a connected undirected graph, return a deep copy of the graph.',
      examples: [{ input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', explanation: 'Deep copy of the graph.' }],
      constraints: ['0 ≤ number of nodes ≤ 100', '1 ≤ Node.val ≤ 100'],
      hints: ['Use a hash map to map original nodes to clones.', 'DFS/BFS to traverse and clone.'],
      companies: ['Facebook', 'Amazon', 'Google'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/clone-graph/' }],
      timeComplexity: 'O(V+E)', spaceComplexity: 'O(V)',
    },
  ],
  'Binary Search': [
    {
      id: 'binary-search', title: 'Binary Search', difficulty: 'Easy',
      description: 'Given a sorted array of integers and a target, return the index of target or -1 if not found.',
      examples: [{ input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists at index 4.' }],
      constraints: ['1 ≤ nums.length ≤ 10⁴', 'All values are unique', 'nums is sorted ascending'],
      hints: ['Maintain lo and hi pointers.', 'Check mid = (lo+hi)//2 each iteration.'],
      companies: ['Google', 'Amazon', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/binary-search/' }],
      timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    },
    {
      id: 'search-rotated-array', title: 'Search in Rotated Sorted Array', difficulty: 'Medium',
      description: 'Given a rotated sorted array and a target, return the index of target or -1.',
      examples: [{ input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: 'Target 0 is at index 4.' }],
      constraints: ['1 ≤ nums.length ≤ 5000', 'All values are unique'],
      hints: ['One half of the array is always sorted.', 'Determine which half is sorted, then check if target is in it.'],
      companies: ['Amazon', 'Facebook', 'Microsoft'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/' }],
      timeComplexity: 'O(log n)', spaceComplexity: 'O(1)',
    },
  ],
  'Two Pointers': [
    {
      id: 'three-sum', title: '3Sum', difficulty: 'Medium',
      description: 'Given an integer array nums, return all triplets [nums[i], nums[j], nums[k]] such that i≠j≠k and nums[i]+nums[j]+nums[k] == 0.',
      examples: [{ input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'Two unique triplets sum to zero.' }],
      constraints: ['3 ≤ nums.length ≤ 3000', '-10⁵ ≤ nums[i] ≤ 10⁵'],
      hints: ['Sort the array first.', 'Fix one element, use two pointers for the rest.'],
      companies: ['Amazon', 'Facebook', 'Google'],
      platforms: [{ name: 'LeetCode', url: 'https://leetcode.com/problems/3sum/' }],
      timeComplexity: 'O(n²)', spaceComplexity: 'O(1)',
    },
  ],
};

const diffStyle = (d: string) => {
  if (d === 'Easy') return { color: '#22c55e', bg: 'rgba(34,197,94,0.1)' };
  if (d === 'Medium') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
  return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)' };
};

const ProblemPage: React.FC<ProblemPageProps> = ({ category, onBack, onAddActivity }) => {
  const { toast } = useToast();
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [solved, setSolved] = useState(false);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(30);

  const problems = PROBLEMS_BY_CATEGORY[category] || [];

  useEffect(() => {
    if (problems.length > 0) setSelectedProblem(problems[0]);
    setShowHints(false);
    setSolved(false);
    setNotes('');
    setDuration(30);
  }, [category]);

  const handleLog = () => {
    if (!selectedProblem) return;
    const activity: Activity = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      description: `${solved ? 'Solved' : 'Attempted'}: ${selectedProblem.title}`,
      category,
      dsaTopic: category,
      difficulty: selectedProblem.difficulty,
      platform: 'DSA Roadmap',
      timeComplexity: selectedProblem.timeComplexity,
      spaceComplexity: selectedProblem.spaceComplexity,
      duration,
      problemSolved: solved,
      notes: notes || undefined,
      value: solved ? 3 : 1,
    };
    onAddActivity(activity);
    toast(solved ? `✓ Solved: ${selectedProblem.title}` : `📚 Logged: ${selectedProblem.title}`, 'success');
    setSolved(false);
    setNotes('');
    setDuration(30);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.08)',
    color: '#EAEAEA', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  };

  if (problems.length === 0) {
    return (
      <div className="card-dark" style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.2, marginBottom: '12px' }}>◎</div>
        <div className="card-title" style={{ marginBottom: '8px' }}>No Problems Yet</div>
        <div className="kpi-sub" style={{ marginBottom: '20px' }}>Problems for {category} are coming soon.</div>
        <button onClick={onBack} className="btn-gold" style={{ padding: '10px 24px', borderRadius: '10px' }}>
          ← Back to Roadmap
        </button>
      </div>
    );
  }

  return (
    <div className="section-gap animate-fadeIn">
      {/* Header */}
      <div className="card-dark" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.875rem', padding: 0 }}>
            ← Back to Roadmap
          </button>
          {selectedProblem && (
            <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, color: diffStyle(selectedProblem.difficulty).color, background: diffStyle(selectedProblem.difficulty).bg }}>
              {selectedProblem.difficulty}
            </span>
          )}
        </div>
        <h1 className="page-heading" style={{ marginBottom: '4px' }}>{selectedProblem?.title}</h1>
        <div className="kpi-sub">Category: {category}</div>

        {problems.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {problems.map(p => (
              <button key={p.id} onClick={() => { setSelectedProblem(p); setShowHints(false); }}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                  background: selectedProblem?.id === p.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedProblem?.id === p.id ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  color: selectedProblem?.id === p.id ? '#D4AF37' : '#888',
                }}>
                {p.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProblem && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>
          {/* Left column */}
          <div className="section-gap">
            {/* Description */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
              <div className="card-title" style={{ marginBottom: '12px' }}>Problem Description</div>
              <p style={{ fontSize: '0.875rem', color: '#BDBDBD', lineHeight: 1.7 }}>{selectedProblem.description}</p>
            </div>

            {/* Examples */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
              <div className="card-title" style={{ marginBottom: '12px' }}>Examples</div>
              {selectedProblem.examples.map((ex, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: '#888' }}>Input: </span>
                    <code style={{ color: '#D4AF37' }}>{ex.input}</code>
                  </div>
                  <div style={{ fontSize: '0.8rem', marginBottom: '6px' }}>
                    <span style={{ color: '#888' }}>Output: </span>
                    <code style={{ color: '#22c55e' }}>{ex.output}</code>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    <span style={{ color: '#888' }}>Explanation: </span>
                    <span style={{ color: '#BDBDBD' }}>{ex.explanation}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
              <div className="card-title" style={{ marginBottom: '12px' }}>Constraints</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedProblem.constraints.map((c, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: '#BDBDBD' }}>
                    <span style={{ color: '#D4AF37', flexShrink: 0 }}>•</span>
                    <code>{c}</code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Hints */}
            <div className="card-dark" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showHints ? '12px' : 0 }}>
                <div className="card-title">Hints</div>
                <button onClick={() => setShowHints(v => !v)}
                  style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', transition: 'all 0.2s' }}>
                  {showHints ? 'Hide' : 'Show Hints'}
                </button>
              </div>
              {showHints && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedProblem.hints.map((h, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.875rem', color: '#BDBDBD' }}>
                      <span>💡</span><span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="section-gap">
            {/* Complexity */}
            <div className="card-dark" style={{ padding: '18px 20px' }}>
              <div className="card-title" style={{ marginBottom: '12px' }}>Complexity</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#888' }}>Time: </span>
                  <code style={{ color: '#D4AF37' }}>{selectedProblem.timeComplexity}</code>
                </div>
                <div style={{ fontSize: '0.8rem' }}>
                  <span style={{ color: '#888' }}>Space: </span>
                  <code style={{ color: '#22c55e' }}>{selectedProblem.spaceComplexity}</code>
                </div>
              </div>
            </div>

            {/* Companies */}
            <div className="card-dark" style={{ padding: '18px 20px' }}>
              <div className="card-title" style={{ marginBottom: '12px' }}>Asked By</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedProblem.companies.map(c => (
                  <span key={c} style={{ fontSize: '0.7rem', padding: '3px 9px', borderRadius: '999px', background: 'rgba(129,140,248,0.1)', color: '#818cf8', fontWeight: 500 }}>{c}</span>
                ))}
              </div>
            </div>

            {/* Practice links */}
            <div className="card-dark" style={{ padding: '18px 20px' }}>
              <div className="card-title" style={{ marginBottom: '12px' }}>Practice Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedProblem.platforms.map(pl => (
                  <a key={pl.name} href={pl.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: '#EAEAEA', textDecoration: 'none', fontSize: '0.8rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,175,55,0.3)'; (e.currentTarget as HTMLElement).style.color = '#D4AF37'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#EAEAEA'; }}
                  >
                    <span>{pl.name}</span>
                    <span style={{ fontSize: '0.7rem' }}>↗</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Log progress */}
            <div className="card-dark" style={{ padding: '18px 20px', border: '1px solid rgba(212,175,55,0.15)' }}>
              <div className="card-title" style={{ marginBottom: '14px' }}>Log Progress</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={solved} onChange={e => setSolved(e.target.checked)} style={{ accentColor: '#D4AF37', width: '15px', height: '15px' }} />
                  <span style={{ fontSize: '0.875rem', color: '#EAEAEA' }}>Problem Solved</span>
                </label>
                <div>
                  <div className="kpi-sub" style={{ marginBottom: '6px' }}>Time spent (min)</div>
                  <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value))} min={1} style={inputStyle} />
                </div>
                <div>
                  <div className="kpi-sub" style={{ marginBottom: '6px' }}>Notes (optional)</div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Approach, learnings..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <button onClick={handleLog}
                  style={{ width: '100%', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', background: 'linear-gradient(135deg, #D4AF37, #FFD700)', color: '#0B0B0B', border: 'none', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  Log Activity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProblemPage;
