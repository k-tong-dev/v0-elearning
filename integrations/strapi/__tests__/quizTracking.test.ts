/**
 * Test file for Quiz Tracking Integration
 * 
 * This file demonstrates how to use the quiz tracking APIs.
 * Run these tests after creating the Strapi content types.
 * 
 * To test manually, you can copy these examples into a browser console
 * or create a test page in your Next.js app.
 */

import {
    createQuizAttempt,
    updateQuizAttempt,
    getQuizAttempts,
    getQuizAttempt,
    deleteQuizAttempt,
} from "../quizAttempt";
import {
    createQuizAttemptAnswer,
    updateQuizAttemptAnswer,
    getQuizAttemptAnswers,
    getQuizAttemptAnswer,
    deleteQuizAttemptAnswer,
} from "../quizAttemptAnswer";
import {
    createCertificateIssuance,
    updateCertificateIssuance,
    getCertificateIssuances,
    getCertificateIssuance,
    deleteCertificateIssuance,
} from "../certificateIssuance";

/**
 * Example: Complete Quiz Flow
 * 
 * 1. User starts a quiz attempt
 * 2. User answers questions (creates attempt answers)
 * 3. Quiz is submitted and graded
 * 4. Certificate is issued if score meets criteria
 */
export async function testCompleteQuizFlow() {
    const userId = 1; // Replace with actual user ID
    const certificateProgramId = 1; // Replace with actual certificate program ID
    const courseContentId = 1; // Optional: Replace with actual course content ID

    try {
        // Step 1: Create quiz attempt
        console.log("Step 1: Creating quiz attempt...");
        const attempt = await createQuizAttempt({
            user: userId,
            certificate_program: certificateProgramId,
            course_content: courseContentId,
            attempt_status: "in_progress",
            max_score: 100,
        });

        if (!attempt) {
            throw new Error("Failed to create quiz attempt");
        }
        console.log("✅ Quiz attempt created:", attempt.id);

        // Step 2: Create answers (example with 2 questions)
        console.log("Step 2: Creating quiz attempt answers...");
        const question1Id = 1; // Replace with actual course-quiz ID
        const question2Id = 2; // Replace with actual course-quiz ID
        const selectedLine1Id = 5; // Replace with actual course-quiz-line ID (correct answer)
        const selectedLine2Id = 8; // Replace with actual course-quiz-line ID (correct answer)

        const answer1 = await createQuizAttemptAnswer({
            quiz_attempt: attempt.id,
            course_quiz: question1Id,
            selected_line: selectedLine1Id,
            is_correct: true,
            points_awarded: 50,
        });

        const answer2 = await createQuizAttemptAnswer({
            quiz_attempt: attempt.id,
            course_quiz: question2Id,
            selected_line: selectedLine2Id,
            is_correct: true,
            points_awarded: 50,
        });

        console.log("✅ Answers created:", { answer1: answer1?.id, answer2: answer2?.id });

        // Step 3: Submit and grade the attempt
        console.log("Step 3: Submitting and grading quiz attempt...");
        const finalScore = 100; // Calculate from answers
        const completedAttempt = await updateQuizAttempt(attempt.id, {
            attempt_status: "graded",
            score: finalScore,
            completed_at: new Date().toISOString(),
            duration_seconds: 300, // 5 minutes
        });

        console.log("✅ Quiz attempt graded:", finalScore);

        // Step 4: Issue certificate if score meets criteria
        const minScoreToPass = 70; // Get from certificate program
        if (finalScore >= minScoreToPass) {
            console.log("Step 4: Issuing certificate...");
            const issuance = await createCertificateIssuance({
                certificate_program: certificateProgramId,
                user: userId,
                quiz_attempt: attempt.id,
                issued_at: new Date().toISOString(),
                issuance_status: "active",
                metadata: {
                    seal_number: `CERT-${new Date().getFullYear()}-${String(attempt.id).padStart(3, "0")}`,
                    verification_code: `VERIFY-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
                    issued_by: "system",
                },
            });

            // Link the certificate issuance back to the quiz attempt
            if (issuance) {
                await updateQuizAttempt(attempt.id, {
                    issued_certificate: issuance.id,
                });
                console.log("✅ Certificate issued:", issuance.id);
            }
        }

        console.log("✅ Complete quiz flow test passed!");
        return { attempt, issuance: null };
    } catch (error) {
        console.error("❌ Test failed:", error);
        throw error;
    }
}

/**
 * Example: Get all quiz attempts for a user
 */
export async function testGetUserQuizAttempts(userId: number) {
    const attempts = await getQuizAttempts({
        userId,
    });
    console.log(`Found ${attempts.length} quiz attempts for user ${userId}`);
    return attempts;
}

/**
 * Example: Get all answers for a quiz attempt
 */
export async function testGetQuizAttemptAnswers(quizAttemptId: number) {
    const answers = await getQuizAttemptAnswers({
        quizAttemptId,
    });
    console.log(`Found ${answers.length} answers for attempt ${quizAttemptId}`);
    return answers;
}

/**
 * Example: Get all certificates issued to a user
 */
export async function testGetUserCertificates(userId: number) {
    const issuances = await getCertificateIssuances({
        userId,
        issuanceStatus: "active",
    });
    console.log(`Found ${issuances.length} active certificates for user ${userId}`);
    return issuances;
}

/**
 * Example: Get all attempts for a certificate program
 */
export async function testGetCertificateProgramAttempts(certificateProgramId: number) {
    const attempts = await getQuizAttempts({
        certificateProgramId,
    });
    console.log(`Found ${attempts.length} attempts for certificate program ${certificateProgramId}`);
    return attempts;
}

/**
 * Example: Revoke a certificate
 */
export async function testRevokeCertificate(issuanceId: number) {
    const updated = await updateCertificateIssuance(issuanceId, {
        issuance_status: "revoked",
        revoked_at: new Date().toISOString(),
    });
    console.log("Certificate revoked:", updated?.id);
    return updated;
}

// Export all test functions
export const quizTrackingTests = {
    testCompleteQuizFlow,
    testGetUserQuizAttempts,
    testGetQuizAttemptAnswers,
    testGetUserCertificates,
    testGetCertificateProgramAttempts,
    testRevokeCertificate,
};

