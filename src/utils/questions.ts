import questionsData from "../../questions.json";
import { Question } from "./trait-engine";

export const QUESTIONS: Question[] = questionsData as Question[];

export function getQuestionById(id: number): Question | undefined {
  return QUESTIONS.find(q => q.id === id);
}

export function getAllQuestions(): Question[] {
  return QUESTIONS;
}
