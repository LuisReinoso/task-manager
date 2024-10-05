// task-manager.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TaskManagerService } from './task-manager.service';
import {
  AsyncPipe,
  NgClass,
  NgFor,
  NgIf,
  TitleCasePipe,
} from '@angular/common';
import { OpenAIService } from '../services/openai.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { Task } from '../store/task-store.interface';

@Component({
  selector: 'app-task-manager',
  templateUrl: './task-manager.component.html',
  styleUrls: ['./task-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgFor,
    NgClass,
    AsyncPipe,
    NgIf,
    FormsModule,
    DragDropModule,
    TitleCasePipe,
  ],
})
export class TaskManagerComponent {
  public tasks$: Observable<Task[]> = this.taskManagerService.tasks$;
  public loadingTaskId$ = new BehaviorSubject<number | null>(null);
  public expandedTasks = this.taskManagerService.expandedTasks;

  // For adding new tasks
  public newTaskTitle: string = '';
  public newTaskPriority: 'high' | 'medium' | 'low' = 'medium';

  // For editing tasks
  public editingTaskId: number | null = null;
  public editingTaskTitle: string = '';
  public editingTaskPriority: 'high' | 'medium' | 'low' = 'medium';

  // For adding subtasks
  public newSubtaskTitle: { [key: number]: string } = {};

  // For editing subtasks
  public editingSubtaskId: { [key: number]: number | null } = {};
  public editingSubtaskTitle: { [key: number]: string } = {};
  public editingSubtaskPriority: { [key: number]: 'high' | 'medium' | 'low' } =
    {};

  constructor(
    private taskManagerService: TaskManagerService,
    private openAIService: OpenAIService
  ) {}

  public addTask(newTaskTitle: string, priority: 'high' | 'medium' | 'low') {
    if (!newTaskTitle.trim()) {
      return;
    }
    const currentDate = new Date(); // Automatically set to current date
    this.taskManagerService.addTask(newTaskTitle, currentDate, priority);
    this.newTaskTitle = '';
    this.newTaskPriority = 'medium';
  }

  public editTask(task: Task) {
    if (this.editingTaskId === task.id) {
      // Save changes
      if (!this.editingTaskTitle.trim()) {
        return;
      }
      this.taskManagerService.editTask(
        task.id,
        this.editingTaskTitle,
        this.editingTaskPriority
      );
      this.editingTaskId = null;
    } else {
      // Enter edit mode
      this.editingTaskId = task.id;
      this.editingTaskTitle = task.title;
      this.editingTaskPriority = task.priority;
    }
  }

  public addSubtask(parentTaskId: number, subtaskTitle: string) {
    if (!subtaskTitle.trim()) {
      return;
    }
    this.taskManagerService.addSubtask(parentTaskId, subtaskTitle);
    this.newSubtaskTitle[parentTaskId] = '';
  }

  public editSubtask(parentTaskId: number, subtask: Task) {
    if (this.editingSubtaskId[parentTaskId] === subtask.id) {
      // Save changes
      if (!this.editingSubtaskTitle[parentTaskId]?.trim()) {
        return;
      }
      this.taskManagerService.editSubtask(
        parentTaskId,
        subtask.id,
        this.editingSubtaskTitle[parentTaskId],
        this.editingSubtaskPriority[parentTaskId]
      );
      this.editingSubtaskId[parentTaskId] = null;
    } else {
      // Enter edit mode
      this.editingSubtaskId[parentTaskId] = subtask.id;
      this.editingSubtaskTitle[parentTaskId] = subtask.title;
      this.editingSubtaskPriority[parentTaskId] = subtask.priority;
    }
  }

  public generateSubtasks(taskTitle: string, taskId: number) {
    this.loadingTaskId$.next(taskId);
    this.openAIService.generateSubtasks(taskTitle).subscribe(
      (response) => {
        console.log(response.choices[0].message.content);

        try {
          const result = JSON.parse(response.choices[0].message.content);
          const generatedSubtasks = result.actions || [];
          generatedSubtasks.forEach((subtask: any) => {
            this.taskManagerService.addSubtask(taskId, subtask.title);
          });
        } catch (error) {
          console.error('Error parsing subtasks:', error);
        }

        this.loadingTaskId$.next(null);
      },
      (error) => {
        console.error('Error generating subtasks:', error);
        this.loadingTaskId$.next(null);
      }
    );
  }

  public deleteTask(taskId: number) {
    this.taskManagerService.deleteTask(taskId);
  }

  public deleteSubtask(parentTaskId: number, subtaskId: number) {
    this.taskManagerService.deleteSubtask(parentTaskId, subtaskId);
  }

  public toggleTaskCompletion(taskId: number) {
    this.taskManagerService.toggleTaskCompletion(taskId);
  }

  public toggleSubtaskCompletion(parentTaskId: number, subtaskId: number) {
    this.taskManagerService.toggleSubtaskCompletion(parentTaskId, subtaskId);
  }

  // Drag and Drop for Tasks
  public dropTask(event: CdkDragDrop<Task[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    this.tasks$
      .subscribe((tasks) => {
        const updatedTasks = [...tasks];
        const [movedTask] = updatedTasks.splice(event.previousIndex, 1);
        updatedTasks.splice(event.currentIndex, 0, movedTask);
        this.taskManagerService.reorderTasks(updatedTasks);
      })
      .unsubscribe();
  }

  // Drag and Drop for Subtasks
  public dropSubtasks(parentTask: Task, event: CdkDragDrop<Task[]>) {
    if (event.previousIndex === event.currentIndex) {
      return;
    }
    const updatedSubtasks = [...parentTask.subtasks];
    const [movedSubtask] = updatedSubtasks.splice(event.previousIndex, 1);
    updatedSubtasks.splice(event.currentIndex, 0, movedSubtask);
    this.taskManagerService.reorderSubtasks(parentTask.id, updatedSubtasks);
  }

  public promoteSubtaskToTask(parentTaskId: number, subtaskId: number) {
    this.taskManagerService.promoteSubtaskToTask(parentTaskId, subtaskId);
  }

  public toggleSubtasks(taskId: number) {
    this.taskManagerService.toggleSubtasks(taskId);
  }
}
