export interface SkillScore {
  skill: string;
  score: number;
}

export interface Analytics {
  totalAttempts: number;
  averageScore: number;
  skillScores: SkillScore[];
}
