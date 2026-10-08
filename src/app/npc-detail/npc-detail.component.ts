import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NpcService } from '../services/npc.service';
import { ArcNpc } from '../models/StoryArc';

@Component({
  selector: 'app-npc-detail',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink],
  templateUrl: './npc-detail.component.html',
  styleUrl: './npc-detail.component.css',
})
export class NpcDetailComponent implements OnInit {
  private npcService = inject(NpcService);
  private route = inject(ActivatedRoute);

  npc = signal<ArcNpc | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set(true); this.loading.set(false); return; }

    this.npcService.getNpc(id).subscribe({
      next: (npc) => {
        this.npc.set(npc);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
