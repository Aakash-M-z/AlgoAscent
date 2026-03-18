import { Activity as DBActivity } from '../../shared/schema';
import { Activity as FrontendActivity } from '../types';

// Transform database activity to frontend activity format
export function dbToFrontendActivity(dbActivity: DBActivity): FrontendActivity {
  return {
    id: dbActivity.id.toString(),
    date: String(dbActivity.date),
    category: dbActivity.category,
    duration: dbActivity.timeSpent,
    description: dbActivity.problemDescription || dbActivity.topic,
    value: dbActivity.solved ? 4 : 2, // Higher value for solved problems
    dsaTopic: dbActivity.topic,
    difficulty: dbActivity.difficulty as 'Easy' | 'Medium' | 'Hard',
    platform: dbActivity.platform,
    problemSolved: dbActivity.solved,
    timeComplexity: dbActivity.timeComplexity || undefined,
    spaceComplexity: dbActivity.spaceComplexity || undefined,
    notes: dbActivity.notes || undefined,
  };
}

// Transform frontend activity to database activity format
export function frontendToDbActivity(
  frontendActivity: FrontendActivity | Omit<FrontendActivity, 'id'>,
  userId: number | string
): Omit<DBActivity, 'id' | 'createdAt'> {
  return {
    userId: userId.toString(),
    date: frontendActivity.date,
    category: frontendActivity.category,
    topic: frontendActivity.dsaTopic || frontendActivity.category,
    difficulty: frontendActivity.difficulty || 'Medium',
    platform: frontendActivity.platform || 'Unknown',
    timeSpent: frontendActivity.duration,
    problemDescription: frontendActivity.description,
    notes: frontendActivity.notes || null,
    timeComplexity: frontendActivity.timeComplexity || null,
    spaceComplexity: frontendActivity.spaceComplexity || null,
    solved: frontendActivity.problemSolved || false,
  };
}