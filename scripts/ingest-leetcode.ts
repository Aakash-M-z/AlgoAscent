/**
 * scripts/ingest-leetcode.ts
 *
 * Ingests the Kaggle LeetCode dataset into MongoDB.
 *
 * Dataset: https://www.kaggle.com/datasets/gzipchrist/leetcode-problem-dataset
 * Expected file: scripts/data/leetcode_problems.csv  (or .json)
 *
 * Usage:
 *   npx tsx scripts/ingest-leetcode.ts
 *   npx tsx scripts/ingest-leetcode.ts --file scripts/data/problems.json
 *   npx tsx scripts/ingest-leetcode.ts --dry-run   (validate only, no DB write)
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import mongoose from 'mongoose';
import { ProblemModel } from '../server/models.js';

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='))?.split('=')[1]
    ?? args[args.indexOf('--file') + 1]
    ?? null;
const DRY_RUN = args.includes('--dry-run');
const DEFAULT_FILE = path.resolve('scripts/data/leetcode_problems.csv');
const INPUT_FILE = fileArg ? path.resolve(fileArg) : DEFAULT_FILE;

// ── Topic normalisation map ───────────────────────────────────────────────────
// Maps raw Kaggle topic strings → your app's canonical topic names
const TOPIC_MAP: Record<string, string> = {
    'array': 'Arrays',
    'string': 'Strings',
    'hash table': 'Arrays',
    'dynamic programming': 'Dynamic Programming',
    'math': 'Math',
    'sorting': 'Arrays',
    'greedy': 'Greedy',
    'depth-first search': 'Graphs',
    'breadth-first search': 'Graphs',
    'binary search': 'Binary Search',
    'tree': 'Trees',
    'binary tree': 'Trees',
    'matrix': 'Arrays',
    'two pointers': 'Two Pointers',
    'bit manipulation': 'Bit Manipulation',
    'stack': 'Stacks',
    'heap (priority queue)': 'Heaps',
    'graph': 'Graphs',
    'prefix sum': 'Arrays',
    'sliding window': 'Sliding Window',
    'union find': 'Graphs',
    'linked list': 'Linked Lists',
    'trie': 'Trie',
    'backtracking': 'Backtracking',
    'recursion': 'Backtracking',
    'divide and conquer': 'Advanced Graphs',
    'design': 'Design',
    'monotonic stack': 'Stacks',
    'intervals': 'Intervals',
    'number theory': 'Math',
    'geometry': 'Math',
    'simulation': 'Math',
    'memoization': 'Dynamic Programming',
    'topological sort': 'Graphs',
    'shortest path': 'Graphs',
    'minimum spanning tree': 'Advanced Graphs',
};

// ── HTML stripper ─────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
    return html
        .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_, inner) => '\n' + inner + '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// ── Slug generator ────────────────────────────────────────────────────────────
function toSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

// ── Difficulty normaliser ─────────────────────────────────────────────────────
function normaliseDifficulty(raw: string): 'easy' | 'medium' | 'hard' | null {
    const d = raw.trim().toLowerCase();
    if (d === 'easy') return 'easy';
    if (d === 'medium') return 'medium';
    if (d === 'hard') return 'hard';
    return null;
}

// ── Topic resolver ────────────────────────────────────────────────────────────
function resolveTopic(rawTags: string): string {
    if (!rawTags) return 'Arrays';
    // Tags are usually pipe-separated or comma-separated
    const first = rawTags.split(/[|,]/)[0].trim().toLowerCase();
    return TOPIC_MAP[first] ?? 'Arrays';
}

// ── Tag normaliser ────────────────────────────────────────────────────────────
function normaliseTags(rawTags: string): string[] {
    if (!rawTags) return [];
    return rawTags
        .split(/[|,]/)
        .map(t => t.trim().toLowerCase().replace(/\s+/g, '-'))
        .filter(Boolean);
}

// ── Example extractor ─────────────────────────────────────────────────────────
// Pulls "Example N:" blocks from cleaned description text
function extractExamples(text: string): { examples: string[]; constraints: string } {
    const examples: string[] = [];
    const exampleRegex = /Example\s*\d*\s*:([\s\S]*?)(?=Example\s*\d*\s*:|Constraints:|$)/gi;
    let match: RegExpExecArray | null;
    while ((match = exampleRegex.exec(text)) !== null) {
        const ex = match[1].trim();
        if (ex) examples.push(ex);
    }

    const constraintMatch = text.match(/Constraints?:([\s\S]*?)(?=Follow-up:|Note:|$)/i);
    const constraints = constraintMatch ? constraintMatch[1].trim() : '';

    return { examples, constraints };
}

// ── Test case generator ───────────────────────────────────────────────────────
// Parses "Input: ... Output: ..." from example blocks
function extractTestCases(examples: string[]): { input: string; output: string }[] {
    return examples
        .map(ex => {
            const inputMatch = ex.match(/Input\s*:\s*(.+?)(?=Output\s*:|$)/is);
            const outputMatch = ex.match(/Output\s*:\s*(.+?)(?=Explanation\s*:|$)/is);
            if (!inputMatch || !outputMatch) return null;
            return {
                input: inputMatch[1].trim().replace(/\n/g, ' '),
                output: outputMatch[1].trim().replace(/\n/g, ' '),
            };
        })
        .filter((tc): tc is { input: string; output: string } => tc !== null);
}

// ── Raw row type (Kaggle CSV columns) ─────────────────────────────────────────
interface RawRow {
    id?: string;
    frontend_id?: string;
    question_id?: string;
    title?: string;
    name?: string;
    difficulty?: string;
    content?: string;
    description?: string;
    topic_tags?: string;
    tags?: string;
    related_topics?: string;
    acceptance_rate?: string;
    paid_only?: string;
    is_premium?: string;
    url?: string;
    title_slug?: string;
    slug?: string;
    [key: string]: string | undefined;
}

// ── Transform one raw row → clean Problem document ───────────────────────────
interface CleanProblem {
    leetcodeId: number;
    title: string;
    slug: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic: string;
    description: string;
    examples: string[];
    constraints: string;
    testCases: { input: string; output: string }[];
    tags: string[];
    acceptanceRate: number | undefined;
    isPremium: boolean;
    url: string;
}

function transformRow(row: RawRow, index: number): CleanProblem | null {
    // ── ID ──
    const rawId = row.id ?? row.frontend_id ?? row.question_id ?? '';
    const leetcodeId = parseInt(rawId, 10);
    if (isNaN(leetcodeId) || leetcodeId <= 0) {
        console.warn(`[row ${index}] Skipping — invalid id: "${rawId}"`);
        return null;
    }

    // ── Title ──
    const title = (row.title ?? row.name ?? '').trim();
    if (!title) {
        console.warn(`[row ${index}] Skipping — missing title`);
        return null;
    }

    // ── Difficulty ──
    const difficulty = normaliseDifficulty(row.difficulty ?? '');
    if (!difficulty) {
        console.warn(`[row ${index}] Skipping "${title}" — unknown difficulty: "${row.difficulty}"`);
        return null;
    }

    // ── Description ──
    const rawContent = row.content ?? row.description ?? '';
    const description = stripHtml(rawContent);

    // ── Examples + Constraints ──
    const { examples, constraints } = extractExamples(description);

    // ── Test cases ──
    const testCases = extractTestCases(examples);

    // ── Tags + Topic ──
    const rawTags = row.topic_tags ?? row.tags ?? row.related_topics ?? '';
    const tags = normaliseTags(rawTags);
    const topic = resolveTopic(rawTags);

    // ── Slug ──
    const slug = row.title_slug ?? row.slug ?? toSlug(title);

    // ── Acceptance rate ──
    const rawRate = row.acceptance_rate ?? '';
    const acceptanceRate = rawRate ? parseFloat(rawRate.replace('%', '')) : undefined;

    // ── Premium ──
    const isPremium = ['true', '1', 'yes'].includes((row.paid_only ?? row.is_premium ?? '').toLowerCase());

    // ── URL ──
    const url = row.url ?? `https://leetcode.com/problems/${slug}/`;

    return {
        leetcodeId, title, slug, difficulty, topic,
        description, examples, constraints, testCases,
        tags, acceptanceRate, isPremium, url,
    };
}

// ── File reader — supports CSV and JSON ───────────────────────────────────────
function readDataset(filePath: string): RawRow[] {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Dataset file not found: ${filePath}\nDownload from: https://www.kaggle.com/datasets/gzipchrist/leetcode-problem-dataset`);
    }

    const ext = path.extname(filePath).toLowerCase();
    const raw = fs.readFileSync(filePath, 'utf-8');

    if (ext === '.json') {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : parsed.problems ?? parsed.data ?? [];
    }

    if (ext === '.csv') {
        return parse(raw, {
            columns: true,           // first row = headers
            skip_empty_lines: true,
            trim: true,
            relax_quotes: true,
            relax_column_count: true,
        }) as RawRow[];
    }

    throw new Error(`Unsupported file format: ${ext}. Use .csv or .json`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
    console.log('\n🚀 LeetCode Dataset Ingestion');
    console.log(`   File     : ${INPUT_FILE}`);
    console.log(`   Dry run  : ${DRY_RUN}`);
    console.log(`   MongoDB  : ${process.env.MONGODB_URI ? '✓ URI present' : '✗ MONGODB_URI not set'}\n`);

    // ── 1. Read dataset ──
    console.log('📂 Reading dataset...');
    const rows = readDataset(INPUT_FILE);
    console.log(`   Found ${rows.length} raw rows\n`);

    // ── 2. Transform ──
    console.log('🔄 Transforming rows...');
    const problems: CleanProblem[] = [];
    const skipped: number[] = [];

    rows.forEach((row, i) => {
        const p = transformRow(row, i + 1);
        if (p) problems.push(p);
        else skipped.push(i + 1);
    });

    console.log(`   ✓ Valid   : ${problems.length}`);
    console.log(`   ✗ Skipped : ${skipped.length}`);

    // ── 3. Deduplicate by leetcodeId ──
    const seen = new Set<number>();
    const deduped = problems.filter(p => {
        if (seen.has(p.leetcodeId)) return false;
        seen.add(p.leetcodeId);
        return true;
    });
    console.log(`   After dedup: ${deduped.length} unique problems\n`);

    if (DRY_RUN) {
        console.log('🔍 Dry run — sample output (first 3):');
        deduped.slice(0, 3).forEach(p => {
            console.log(`   [${p.leetcodeId}] ${p.title} | ${p.difficulty} | ${p.topic} | tags: ${p.tags.slice(0, 3).join(', ')}`);
        });
        console.log('\n✅ Dry run complete. No data written.\n');
        return;
    }

    // ── 4. Connect to MongoDB ──
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not set in .env');
    }
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✓ Connected\n');

    // ── 5. Bulk upsert in batches of 200 ──
    const BATCH = 200;
    let inserted = 0;
    let updated = 0;
    let errors = 0;

    console.log(`📥 Inserting ${deduped.length} problems in batches of ${BATCH}...`);

    for (let i = 0; i < deduped.length; i += BATCH) {
        const batch = deduped.slice(i, i + BATCH);

        const ops = batch.map(p => ({
            updateOne: {
                filter: { leetcodeId: p.leetcodeId },
                update: { $set: p },
                upsert: true,
            },
        }));

        try {
            const result = await ProblemModel.bulkWrite(ops, { ordered: false });
            inserted += result.upsertedCount;
            updated += result.modifiedCount;
            const done = Math.min(i + BATCH, deduped.length);
            process.stdout.write(`\r   Progress: ${done}/${deduped.length} (${Math.round(done / deduped.length * 100)}%)`);
        } catch (err: any) {
            errors++;
            console.error(`\n   ⚠️  Batch ${Math.floor(i / BATCH) + 1} error:`, err?.message?.slice(0, 120));
        }
    }

    console.log(`\n\n✅ Done!`);
    console.log(`   Inserted : ${inserted}`);
    console.log(`   Updated  : ${updated}`);
    console.log(`   Errors   : ${errors}`);

    // ── 6. Stats ──
    const total = await ProblemModel.countDocuments();
    const byDiff = await ProblemModel.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);
    console.log(`\n📊 Collection stats (total: ${total}):`);
    byDiff.forEach(d => console.log(`   ${d._id.padEnd(8)}: ${d.count}`));
    console.log('');

    await mongoose.disconnect();
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err?.message ?? err);
    process.exit(1);
});
