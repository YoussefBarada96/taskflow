export type TaskDTO = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null; // "YYYY-MM-DD"
  assigneeId: string | null;
  commentCount: number;
};

export type CommentDTO = {
  id: string;
  body: string;
  createdAt: string; // ISO timestamp
  author: { id: string; name: string | null; email: string };
};

export type ListDTO = {
  id: string;
  name: string;
  tasks: TaskDTO[];
};

export type MemberDTO = {
  id: string;
  name: string | null;
  email: string;
};
