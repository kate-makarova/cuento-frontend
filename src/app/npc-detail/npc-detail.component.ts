import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NpcService, NpcTopic } from '../services/npc.service';
import { ArcNpc } from '../models/StoryArc';
import { BreadcrumbItem, BreadcrumbsComponent } from '../components/breadcrumbs/breadcrumbs.component';

@Component({
  selector: 'app-npc-detail',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [RouterLink, BreadcrumbsComponent],
  templateUrl: './npc-detail.component.html',
  styleUrl: './npc-detail.component.css',
})
export class NpcDetailComponent implements OnInit {
  private npcService = inject(NpcService);
  private route = inject(ActivatedRoute);

  npc = signal<ArcNpc | null>(null);
  topics = signal<NpcTopic[]>([]);
  breadcrumbs = signal<BreadcrumbItem[]>([]);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error.set(true); this.loading.set(false); return; }

    this.npcService.getNpc(id).subscribe({
      next: (npc) => {
        this.npc.set(npc);
        this.breadcrumbs.set([
          { label: $localize`:@@common.home:Home`, link: '/' },
          { label: $localize`:@@npcdetail.breadcrumbArcList:Story Arcs`, link: '/arc-list' },
          ...(npc.arc ? [{ label: npc.arc.title, link: `/arc/${npc.arc.id}` }] : []),
          { label: npc.name },
        ]);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    this.npcService.getNpcTopics(id).subscribe({
      next: (topics) => this.topics.set(topics),
      error: () => {},
    });
  }
}
