import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NpcService } from '../services/npc.service';
import { ArcService } from '../services/arc.service';
import { BoardService } from '../services/board.service';
import { SaveButtonComponent, SaveState } from '../admin/save-button/save-button.component';
import { CroppedImageFieldComponent } from '../components/cropped-image-field/cropped-image-field.component';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-npc-form',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [FormsModule, RouterLink, SaveButtonComponent, CroppedImageFieldComponent, BreadcrumbsComponent],
  templateUrl: './npc-form.component.html',
  styleUrl: './npc-form.component.css',
})
export class NpcFormComponent implements OnInit {
  private npcService = inject(NpcService);
  private arcService = inject(ArcService);
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
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  name = '';
  description = '';
  avatarUrl = '';
  displayOrder = 0;

  private readonly arcListCrumb: BreadcrumbItem = {
    label: $localize`:@@npcform.breadcrumbArcList:Story Arcs`,
    link: '/arc-list',
  };

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.arcId = Number(this.route.snapshot.queryParamMap.get('arc_id')) || null;
    const arcTitle = this.route.snapshot.queryParamMap.get('arc_title');

    if (id) {
      // Edit mode — load NPC, get arc context from response
      this.isEdit = true;
      this.npcId = id;
      this.npcService.getNpc(id).subscribe({
        next: (npc) => {
          this.name = npc.name;
          this.description = npc.description ?? '';
          this.avatarUrl = npc.avatar ?? '';
          this.displayOrder = npc.display_order;
          if (npc.arc) this.arcId = npc.arc.id;

          this.breadcrumbs.set([
            this.arcListCrumb,
            ...(npc.arc ? [{ label: npc.arc.title, link: `/arc/${npc.arc.id}` }] : []),
            { label: npc.name, link: `/npc/${npc.id}` },
            { label: $localize`:@@npcform.breadcrumbEdit:Edit NPC` },
          ]);
          this.loading.set(false);
        },
        error: () => this.router.navigate(['/arc-list']),
      });
    } else {
      // Create mode — arc context comes from query params
      if (this.arcId && arcTitle) {
        this.breadcrumbs.set([
          this.arcListCrumb,
          { label: arcTitle, link: `/arc/${this.arcId}` },
          { label: $localize`:@@npcform.breadcrumbCreate:Create NPC` },
        ]);
        this.loading.set(false);
      } else if (this.arcId) {
        this.arcService.getArc(this.arcId).subscribe({
          next: (arc) => {
            this.breadcrumbs.set([
              this.arcListCrumb,
              { label: arc.title, link: `/arc/${arc.id}` },
              { label: $localize`:@@npcform.breadcrumbCreate:Create NPC` },
            ]);
            this.loading.set(false);
          },
          error: () => {
            this.breadcrumbs.set([this.arcListCrumb]);
            this.loading.set(false);
          },
        });
      } else {
        this.breadcrumbs.set([this.arcListCrumb]);
        this.loading.set(false);
      }
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
        next: () => {
          this.saveState.set('success');
          this.router.navigate(['/npc', this.npcId]);
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
        next: (response) => {
          this.saveState.set('success');
          this.router.navigate(['/npc', response.id]);
        },
        error: () => this.saveState.set('error'),
      });
    }
  }
}
