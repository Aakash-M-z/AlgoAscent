import { Task } from '../../shared/schema';

/**
 * Extract unique ISO date strings (YYYY-MM-DD) from completed tasks.
 */
function getCompletedDates(tasks: Task[]): string[] {
    const dates = tasks
        .filter(t => t.completed && t.completedAt)
        .map(t => t.completedAt!.slice(0, 10));
    return [...new Set(dates)].sort((a, b) => (a > b ? -1 : 1)); // desc
}

/**
 * Count consecutive days ending today (or yesterday if today has no entry yet).
 */
export function calculateStreak(tasks: Task[]): number {
    const dates = getCompletedDates(tasks);
    if (dates.length === 0) return 0;

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

    // Streak must include today or yesterday to be "active"
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < dates.length; i++) {
        const prev = new Date(dates[i - 1]);
        const curr = new Date(dates[i]);
        const diff = Math.round((prev.getTime() - curr.getTime()) / 864e5);
        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

export function getStreakMessage(streak: number): string {
    if (streak === 0) return 'Start your streak today!';
    if (streak < 5) return 'Good start! Keep going.';
    if (streak < 10) return "You're consistent!";
    return "You're unstoppable 🔥";
}
