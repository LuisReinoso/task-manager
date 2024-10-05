import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskManagerComponent } from './task-manager/task-manager.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TaskManagerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
