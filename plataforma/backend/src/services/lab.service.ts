/**
 * Lab Service
 * Business logic for labs and code execution
 */

import { prisma } from '../utils/prisma';
import axios from 'axios';
import { config } from '../config';

interface ExecutionResult {
  output: string;
  error: string;
  executionTime: number;
}

class LabService {
  /**
   * Get a lab by ID with details
   * @param labId - Lab ID
   * @param userId - User ID to check enrollment
   */
  async getLab(labId: string, userId: string) {
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    if (!lab) {
      throw new Error('Lab no encontrado');
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lab.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Get user's previous submissions
    const submissions = await prisma.labSubmission.findMany({
      where: {
        userId,
        labId,
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        passed: true,
        score: true,
        submittedAt: true,
        executionTime: true,
      },
    });

    const hasPassed = submissions.some((sub) => sub.passed);
    const bestScore = submissions.length > 0
      ? Math.max(...submissions.map((s) => s.score))
      : 0;

    return {
      id: lab.id,
      title: lab.title,
      description: lab.description,
      language: lab.language,
      starterCode: lab.starterCode,
      testCases: lab.testCases, // Test cases are visible to students
      passingScore: lab.passingScore,
      timeLimit: lab.timeLimit,
      submissions,
      hasPassed,
      bestScore,
    };
  }

  /**
   * Execute code in the executor service
   * @param code - User's code
   * @param language - Programming language
   * @param timeLimit - Execution time limit in seconds
   */
  private async executeCode(
    code: string,
    language: string,
    timeLimit: number
  ): Promise<ExecutionResult> {
    try {
      const executorUrl = config.executorServiceUrl || 'http://ciber-executor:5000';

      const response = await axios.post(
        `${executorUrl}/execute`,
        {
          code,
          language,
          timeout: timeLimit,
        },
        {
          timeout: (timeLimit + 5) * 1000, // Add 5 seconds buffer
        }
      );

      return {
        output: response.data.output || '',
        error: response.data.error || '',
        executionTime: response.data.executionTime || 0,
      };
    } catch (error: any) {
      if (error.response) {
        return {
          output: '',
          error: error.response.data?.error || 'Error de ejecución',
          executionTime: 0,
        };
      }
      throw new Error('No se pudo conectar con el servicio de ejecución');
    }
  }

  /**
   * Run test cases against user's code
   * @param code - User's code
   * @param testCases - Array of test cases
   * @param language - Programming language
   * @param timeLimit - Execution time limit
   */
  private async runTestCases(
    code: string,
    testCases: any[],
    language: string,
    timeLimit: number
  ) {
    const results = [];
    let passedTests = 0;

    for (const testCase of testCases) {
      try {
        // Append test case input/execution to user's code
        let testCode = code;

        if (language === 'python') {
          testCode += `\n\n# Test case\n${testCase.input}`;
        } else if (language === 'javascript' || language === 'node') {
          testCode += `\n\n// Test case\n${testCase.input}`;
        } else if (language === 'bash') {
          testCode += `\n\n# Test case\n${testCase.input}`;
        }

        const result = await this.executeCode(testCode, language, timeLimit);

        const passed = result.output.trim() === testCase.expectedOutput.trim() && !result.error;

        if (passed) {
          passedTests++;
        }

        results.push({
          testCase: testCase.description || `Test ${results.length + 1}`,
          passed,
          output: result.output,
          expectedOutput: testCase.expectedOutput,
          error: result.error,
          executionTime: result.executionTime,
        });
      } catch (error: any) {
        results.push({
          testCase: testCase.description || `Test ${results.length + 1}`,
          passed: false,
          output: '',
          expectedOutput: testCase.expectedOutput,
          error: error.message || 'Error ejecutando prueba',
          executionTime: 0,
        });
      }
    }

    const score = testCases.length > 0
      ? Math.round((passedTests / testCases.length) * 100)
      : 0;

    return {
      results,
      passedTests,
      totalTests: testCases.length,
      score,
    };
  }

  /**
   * Submit a lab solution
   * @param labId - Lab ID
   * @param userId - User ID
   * @param code - User's code
   */
  async submitLabSolution(labId: string, userId: string, code: string) {
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      include: {
        module: {
          select: {
            courseId: true,
          },
        },
      },
    });

    if (!lab) {
      throw new Error('Lab no encontrado');
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lab.module.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new Error('No estás inscrito en este curso');
    }

    // Run test cases
    const testCases = Array.isArray(lab.testCases) ? lab.testCases : [];
    const testResults = await this.runTestCases(
      code,
      testCases,
      lab.language,
      lab.timeLimit || 30
    );

    const passed = testResults.score >= (lab.passingScore || 70);

    // Create submission
    const submission = await prisma.labSubmission.create({
      data: {
        userId,
        labId,
        code,
        output: JSON.stringify(testResults.results),
        passed,
        score: testResults.score,
        executionTime: testResults.results.reduce(
          (sum, r) => sum + (r.executionTime || 0),
          0
        ),
        submittedAt: new Date(),
      },
    });

    return {
      submissionId: submission.id,
      passed,
      score: testResults.score,
      passingScore: lab.passingScore || 70,
      results: testResults.results,
      passedTests: testResults.passedTests,
      totalTests: testResults.totalTests,
    };
  }

  /**
   * Get lab submission details
   * @param submissionId - Submission ID
   * @param userId - User ID
   */
  async getLabSubmission(submissionId: string, userId: string) {
    const submission = await prisma.labSubmission.findUnique({
      where: { id: submissionId },
      include: {
        lab: {
          select: {
            id: true,
            title: true,
            language: true,
            passingScore: true,
          },
        },
      },
    });

    if (!submission) {
      throw new Error('Envío no encontrado');
    }

    if (submission.userId !== userId) {
      throw new Error('No tienes permiso para ver este envío');
    }

    let results = [];
    try {
      results = JSON.parse(submission.output as string);
    } catch {
      results = [];
    }

    return {
      submissionId: submission.id,
      code: submission.code,
      passed: submission.passed,
      score: submission.score,
      submittedAt: submission.submittedAt,
      executionTime: submission.executionTime,
      lab: submission.lab,
      results,
    };
  }

  /**
   * Get all submissions for a lab by a user
   * @param labId - Lab ID
   * @param userId - User ID
   */
  async getLabSubmissions(labId: string, userId: string) {
    const submissions = await prisma.labSubmission.findMany({
      where: {
        userId,
        labId,
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        passed: true,
        score: true,
        submittedAt: true,
        executionTime: true,
      },
    });

    return submissions;
  }
}

export default new LabService();
