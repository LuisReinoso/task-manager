// task-manager/task-manager.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IndexedDBStoreService } from '../store/indexeddb-store.service';
import { Task } from '../store/task-store.interface';

@Injectable({
  providedIn: 'root',
})
export class TaskManagerService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();
  public expandedTasks = new Set<number>();
  private nextId = 1;

  constructor(private store: IndexedDBStoreService) {
    this.loadTasks();
  }

  private async loadTasks() {
    const allTasks = await this.store.getAllTasks();
    if (allTasks.length > 0) {
      this.nextId = Math.max(...allTasks.map(task => task.id)) + 1;
      this.tasksSubject.next(allTasks);
    }
  }

  private async saveTask(task: Task) {
    await this.store.updateTask(task);
  }

  public async addTask(
    title: string,
    dueDate: Date | null,
    priority: 'high' | 'medium' | 'low'
  ) {
    const newTask: Task = {
      id: this.nextId++,
      title,
      subtasks: [],
      dueDate,
      priority,
      completed: false,
    };
    this.tasksSubject.next([...this.tasksSubject.getValue(), newTask]);
    await this.store.addTask(newTask);
    this.toggleSubtasks(newTask.id);
  }

  public async editTask(
    taskId: number,
    newTitle: string,
    newPriority: 'high' | 'medium' | 'low'
  ) {
    const updatedTasks = this.tasksSubject.getValue().map((task) =>
      task.id === taskId
        ? { ...task, title: newTitle, priority: newPriority }
        : task
    );
    this.tasksSubject.next(updatedTasks);
    const updatedTask = updatedTasks.find(task => task.id === taskId);
    if (updatedTask) {
      await this.saveTask(updatedTask);
    }
  }

  public async addSubtask(parentTaskId: number, subtaskTitle: string) {
    const updatedTasks = this.tasksSubject.getValue().map((task) => {
      if (task.id === parentTaskId) {
        const newSubtask: Task = {
          id: this.nextId++,
          title: subtaskTitle,
          subtasks: [],
          dueDate: null,
          priority: 'medium',
          completed: false,
        };
        task.subtasks.push(newSubtask);
        this.store.updateTask(task);
      }
      return task;
    });
    this.tasksSubject.next(updatedTasks);
  }

  public async editSubtask(
    parentTaskId: number,
    subtaskId: number,
    newTitle: string,
    newPriority: 'high' | 'medium' | 'low'
  ) {
    const updatedTasks = this.tasksSubject.getValue().map((task) => {
      if (task.id === parentTaskId) {
        task.subtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, title: newTitle, priority: newPriority }
            : subtask
        );
        this.store.updateTask(task);
      }
      return task;
    });
    this.tasksSubject.next(updatedTasks);
  }

  public async deleteTask(taskId: number) {
    const updatedTasks = this.tasksSubject
      .getValue()
      .filter((task) => task.id !== taskId);
    this.tasksSubject.next(updatedTasks);
    await this.store.deleteTask(taskId);
    this.expandedTasks.delete(taskId);
  }

  public async deleteSubtask(parentTaskId: number, subtaskId: number) {
    const updatedTasks = this.tasksSubject.getValue().map((task) => {
      if (task.id === parentTaskId) {
        task.subtasks = task.subtasks.filter(
          (subtask) => subtask.id !== subtaskId
        );
        this.store.updateTask(task);
      }
      return task;
    });
    this.tasksSubject.next(updatedTasks);
  }

  public async toggleTaskCompletion(taskId: number) {
    const updatedTasks = this.tasksSubject.getValue().map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    this.tasksSubject.next(updatedTasks);
    const updatedTask = updatedTasks.find(task => task.id === taskId);
    if (updatedTask) {
      await this.store.updateTask(updatedTask);
    }
  }

  public async toggleSubtaskCompletion(parentTaskId: number, subtaskId: number) {
    const updatedTasks = this.tasksSubject.getValue().map((task) => {
      if (task.id === parentTaskId) {
        task.subtasks = task.subtasks.map((subtask) =>
          subtask.id === subtaskId
            ? { ...subtask, completed: !subtask.completed }
            : subtask
        );
        this.store.updateTask(task);
      }
      return task;
    });
    this.tasksSubject.next(updatedTasks);
  }

  public async reorderTasks(newOrder: Task[]) {
    this.tasksSubject.next(newOrder);
    for (const task of newOrder) {
      await this.store.updateTask(task);
    }
  }

  public async reorderSubtasks(parentTaskId: number, newSubtasks: Task[]) {
    const updatedTasks = this.tasksSubject.getValue().map((task) => {
      if (task.id === parentTaskId) {
        task.subtasks = newSubtasks;
        this.store.updateTask(task);
      }
      return task;
    });
    this.tasksSubject.next(updatedTasks);
  }

  public async promoteSubtaskToTask(parentTaskId: number, subtaskId: number) {
    const updatedTasks = this.tasksSubject.getValue();
    let subtaskToPromote: Task | null = null;

    updatedTasks.forEach((task) => {
      if (task.id === parentTaskId) {
        const subtaskIndex = task.subtasks.findIndex(
          (sub) => sub.id === subtaskId
        );
        if (subtaskIndex !== -1) {
          subtaskToPromote = task.subtasks.splice(subtaskIndex, 1)[0];
          this.store.updateTask(task);
        }
      }
    });

    if (subtaskToPromote) {
      const promotedTask: Task = {
        ...subtaskToPromote as Task,
        dueDate: new Date(),
      };
      updatedTasks.push(promotedTask);
      this.tasksSubject.next([...updatedTasks]);
      await this.store.addTask(promotedTask);
    }
  }

  public toggleSubtasks(taskId: number) {
    if (this.expandedTasks.has(taskId)) {
      this.expandedTasks.delete(taskId);
    } else {
      this.expandedTasks.add(taskId);
    }
  }
}
