import { Component, OnInit } from '@angular/core';
import { ZaProgressTracker } from '@zurich/angular-components';
import { ButtonZ } from '../button-z/button-z';

@Component({
  selector: 'lib-progress-tracker-z',
  standalone: true,
  imports: [ZaProgressTracker, ButtonZ],
  templateUrl: './progress-tracker-z.html',
  styleUrl: './progress-tracker-z.scss',
})
export class ProgressTrackerZ implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
