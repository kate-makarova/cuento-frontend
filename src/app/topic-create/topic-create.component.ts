import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { LongTextFieldComponent } from '../components/long-text-field/long-text-field.component';
import { CharacterProfileComponent } from '../components/character-profile/character-profile.component';
import { AuthService } from '../services/auth.service';
import { TopicService } from '../services/topic.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CreateTopicRequest } from '../models/Topic';

@Component({
  selector: 'app-topic-create',
  imports: [LongTextFieldComponent, CharacterProfileComponent],
  templateUrl: './topic-create.component.html',
  standalone: true,
  styleUrl: './topic-create.component.css'
})
export class TopicCreateComponent implements OnInit {
  private authService = inject(AuthService);
  private topicService = inject(TopicService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  accountName = this.authService.currentUser()?.username || 'Guest';
  selectedCharacterId: number | null = null;
  subforumId: number = 0;

  @ViewChild(LongTextFieldComponent) messageField!: LongTextFieldComponent;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['fid']) {
        this.subforumId = +params['fid'];
      }
    });
  }

  onCharacterSelected(characterId: number | null) {
    this.selectedCharacterId = characterId;
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = formData.get('req_subject') as string;
    const content = this.messageField.messageField.nativeElement.value;

    if (!title || !content || !this.subforumId) {
      console.error('Missing required fields');
      return;
    }

    const request: CreateTopicRequest = {
      subforum_id: this.subforumId,
      title: title,
      content: content,
      use_character_profile: this.selectedCharacterId !== null,
      character_profile_id: this.selectedCharacterId
    };

    this.topicService.createTopic(request).subscribe({
      next: (response: any) => {
        console.log('Topic created successfully', response);
        // Assuming response contains the new topic ID, redirect to it
        // If not, redirect to the subforum
        if (response && response.id) {
            this.router.navigate(['/viewtopic', response.id]);
        } else {
            this.router.navigate(['/viewforum', this.subforumId]);
        }
      },
      error: (err) => console.error('Failed to create topic', err)
    });
  }
}
