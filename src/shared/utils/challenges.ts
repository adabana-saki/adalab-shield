/**
 * Challenge generation utilities for bypass verification
 */

import type {
  ChallengeType,
  ChallengeDifficulty,
  ChallengeData,
} from '@/shared/types';
import { CHALLENGE_EXPIRATION_SECONDS } from '@/shared/constants';

/**
 * Generate a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a math challenge based on difficulty
 */
function generateMathChallenge(difficulty: ChallengeDifficulty): {
  question: string;
  answer: string;
} {
  switch (difficulty) {
    case 'easy': {
      // Simple addition/subtraction with small numbers
      const a = randomInt(1, 20);
      const b = randomInt(1, 20);
      const isAddition = Math.random() > 0.5;
      if (isAddition) {
        return {
          question: `${a} + ${b} = ?`,
          answer: String(a + b),
        };
      } else {
        // Ensure non-negative result
        const larger = Math.max(a, b);
        const smaller = Math.min(a, b);
        return {
          question: `${larger} - ${smaller} = ?`,
          answer: String(larger - smaller),
        };
      }
    }

    case 'medium': {
      // Two-digit arithmetic or simple multiplication
      const operation = randomInt(0, 2);
      if (operation === 0) {
        // Two-digit addition
        const a = randomInt(10, 99);
        const b = randomInt(10, 99);
        return {
          question: `${a} + ${b} = ?`,
          answer: String(a + b),
        };
      } else if (operation === 1) {
        // Two-digit subtraction
        const a = randomInt(50, 99);
        const b = randomInt(10, 49);
        return {
          question: `${a} - ${b} = ?`,
          answer: String(a - b),
        };
      } else {
        // Simple multiplication
        const a = randomInt(2, 12);
        const b = randomInt(2, 12);
        return {
          question: `${a} × ${b} = ?`,
          answer: String(a * b),
        };
      }
    }

    case 'hard': {
      // Complex arithmetic including division
      const operation = randomInt(0, 3);
      if (operation === 0) {
        // Three-digit addition
        const a = randomInt(100, 999);
        const b = randomInt(100, 999);
        return {
          question: `${a} + ${b} = ?`,
          answer: String(a + b),
        };
      } else if (operation === 1) {
        // Multi-step calculation
        const a = randomInt(10, 50);
        const b = randomInt(2, 10);
        const c = randomInt(5, 20);
        return {
          question: `${a} × ${b} + ${c} = ?`,
          answer: String(a * b + c),
        };
      } else if (operation === 2) {
        // Division with exact result
        const b = randomInt(2, 12);
        const result = randomInt(5, 20);
        const a = b * result;
        return {
          question: `${a} ÷ ${b} = ?`,
          answer: String(result),
        };
      } else {
        // Square numbers
        const a = randomInt(5, 15);
        return {
          question: `${a}² = ?`,
          answer: String(a * a),
        };
      }
    }
  }
}

/**
 * Word lists for typing challenges
 */
const EASY_WORDS = [
  'focus',
  'work',
  'time',
  'goal',
  'task',
  'plan',
  'step',
  'grow',
  'learn',
  'build',
];

const MEDIUM_PHRASES = [
  'stay focused today',
  'one step at a time',
  'work before play',
  'choose wisely now',
  'be productive here',
  'focus on goals',
  'time is precious',
  'make it count',
];

const HARD_PHRASES = [
  'discipline is the bridge between goals and accomplishment',
  'the secret of getting ahead is getting started now',
  'small steps every day lead to big changes over time',
  'what you do today can improve all your tomorrows',
  'success is the sum of small efforts repeated daily',
];

/**
 * Generate a typing challenge based on difficulty
 */
function generateTypingChallenge(difficulty: ChallengeDifficulty): {
  question: string;
  answer: string;
} {
  switch (difficulty) {
    case 'easy': {
      // Type a single word
      const word = EASY_WORDS[randomInt(0, EASY_WORDS.length - 1)] ?? 'focus';
      return {
        question: `Type this word: "${word}"`,
        answer: word,
      };
    }

    case 'medium': {
      // Type a short phrase
      const phrase =
        MEDIUM_PHRASES[randomInt(0, MEDIUM_PHRASES.length - 1)] ??
        'stay focused';
      return {
        question: `Type this phrase: "${phrase}"`,
        answer: phrase,
      };
    }

    case 'hard': {
      // Type a longer sentence
      const phrase =
        HARD_PHRASES[randomInt(0, HARD_PHRASES.length - 1)] ?? 'stay focused';
      return {
        question: `Type this sentence: "${phrase}"`,
        answer: phrase,
      };
    }
  }
}

/**
 * Generate a pattern challenge (sequence completion)
 */
function generatePatternChallenge(difficulty: ChallengeDifficulty): {
  question: string;
  answer: string;
} {
  switch (difficulty) {
    case 'easy': {
      // Simple arithmetic sequence
      const start = randomInt(1, 10);
      const step = randomInt(1, 5);
      const sequence = [
        start,
        start + step,
        start + step * 2,
        start + step * 3,
      ];
      const answer = start + step * 4;
      return {
        question: `What comes next? ${sequence.join(', ')}, ?`,
        answer: String(answer),
      };
    }

    case 'medium': {
      // Multiplication sequence or skip counting
      const options = [
        // Powers of 2
        () => {
          const start = randomInt(0, 2);
          const sequence = [
            2 ** start,
            2 ** (start + 1),
            2 ** (start + 2),
            2 ** (start + 3),
          ];
          return {
            question: `What comes next? ${sequence.join(', ')}, ?`,
            answer: String(2 ** (start + 4)),
          };
        },
        // Fibonacci-like
        () => {
          const a = randomInt(1, 5);
          const b = randomInt(1, 5);
          const sequence = [a, b, a + b, b + (a + b)];
          const next = a + b + (b + (a + b));
          return {
            question: `What comes next? ${sequence.join(', ')}, ?`,
            answer: String(next),
          };
        },
      ];
      const generator = options[randomInt(0, options.length - 1)];
      return generator
        ? generator()
        : { question: '2, 4, 6, 8, ?', answer: '10' };
    }

    case 'hard': {
      // Complex sequences
      const options = [
        // Alternating pattern
        () => {
          const a = randomInt(1, 5);
          const b = randomInt(2, 4);
          const sequence = [a, a * b, a, a * b, a];
          return {
            question: `What comes next? ${sequence.join(', ')}, ?`,
            answer: String(a * b),
          };
        },
        // Triangular numbers
        () => {
          const sequence = [1, 3, 6, 10, 15];
          return {
            question: `What comes next? ${sequence.join(', ')}, ?`,
            answer: '21',
          };
        },
        // Prime numbers
        () => {
          const sequence = [2, 3, 5, 7, 11];
          return {
            question: `What comes next? ${sequence.join(', ')}, ?`,
            answer: '13',
          };
        },
      ];
      const generator = options[randomInt(0, options.length - 1)];
      return generator
        ? generator()
        : { question: '1, 1, 2, 3, 5, ?', answer: '8' };
    }
  }
}

/**
 * Generate a challenge of the specified type and difficulty
 */
export function generateChallenge(
  type: ChallengeType,
  difficulty: ChallengeDifficulty
): ChallengeData {
  let questionData: { question: string; answer: string };

  switch (type) {
    case 'math':
      questionData = generateMathChallenge(difficulty);
      break;
    case 'typing':
      questionData = generateTypingChallenge(difficulty);
      break;
    case 'pattern':
      questionData = generatePatternChallenge(difficulty);
      break;
  }

  return {
    type,
    difficulty,
    question: questionData.question,
    answer: questionData.answer,
    expiresAt: Date.now() + CHALLENGE_EXPIRATION_SECONDS * 1000,
  };
}

/**
 * Verify a challenge answer
 */
export function verifyChallengeAnswer(
  challenge: ChallengeData,
  userAnswer: string
): boolean {
  // Check if challenge has expired
  if (Date.now() > challenge.expiresAt) {
    return false;
  }

  // Normalize answers for comparison
  const normalizedUserAnswer = userAnswer.trim().toLowerCase();
  const normalizedCorrectAnswer = challenge.answer.trim().toLowerCase();

  return normalizedUserAnswer === normalizedCorrectAnswer;
}

/**
 * Check if a challenge is still valid (not expired)
 */
export function isChallengeValid(challenge: ChallengeData | null): boolean {
  if (!challenge) {
    return false;
  }
  return Date.now() < challenge.expiresAt;
}
