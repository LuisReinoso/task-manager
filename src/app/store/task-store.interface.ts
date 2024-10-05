// store/task-store.interface.ts
export interface Task {
  id: number;
  title: string;
  subtasks: Task[];
  dueDate: Date | null;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export interface TaskStoreInterface {
  getAllTasks(): Promise<Task[]>;
  addTask(task: Task): Promise<void>;
  updateTask(task: Task): Promise<void>;
  deleteTask(taskId: number): Promise<void>;
}
