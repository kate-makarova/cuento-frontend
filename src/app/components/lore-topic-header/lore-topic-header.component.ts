import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-lore-topic-header',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './lore-topic-header.component.html',
})
export class LoreTopicHeaderComponent {
  @Input() topicId!: number;
  @Input() canEdit: boolean = false;
}
