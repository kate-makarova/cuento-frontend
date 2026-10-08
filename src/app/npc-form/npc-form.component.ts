import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NpcService } from '../services/npc.service';
import { BoardService } from '../services/board.service';
import { ArcNpc } from '../models/StoryArc';
import { SaveButtonComponent, SaveState } from '../admin/save-button/save-button.component';
import { CroppedImageFieldComponent } from '../components/cropped-image-field/cropped-image-field.component';

@Component({
  selector: 'app-npc-form',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, RouterLink, SaveButtonComponent, CroppedImageFieldComponent],
  templateUrl: './npc-form.component.html',
  styleUrl: './npc-form.component.css',
})
export class NpcFormComponent implements OnInit {
  private npcService = inject(NpcService);
  private boardService = inject(BoardService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChild('croppedImageRef') croppedImageRef?: CroppedImageFieldComponent;

  readonly canUpload = computed(() => this.boardService.board().use_image_uploading === 'y');
  readonly avatarWidth = computed(() => this.boardService.board().user_avatar_width ?? 100);
  readonly avatarHeight = computed(() => this.boardService.board().user_avatar_height ?? 100);

  isEdit = false;
  npcId: number | null = null;
  arcId: number | null = null;
  saveState = signal<SaveState>('idle');
  loading = signal(true);

  name = '';
  description = '';
  avatarUrl = '';
  displayOrder = 0;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.arcId = Number(this.route.snapshot.queryParamMap.get('arc_id')) || null;

    if (id) {
      this.isEdit = true;
      this.npcId = id;
      this.npcService.getNpc(id).subscribe({
        next: (npc) => {
          this.name = npc.name;
          this.description = npc.description ?? '';
          this.avatarUrl = npc.avatar ?? '';
          this.displayOrder = npc.display_order;
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/arc-list']),
      });
    } else {
      this.loading.set(false);
    }
  }

  submit(): void {
    if (this.saveState() === 'loading') return;
    this.saveState.set('loading');

    const avatar = this.canUpload()
      ? (this.croppedImageRef?.value || undefined)
      : (this.avatarUrl.trim() || undefined);

    if (this.isEdit && this.npcId) {
      this.npcService.updateNpc(this.npcId, {
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        avatar,
        display_order: this.displayOrder,
      }).subscribe({
        next: (npc) => {
          this.saveState.set('success');
          this.router.navigate(['/npc', npc.id]);
        },
        error: () => this.saveState.set('error'),
      });
    } else {
      if (!this.arcId) { this.saveState.set('error'); return; }
      this.npcService.createNpc({
        arc_id: this.arcId,
        name: this.name.trim(),
        description: this.description.trim() || undefined,
        avatar,
        display_order: this.displayOrder,
      }).subscribe({
        next: (npc) => {
          this.saveState.set('success');
          this.router.navigate(['/npc', npc.id]);
        },
        error: () => this.saveState.set('error'),
      });
    }
  }
}
