import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DailyProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  platform: string;
  description: string;
  url?: string;
}

const DAILY_PROBLEMS: DailyProblem[] = [
  {
    id: '1',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Strings',
    platform: 'LeetCode',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    url: 'https://leetcode.com/problems/two-sum/'
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stacks & Queues',
    platform: 'LeetCode',
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    url: 'https://leetcode.com/problems/valid-parentheses/'
  },
  {
    id: '3',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    category: 'Linked Lists',
    platform: 'LeetCode',
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists in a sorted list.',
    url: 'https://leetcode.com/problems/merge-two-sorted-lists/'
  },
  {
    id: '4',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    platform: 'LeetCode',
    description: 'Given an integer array nums, find the subarray which has the largest sum and return its sum.',
    url: 'https://leetcode.com/problems/maximum-subarray/'
  },
  {
    id: '5',
    title: 'Binary Tree Inorder Traversal',
    difficulty: 'Easy',
    category: 'Trees & Binary Trees',
    platform: 'LeetCode',
    description: "Given the root of a binary tree, return the inorder traversal of its nodes' values.",
    url: 'https://leetcode.com/problems/binary-tree-inorder-traversal/'
  },
  {
    id: '6',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    category: 'Greedy Algorithms',
    platform: 'LeetCode',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.',
    url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/'
  },
  {
    id: '7',
    title: 'Palindrome Number',
    difficulty: 'Easy',
    category: 'Math',
    platform: 'LeetCode',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
    url: 'https://leetcode.com/problems/palindrome-number/'
  }
];

interface DailyProblemNotificationProps {
  forceShow?: boolean;
  onClose?: () => void;
}

const DIFF_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  Easy: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.25)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  Hard: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
};

const DailyProblemNotification: React.FC<DailyProblemNotificationProps> = ({ forceShow = false, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dailyProblem, setDailyProblem] = useState<DailyProblem | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    setDailyProblem(DAILY_PROBLEMS[dayOfYear % DAILY_PROBLEMS.length]);

    if (forceShow) { setIsVisible(true); return; }

    const today = new Date().toDateString();
    const lastShown = localStorage.getItem(`dailyProblem_${user.id}_lastShown`);
    const dismissed = localStorage.getItem(`dailyProblem_${user.id}_dismissed_${today}`);
    const raw = localStorage.getItem(`notifications_${user.id}`);
    const settings = raw ? JSON.parse(raw) : { dailyNotifications: true };

    if (settings.dailyNotifications && lastShown !== today && !dismissed) {
      setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem(`dailyProblem_${user.id}_lastShown`, today);
      }, 2000);
    }
  }, [user, forceShow]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (!forceShow && user) {
      localStorage.setItem(`dailyProblem_${user.id}_dismissed_${new Date().toDateString()}`, 'true');
    }
    onClose?.();
  };

  const handleAccept = () => {
    setIsVisible(false);
    if (dailyProblem?.url) window.open(dailyProblem.url, '_blank');
    onClose?.();
  };

  if (!isVisible || !dailyProblem) return null;

  const diff = DIFF_STYLES[dailyProblem.difficulty] ?? DIFF_STYLES.Easy;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 51,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}>
        <div style={{
          background: 'rgba(10,10,10,0.97)',
          border: '1px solid rgba(212,175,55,0.22)',
          borderRadius: '20px',
          width: '100%', maxWidth: '440px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 60px rgba(212,175,55,0.06)',
          backdropFilter: 'blur(24px)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s cubic-bezier(0.22,1,0.36,1)',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.06) 100%)',
            borderBottom: '1px solid rgba(212,175,55,0.15)',
            padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '12px',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem',
              }}>🎯</div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#EAEAEA' }}>Daily Challenge</div>
                <div style={{ fontSize: '0.75rem', color: '#D4AF37', marginTop: '1px' }}>Ready to level up?</div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#555', cursor: 'pointer', fontSize: '0.9rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#EAEAEA';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#555';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Title + difficulty */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#EAEAEA', lineHeight: 1.3 }}>
                {dailyProblem.title}
              </div>
              <span style={{
                flexShrink: 0,
                fontSize: '0.7rem', fontWeight: 700,
                padding: '3px 10px', borderRadius: '999px',
                color: diff.color, background: diff.bg, border: `1px solid ${diff.border}`,
              }}>
                {dailyProblem.difficulty}
              </span>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#666' }}>
                <span style={{ color: '#D4AF37' }}>◈</span>
                <span>{dailyProblem.category}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#666' }}>
                <span style={{ color: '#22c55e' }}>◉</span>
                <span>{dailyProblem.platform}</span>
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: '0.82rem', color: '#888', lineHeight: 1.6,
              padding: '12px 14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '10px',
              margin: 0,
            }}>
              {dailyProblem.description}
            </p>

            {/* Tip */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', borderRadius: '10px',
              background: 'rgba(212,175,55,0.05)',
              border: '1px solid rgba(212,175,55,0.15)',
            }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: '0.78rem', color: '#D4AF37', lineHeight: 1.5 }}>
                Solve this problem to maintain your streak and sharpen your skills!
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{
            padding: '0 24px 20px',
            display: 'flex', gap: '10px',
          }}>
            <button
              onClick={handleDismiss}
              style={{
                flex: 1, padding: '11px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color: '#888', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.color = '#EAEAEA';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.color = '#888';
              }}
            >
              Maybe Later
            </button>
            <button
              onClick={handleAccept}
              style={{
                flex: 1, padding: '11px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)',
                border: 'none', borderRadius: '10px',
                color: '#0B0B0B', fontSize: '0.875rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 20px rgba(212,175,55,0.25)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 28px rgba(212,175,55,0.4)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(212,175,55,0.25)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              Solve Now 🚀
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DailyProblemNotification;
