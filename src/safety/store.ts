import { create } from "zustand";
import type { Role } from "./lessons";

export type Phase = "home" | "learn" | "quiz" | "done";

interface SafetyState {
  phase: Phase;
  role: Role;
  step: number;
  quizStep: number;
  stars: number;
  setRole: (role: Role) => void;
  setPhase: (phase: Phase) => void;
  next: () => void;
  nextQuiz: () => void;
  addStar: () => void;
  reset: () => void;
}

export const useSafety = create<SafetyState>((set) => ({
  phase: "home",
  role: "fire",
  step: 0,
  quizStep: 0,
  stars: 0,
  setRole: (role) => set({ role, step: 0, quizStep: 0, stars: 0 }),
  setPhase: (phase) => set({ phase }),
  next: () => set((s) => ({ step: s.step + 1 })),
  nextQuiz: () => set((s) => ({ quizStep: s.quizStep + 1 })),
  addStar: () => set((s) => ({ stars: s.stars + 1 })),
  reset: () => set({ phase: "home", step: 0, quizStep: 0, stars: 0 }),
}));
