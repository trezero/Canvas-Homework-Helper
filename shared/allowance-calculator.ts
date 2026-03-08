import { Assignment } from "./schema";
import { parseISO, isWithinInterval } from "date-fns";

export function getCurrentAllowancePeriod(periodStartDate: Date, periodWeeks: number) {
    // periodStartDate is aligned to a Monday
    // we count how many `periodWeeks` intervals have passed since periodStartDate
    const now = new Date();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weeksDiff = Math.floor((now.getTime() - periodStartDate.getTime()) / msPerWeek);
    const periodsPassed = Math.floor(weeksDiff / periodWeeks);

    // Handle case where periodStartDate is in the future gracefully
    const actualPeriodsPassed = Math.max(0, periodsPassed);

    const currentPeriodStart = new Date(periodStartDate.getTime() + actualPeriodsPassed * periodWeeks * msPerWeek);
    const currentPeriodEnd = new Date(currentPeriodStart.getTime() + periodWeeks * msPerWeek - 1);

    return { start: currentPeriodStart, end: currentPeriodEnd };
}

export function isAssignmentInPeriod(assignment: Assignment, periodStart: Date, periodEnd: Date) {
    if (!assignment.dueDate) return false;
    // If it's literally just a date string "2024-10-10", parseISO works safely.
    const dueDate = parseISO(assignment.dueDate);
    // date-fns isWithinInterval throws an error if the date is Invalid Date, so let's safeguard it
    if (isNaN(dueDate.getTime())) return false;

    return isWithinInterval(dueDate, { start: periodStart, end: periodEnd });
}

export function isAssignmentCompleted(assignment: Assignment) {
    // An assignment is considered complete and earns its value if there is a score, grade, or hasSubmission is true
    return (
        assignment.hasSubmission ||
        (assignment.score !== null && assignment.score !== undefined) ||
        (assignment.grade !== null && assignment.grade !== undefined) ||
        assignment.completed
    );
}

export function calculateAssignmentBaseWeight(assignment: Assignment) {
    // Use pointsPossible as the base weight, defaulting to 10 if null/0 to avoid 0 sum
    return assignment.pointsPossible && assignment.pointsPossible > 0
        ? assignment.pointsPossible
        : 10;
}

export function calculateAssignmentValue(
    assignment: Assignment,
    allAssignmentsInPeriod: Assignment[],
    minAllowance: number,
    maxAllowance: number
): number {
    if (allAssignmentsInPeriod.length === 0) return 0;

    const totalAllowancePool = maxAllowance - minAllowance;
    if (totalAllowancePool <= 0) return 0;

    // Calculate base weights for all assignments
    const getWeight = (a: Assignment) => {
        let weight = calculateAssignmentBaseWeight(a);

        // Urgency Multiplier: Give a 1.5x boost if late, missing, missing_available, or due within 48 hours
        const isLateOrMissing = a.isLate || a.isMissing || ['missing', 'missing_available', 'submitted_late'].includes(a.status);
        let dueSoon = false;
        if (a.dueDate) {
            const dueDate = parseISO(a.dueDate);
            if (!isNaN(dueDate.getTime())) {
                const msDiff = dueDate.getTime() - Date.now();
                dueSoon = msDiff > 0 && msDiff < 48 * 60 * 60 * 1000;
            }
        }

        if (isLateOrMissing || dueSoon) {
            weight *= 1.5;
        }

        return weight;
    };

    const totalWeight = allAssignmentsInPeriod.reduce((sum, a) => sum + getWeight(a), 0);
    if (totalWeight === 0) return 0;

    const assignmentWeight = getWeight(assignment);
    const rawValue = (assignmentWeight / totalWeight) * totalAllowancePool;

    // Round to nearest 2 decimals
    return Math.round(rawValue * 100) / 100;
}

export function calculateCurrentAllowancePool(
    allAssignmentsInPeriod: Assignment[],
    minAllowance: number,
    maxAllowance: number
): number {
    let earned = minAllowance;
    for (const assignment of allAssignmentsInPeriod) {
        if (isAssignmentCompleted(assignment)) {
            earned += calculateAssignmentValue(assignment, allAssignmentsInPeriod, minAllowance, maxAllowance);
        }
    }
    return Math.min(earned, maxAllowance);
}

export function calculateSuggestedMinAllowance(
    allAssignments: Assignment[],
    maxAllowance: number
): number {
    // Logic: Calculate missing assignments vs total
    const missingAssignments = allAssignments.filter(a => a.isMissing || ['missing', 'missing_available'].includes(a.status));
    const totalCount = allAssignments.length;

    if (totalCount === 0) return Math.floor(maxAllowance * 0.5); // Default to half if no data

    const missingRatio = missingAssignments.length / totalCount;

    // If no missing assignments, suggested min is 80% of max
    // If everything is missing, suggested min is 20% of max
    // Interpolate between 20% and 80% based on missingRatio
    const minPercent = 0.8 - (0.6 * missingRatio);

    // Round to nearest multiple of 5 for a clean number
    const suggestedValue = maxAllowance * minPercent;
    return Math.max(0, Math.round(suggestedValue / 5) * 5); // Ensure it doesn't go negative
}
