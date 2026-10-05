export type Role = "fire" | "police";

export interface Quiz {
  question: string;
  options: [string, string];
  correct: 0 | 1;
}

export interface Lesson {
  id: string;
  role: Role;
  icon: string;
  title: string;
  script: string;
  quiz: Quiz;
}

export const LESSONS: Lesson[] = [
  {
    id: "fire-119",
    role: "fire",
    icon: "📞",
    title: "불이 나면 119",
    script: "불이 나면 무서워도 침착하게 어른에게 알리고, 일일구에 전화해요. 주소와 불이 난 곳을 말해요.",
    quiz: { question: "불이 났어요! 어떻게 할까요?", options: ["📞", "🙈"], correct: 0 },
  },
  {
    id: "fire-stop",
    role: "fire",
    icon: "🛑",
    title: "멈춰 엎드려 뒹굴어",
    script: "옷에 불이 붙으면 뛰지 않아요. 멈춰서, 엎드려서, 뒹굴어요. 따라해 보세요. 멈춰, 엎드려, 뒹굴!",
    quiz: { question: "옷에 불이 붙었어요!", options: ["🏃", "🛑"], correct: 1 },
  },
  {
    id: "fire-smoke",
    role: "fire",
    icon: "😷",
    title: "연기가 나면 낮게",
    script: "연기가 나면 코와 입을 막고, 몸을 낮춰서 나가요. 엘리베이터 말고 계단으로 가요.",
    quiz: { question: "연기가 가득해요!", options: ["😷", "🧍"], correct: 0 },
  },
  {
    id: "fire-notouch",
    role: "fire",
    icon: "🚫",
    title: "불장난은 안돼요",
    script: "라이터와 성냥은 만지지 않아요. 불꽃놀이도 어른과 함께 멀리서 봐요.",
    quiz: { question: "라이터를 발견했어요!", options: ["👆", "🚫"], correct: 1 },
  },
  {
    id: "police-cross",
    role: "police",
    icon: "🚸",
    title: "횡단보도는 손들고",
    script: "길을 건널 땐 횡단보도에서 손을 들고, 왼쪽 오른쪽을 보고, 차가 멈추면 건너요.",
    quiz: { question: "길을 건널 땐?", options: ["🚸", "🏃"], correct: 0 },
  },
  {
    id: "police-light",
    role: "police",
    icon: "🚦",
    title: "빨간불엔 멈춰",
    script: "빨간불엔 멈춰 서요. 초록불이 켜져도 차를 보고 건너요.",
    quiz: { question: "빨간불이 켜졌어요!", options: ["🟢", "🔴"], correct: 1 },
  },
  {
    id: "police-lost",
    role: "police",
    icon: "👮",
    title: "길을 잃으면 도움요청",
    script: "길을 잃으면 울지 말고, 경찰관이나 가게 어른에게 도와주세요라고 말해요.",
    quiz: { question: "길을 잃었어요!", options: ["👮", "🏃"], correct: 0 },
  },
  {
    id: "police-stranger",
    role: "police",
    icon: "🙅",
    title: "낯선 사람 따라가지 않기",
    script: "모르는 사람이 과자를 준다고 해도 따라가지 않아요. 싫어요! 도와주세요! 하고 소리쳐요.",
    quiz: { question: "낯선 사람이 따라오래요!", options: ["🙅", "👣"], correct: 0 },
  },
];

export const lessonsOf = (role: Role) => LESSONS.filter((l) => l.role === role);
