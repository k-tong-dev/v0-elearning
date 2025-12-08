/**
 * Test script to debug quiz line relationship issues
 * 
 * Run this in browser console or as a test to check:
 * 1. If quiz lines are being created
 * 2. If they're properly linked to quizzes
 * 3. What the actual data structure looks like
 */

import { getCertificateQuizzes } from "../quizStructure";
import { createCourseQuiz, createCourseQuizLine } from "../quizStructure";

export async function testQuizLineRelationship(quizId: number) {
    console.log(`\n=== Testing Quiz ID ${quizId} ===\n`);
    
    try {
        // First, try to fetch the quiz directly from Strapi
        const response = await fetch(
            `http://localhost:1337/api/course-quizs/${quizId}?populate=*`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        
        if (!response.ok) {
            console.error(`Failed to fetch quiz: ${response.status} ${response.statusText}`);
            // Try with filter instead
            const filterResponse = await fetch(
                `http://localhost:1337/api/course-quizs?filters[id][$eq]=${quizId}&populate=*`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            const filterData = await filterResponse.json();
            console.log("Quiz data (via filter):", JSON.stringify(filterData, null, 2));
            return filterData;
        }
        
        const data = await response.json();
        console.log("Quiz data:", JSON.stringify(data, null, 2));
        
        // Check quiz lines
        const quiz = data.data;
        const lines = quiz.course_quiz_lines;
        
        console.log("\n=== Quiz Lines Analysis ===");
        console.log("Lines type:", typeof lines);
        console.log("Lines value:", lines);
        
        if (lines?.data) {
            console.log("Lines found in .data:", lines.data.length);
            lines.data.forEach((line: any, idx: number) => {
                console.log(`Line ${idx + 1}:`, {
                    id: line.id,
                    documentId: line.documentId,
                    answer: line.answer,
                    is_correct: line.is_correct,
                    course_quiz: line.course_quiz,
                });
            });
        } else if (Array.isArray(lines)) {
            console.log("Lines found as array:", lines.length);
            lines.forEach((line: any, idx: number) => {
                console.log(`Line ${idx + 1}:`, {
                    id: line.id,
                    documentId: line.documentId,
                    answer: line.answer,
                    is_correct: line.is_correct,
                    course_quiz: line.course_quiz,
                });
            });
        } else {
            console.warn("No lines found or unexpected structure");
        }
        
        return data;
    } catch (error) {
        console.error("Error testing quiz:", error);
        throw error;
    }
}

export async function testCreateQuizWithLines() {
    console.log("\n=== Testing Create Quiz with Lines ===\n");
    
    try {
        // Create a test quiz
        const quiz = await createCourseQuiz({
            title: "Test Quiz",
            type: "radio",
            question_text: "Test question?",
            order_index: 0,
            is_require: true,
            duration: 60,
            certificate: 1, // Replace with actual certificate ID
        });
        
        if (!quiz || !quiz.id) {
            console.error("Failed to create quiz");
            return;
        }
        
        console.log("Created quiz:", quiz.id);
        
        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        // Create lines
        const line1 = await createCourseQuizLine({
            course_quiz: quiz.id,
            answer: "Option 1",
            is_correct: true,
        });
        
        const line2 = await createCourseQuizLine({
            course_quiz: quiz.id,
            answer: "Option 2",
            is_correct: false,
        });
        
        console.log("Created lines:", { line1: line1?.id, line2: line2?.id });
        
        // Wait a bit
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        // Fetch the quiz again to see if lines are linked
        const fetchedQuiz = await testQuizLineRelationship(quiz.id);
        
        return { quiz, line1, line2, fetchedQuiz };
    } catch (error) {
        console.error("Error in test:", error);
        throw error;
    }
}

// Usage in browser console:
// import { testQuizLineRelationship, testCreateQuizWithLines } from '@/integrations/strapi/__tests__/testQuizLines';
// await testQuizLineRelationship(45);
// await testCreateQuizWithLines();

