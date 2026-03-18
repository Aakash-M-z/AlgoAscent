/* ── Shared problem dataset ──────────────────────────────────────
   Single source of truth used by both the backend recommendation
   engine and the frontend QuickAddProblem selector.
   ─────────────────────────────────────────────────────────────── */

export interface ProblemRecord {
    id: string;
    number: number;
    name: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    platform: 'LeetCode';
    /** Topics that should ideally be understood before attempting this */
    prereqs: string[];
    /** Conceptual tags for similarity matching */
    tags: string[];
}

export const PROBLEM_DATASET: ProblemRecord[] = [
    // ── Arrays ──────────────────────────────────────────────────
    { id: 'p1', number: 1, name: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', prereqs: [], tags: ['hash-map', 'two-pass'] },
    { id: 'p2', number: 15, name: 'Three Sum', difficulty: 'Medium', topic: 'Arrays', prereqs: ['Arrays'], tags: ['two-pointers', 'sorting'] },
    { id: 'p3', number: 42, name: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Arrays', prereqs: ['Arrays', 'Two Pointers'], tags: ['two-pointers', 'stack'] },
    { id: 'p4', number: 53, name: 'Maximum Subarray', difficulty: 'Medium', topic: 'Arrays', prereqs: ['Arrays'], tags: ['kadane', 'dp'] },
    { id: 'p5', number: 121, name: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', topic: 'Arrays', prereqs: [], tags: ['greedy', 'single-pass'] },
    { id: 'p6', number: 238, name: 'Product of Array Except Self', difficulty: 'Medium', topic: 'Arrays', prereqs: ['Arrays'], tags: ['prefix-sum'] },
    { id: 'p7', number: 56, name: 'Merge Intervals', difficulty: 'Medium', topic: 'Arrays', prereqs: ['Arrays'], tags: ['sorting', 'intervals'] },
    { id: 'p8', number: 48, name: 'Rotate Image', difficulty: 'Medium', topic: 'Arrays', prereqs: ['Arrays'], tags: ['matrix', 'in-place'] },
    { id: 'p9', number: 128, name: 'Longest Consecutive Sequence', difficulty: 'Medium', topic: 'Arrays', prereqs: ['Arrays'], tags: ['hash-set', 'union-find'] },
    { id: 'p10', number: 4, name: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Arrays', prereqs: ['Arrays', 'Binary Search'], tags: ['binary-search', 'divide-conquer'] },

    // ── Two Pointers ─────────────────────────────────────────────
    { id: 'p11', number: 11, name: 'Container With Most Water', difficulty: 'Medium', topic: 'Two Pointers', prereqs: ['Arrays'], tags: ['greedy', 'two-pointers'] },
    { id: 'p12', number: 125, name: 'Valid Palindrome', difficulty: 'Easy', topic: 'Two Pointers', prereqs: [], tags: ['string', 'two-pointers'] },
    { id: 'p13', number: 167, name: 'Two Sum II', difficulty: 'Medium', topic: 'Two Pointers', prereqs: ['Two Pointers'], tags: ['binary-search', 'two-pointers'] },
    { id: 'p14', number: 26, name: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', topic: 'Two Pointers', prereqs: [], tags: ['in-place', 'two-pointers'] },

    // ── Sliding Window ───────────────────────────────────────────
    { id: 'p15', number: 3, name: 'Longest Substring Without Repeating', difficulty: 'Medium', topic: 'Sliding Window', prereqs: ['Arrays'], tags: ['hash-map', 'sliding-window'] },
    { id: 'p16', number: 76, name: 'Minimum Window Substring', difficulty: 'Hard', topic: 'Sliding Window', prereqs: ['Sliding Window'], tags: ['hash-map', 'sliding-window'] },
    { id: 'p17', number: 239, name: 'Sliding Window Maximum', difficulty: 'Hard', topic: 'Sliding Window', prereqs: ['Sliding Window', 'Stacks'], tags: ['deque', 'monotonic'] },
    { id: 'p18', number: 424, name: 'Longest Repeating Character Replacement', difficulty: 'Medium', topic: 'Sliding Window', prereqs: ['Sliding Window'], tags: ['sliding-window', 'frequency'] },

    // ── Stacks ───────────────────────────────────────────────────
    { id: 'p19', number: 20, name: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stacks', prereqs: [], tags: ['stack', 'string'] },
    { id: 'p20', number: 84, name: 'Largest Rectangle in Histogram', difficulty: 'Hard', topic: 'Stacks', prereqs: ['Stacks'], tags: ['monotonic-stack'] },
    { id: 'p21', number: 155, name: 'Min Stack', difficulty: 'Medium', topic: 'Stacks', prereqs: ['Stacks'], tags: ['design', 'stack'] },
    { id: 'p22', number: 739, name: 'Daily Temperatures', difficulty: 'Medium', topic: 'Stacks', prereqs: ['Stacks'], tags: ['monotonic-stack'] },
    { id: 'p23', number: 853, name: 'Car Fleet', difficulty: 'Medium', topic: 'Stacks', prereqs: ['Stacks'], tags: ['sorting', 'stack'] },

    // ── Binary Search ────────────────────────────────────────────
    { id: 'p24', number: 704, name: 'Binary Search', difficulty: 'Easy', topic: 'Binary Search', prereqs: [], tags: ['binary-search'] },
    { id: 'p25', number: 33, name: 'Search in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', prereqs: ['Binary Search'], tags: ['binary-search', 'rotated'] },
    { id: 'p26', number: 153, name: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', prereqs: ['Binary Search'], tags: ['binary-search', 'rotated'] },
    { id: 'p27', number: 981, name: 'Time Based Key-Value Store', difficulty: 'Medium', topic: 'Binary Search', prereqs: ['Binary Search'], tags: ['binary-search', 'design'] },
    { id: 'p28', number: 4, name: 'Koko Eating Bananas', difficulty: 'Medium', topic: 'Binary Search', prereqs: ['Binary Search'], tags: ['binary-search', 'parametric'] },

    // ── Linked Lists ─────────────────────────────────────────────
    { id: 'p29', number: 206, name: 'Reverse Linked List', difficulty: 'Easy', topic: 'Linked Lists', prereqs: [], tags: ['linked-list', 'iterative'] },
    { id: 'p30', number: 21, name: 'Merge Two Sorted Lists', difficulty: 'Easy', topic: 'Linked Lists', prereqs: ['Linked Lists'], tags: ['linked-list', 'merge'] },
    { id: 'p31', number: 141, name: 'Linked List Cycle', difficulty: 'Easy', topic: 'Linked Lists', prereqs: ['Linked Lists'], tags: ['fast-slow-pointer'] },
    { id: 'p32', number: 19, name: 'Remove Nth Node From End', difficulty: 'Medium', topic: 'Linked Lists', prereqs: ['Linked Lists'], tags: ['two-pointers', 'linked-list'] },
    { id: 'p33', number: 143, name: 'Reorder List', difficulty: 'Medium', topic: 'Linked Lists', prereqs: ['Linked Lists'], tags: ['linked-list', 'two-pointers'] },
    { id: 'p34', number: 23, name: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Linked Lists', prereqs: ['Linked Lists', 'Heaps'], tags: ['heap', 'divide-conquer'] },

    // ── Trees ────────────────────────────────────────────────────
    { id: 'p35', number: 104, name: 'Maximum Depth of Binary Tree', difficulty: 'Easy', topic: 'Trees', prereqs: [], tags: ['dfs', 'recursion'] },
    { id: 'p36', number: 226, name: 'Invert Binary Tree', difficulty: 'Easy', topic: 'Trees', prereqs: ['Trees'], tags: ['dfs', 'bfs'] },
    { id: 'p37', number: 102, name: 'Binary Tree Level Order Traversal', difficulty: 'Medium', topic: 'Trees', prereqs: ['Trees'], tags: ['bfs', 'queue'] },
    { id: 'p38', number: 98, name: 'Validate Binary Search Tree', difficulty: 'Medium', topic: 'Trees', prereqs: ['Trees'], tags: ['dfs', 'inorder'] },
    { id: 'p39', number: 235, name: 'Lowest Common Ancestor of BST', difficulty: 'Medium', topic: 'Trees', prereqs: ['Trees'], tags: ['bst', 'recursion'] },
    { id: 'p40', number: 124, name: 'Binary Tree Maximum Path Sum', difficulty: 'Hard', topic: 'Trees', prereqs: ['Trees'], tags: ['dfs', 'dp-on-tree'] },
    { id: 'p41', number: 297, name: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topic: 'Trees', prereqs: ['Trees'], tags: ['bfs', 'design'] },
    { id: 'p42', number: 543, name: 'Diameter of Binary Tree', difficulty: 'Easy', topic: 'Trees', prereqs: ['Trees'], tags: ['dfs', 'recursion'] },

    // ── Graphs ───────────────────────────────────────────────────
    { id: 'p43', number: 200, name: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs', prereqs: ['Arrays'], tags: ['dfs', 'bfs', 'union-find'] },
    { id: 'p44', number: 207, name: 'Course Schedule', difficulty: 'Medium', topic: 'Graphs', prereqs: ['Graphs'], tags: ['topological-sort', 'cycle-detection'] },
    { id: 'p45', number: 210, name: 'Course Schedule II', difficulty: 'Medium', topic: 'Graphs', prereqs: ['Graphs'], tags: ['topological-sort'] },
    { id: 'p46', number: 743, name: 'Network Delay Time', difficulty: 'Medium', topic: 'Graphs', prereqs: ['Graphs'], tags: ['dijkstra', 'shortest-path'] },
    { id: 'p47', number: 684, name: 'Redundant Connection', difficulty: 'Medium', topic: 'Graphs', prereqs: ['Graphs'], tags: ['union-find'] },
    { id: 'p48', number: 127, name: 'Word Ladder', difficulty: 'Hard', topic: 'Graphs', prereqs: ['Graphs'], tags: ['bfs', 'shortest-path'] },
    { id: 'p49', number: 269, name: 'Alien Dictionary', difficulty: 'Hard', topic: 'Graphs', prereqs: ['Graphs'], tags: ['topological-sort'] },

    // ── Dynamic Programming ──────────────────────────────────────
    { id: 'p50', number: 70, name: 'Climbing Stairs', difficulty: 'Easy', topic: 'Dynamic Programming', prereqs: [], tags: ['dp', 'fibonacci'] },
    { id: 'p51', number: 198, name: 'House Robber', difficulty: 'Medium', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', '1d-dp'] },
    { id: 'p52', number: 213, name: 'House Robber II', difficulty: 'Medium', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', 'circular'] },
    { id: 'p53', number: 322, name: 'Coin Change', difficulty: 'Medium', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', 'unbounded-knapsack'] },
    { id: 'p54', number: 300, name: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', 'binary-search'] },
    { id: 'p55', number: 1143, name: 'Longest Common Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', '2d-dp'] },
    { id: 'p56', number: 72, name: 'Edit Distance', difficulty: 'Hard', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', '2d-dp'] },
    { id: 'p57', number: 312, name: 'Burst Balloons', difficulty: 'Hard', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', 'interval-dp'] },
    { id: 'p58', number: 416, name: 'Partition Equal Subset Sum', difficulty: 'Medium', topic: 'Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', '0-1-knapsack'] },

    // ── Heaps ────────────────────────────────────────────────────
    { id: 'p59', number: 703, name: 'Kth Largest Element in a Stream', difficulty: 'Easy', topic: 'Heaps', prereqs: [], tags: ['heap', 'design'] },
    { id: 'p60', number: 1046, name: 'Last Stone Weight', difficulty: 'Easy', topic: 'Heaps', prereqs: ['Heaps'], tags: ['max-heap', 'greedy'] },
    { id: 'p61', number: 215, name: 'Kth Largest Element in an Array', difficulty: 'Medium', topic: 'Heaps', prereqs: ['Heaps'], tags: ['heap', 'quickselect'] },
    { id: 'p62', number: 295, name: 'Find Median from Data Stream', difficulty: 'Hard', topic: 'Heaps', prereqs: ['Heaps'], tags: ['two-heaps', 'design'] },
    { id: 'p63', number: 23, name: 'Merge K Sorted Lists', difficulty: 'Hard', topic: 'Heaps', prereqs: ['Heaps', 'Linked Lists'], tags: ['heap', 'merge'] },

    // ── Backtracking ─────────────────────────────────────────────
    { id: 'p64', number: 78, name: 'Subsets', difficulty: 'Medium', topic: 'Backtracking', prereqs: [], tags: ['backtracking', 'bit-manipulation'] },
    { id: 'p65', number: 39, name: 'Combination Sum', difficulty: 'Medium', topic: 'Backtracking', prereqs: ['Backtracking'], tags: ['backtracking', 'recursion'] },
    { id: 'p66', number: 46, name: 'Permutations', difficulty: 'Medium', topic: 'Backtracking', prereqs: ['Backtracking'], tags: ['backtracking', 'recursion'] },
    { id: 'p67', number: 79, name: 'Word Search', difficulty: 'Medium', topic: 'Backtracking', prereqs: ['Backtracking'], tags: ['backtracking', 'dfs', 'matrix'] },
    { id: 'p68', number: 51, name: 'N-Queens', difficulty: 'Hard', topic: 'Backtracking', prereqs: ['Backtracking'], tags: ['backtracking', 'constraint'] },

    // ── Design ───────────────────────────────────────────────────
    { id: 'p69', number: 146, name: 'LRU Cache', difficulty: 'Medium', topic: 'Design', prereqs: ['Linked Lists'], tags: ['design', 'hash-map', 'doubly-linked-list'] },
    { id: 'p70', number: 208, name: 'Implement Trie', difficulty: 'Medium', topic: 'Design', prereqs: [], tags: ['trie', 'design'] },
    { id: 'p71', number: 211, name: 'Design Add and Search Words', difficulty: 'Medium', topic: 'Design', prereqs: ['Design'], tags: ['trie', 'dfs'] },
    { id: 'p72', number: 212, name: 'Word Search II', difficulty: 'Hard', topic: 'Design', prereqs: ['Design', 'Backtracking'], tags: ['trie', 'backtracking'] },

    // ── Greedy ───────────────────────────────────────────────────
    { id: 'p73', number: 55, name: 'Jump Game', difficulty: 'Medium', topic: 'Greedy', prereqs: ['Arrays'], tags: ['greedy'] },
    { id: 'p74', number: 45, name: 'Jump Game II', difficulty: 'Medium', topic: 'Greedy', prereqs: ['Greedy'], tags: ['greedy', 'bfs'] },
    { id: 'p75', number: 134, name: 'Gas Station', difficulty: 'Medium', topic: 'Greedy', prereqs: ['Greedy'], tags: ['greedy', 'circular'] },
    { id: 'p76', number: 435, name: 'Non-overlapping Intervals', difficulty: 'Medium', topic: 'Greedy', prereqs: ['Greedy'], tags: ['greedy', 'intervals', 'sorting'] },

    // ── Bit Manipulation ─────────────────────────────────────────
    { id: 'p77', number: 136, name: 'Single Number', difficulty: 'Easy', topic: 'Bit Manipulation', prereqs: [], tags: ['xor', 'bit-manipulation'] },
    { id: 'p78', number: 191, name: 'Number of 1 Bits', difficulty: 'Easy', topic: 'Bit Manipulation', prereqs: ['Bit Manipulation'], tags: ['bit-manipulation'] },
    { id: 'p79', number: 338, name: 'Counting Bits', difficulty: 'Easy', topic: 'Bit Manipulation', prereqs: ['Bit Manipulation'], tags: ['dp', 'bit-manipulation'] },
    { id: 'p80', number: 268, name: 'Missing Number', difficulty: 'Easy', topic: 'Bit Manipulation', prereqs: ['Bit Manipulation'], tags: ['xor', 'math'] },

    // ── Math ─────────────────────────────────────────────────────
    { id: 'p81', number: 202, name: 'Happy Number', difficulty: 'Easy', topic: 'Math', prereqs: [], tags: ['hash-set', 'fast-slow-pointer'] },
    { id: 'p82', number: 66, name: 'Plus One', difficulty: 'Easy', topic: 'Math', prereqs: [], tags: ['array', 'math'] },
    { id: 'p83', number: 50, name: 'Pow(x, n)', difficulty: 'Medium', topic: 'Math', prereqs: ['Math'], tags: ['fast-exponentiation', 'recursion'] },
    { id: 'p84', number: 43, name: 'Multiply Strings', difficulty: 'Medium', topic: 'Math', prereqs: ['Math'], tags: ['string', 'simulation'] },

    // ── Intervals ────────────────────────────────────────────────
    { id: 'p85', number: 57, name: 'Insert Interval', difficulty: 'Medium', topic: 'Intervals', prereqs: ['Arrays'], tags: ['intervals', 'sorting'] },
    { id: 'p86', number: 56, name: 'Merge Intervals', difficulty: 'Medium', topic: 'Intervals', prereqs: ['Intervals'], tags: ['intervals', 'sorting'] },
    { id: 'p87', number: 252, name: 'Meeting Rooms', difficulty: 'Easy', topic: 'Intervals', prereqs: [], tags: ['intervals', 'sorting'] },
    { id: 'p88', number: 253, name: 'Meeting Rooms II', difficulty: 'Medium', topic: 'Intervals', prereqs: ['Intervals'], tags: ['intervals', 'heap'] },

    // ── Trie ─────────────────────────────────────────────────────
    { id: 'p89', number: 208, name: 'Implement Trie (Prefix Tree)', difficulty: 'Medium', topic: 'Trie', prereqs: [], tags: ['trie', 'design'] },
    { id: 'p90', number: 212, name: 'Word Search II', difficulty: 'Hard', topic: 'Trie', prereqs: ['Trie', 'Backtracking'], tags: ['trie', 'backtracking'] },

    // ── Advanced Graphs ──────────────────────────────────────────
    { id: 'p91', number: 332, name: 'Reconstruct Itinerary', difficulty: 'Hard', topic: 'Advanced Graphs', prereqs: ['Graphs'], tags: ['eulerian-path', 'dfs'] },
    { id: 'p92', number: 1584, name: 'Min Cost to Connect All Points', difficulty: 'Medium', topic: 'Advanced Graphs', prereqs: ['Graphs'], tags: ['mst', 'prim', 'kruskal'] },
    { id: 'p93', number: 778, name: 'Swim in Rising Water', difficulty: 'Hard', topic: 'Advanced Graphs', prereqs: ['Graphs'], tags: ['dijkstra', 'binary-search'] },

    // ── 2D Dynamic Programming ───────────────────────────────────
    { id: 'p94', number: 62, name: 'Unique Paths', difficulty: 'Medium', topic: '2D Dynamic Programming', prereqs: ['Dynamic Programming'], tags: ['dp', '2d-dp', 'math'] },
    { id: 'p95', number: 63, name: 'Unique Paths II', difficulty: 'Medium', topic: '2D Dynamic Programming', prereqs: ['2D Dynamic Programming'], tags: ['dp', '2d-dp', 'obstacles'] },
    { id: 'p96', number: 329, name: 'Longest Increasing Path in Matrix', difficulty: 'Hard', topic: '2D Dynamic Programming', prereqs: ['2D Dynamic Programming'], tags: ['dp', 'dfs', 'memoization'] },

    // ── Strings ──────────────────────────────────────────────────
    { id: 'p97', number: 242, name: 'Valid Anagram', difficulty: 'Easy', topic: 'Strings', prereqs: [], tags: ['hash-map', 'sorting'] },
    { id: 'p98', number: 49, name: 'Group Anagrams', difficulty: 'Medium', topic: 'Strings', prereqs: ['Strings'], tags: ['hash-map', 'sorting'] },
    { id: 'p99', number: 5, name: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'Strings', prereqs: ['Strings'], tags: ['dp', 'expand-around-center'] },
    { id: 'p100', number: 647, name: 'Palindromic Substrings', difficulty: 'Medium', topic: 'Strings', prereqs: ['Strings'], tags: ['dp', 'expand-around-center'] },
];

export const ALL_TOPICS = [...new Set(PROBLEM_DATASET.map(p => p.topic))].sort();

/** Difficulty ordering for progression logic */
export const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
