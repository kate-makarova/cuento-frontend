import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NpcCharacter } from '../models/NpcCharacter';

const MOCK_NPC: NpcCharacter = {
  id: 1,
  name: 'Lord Aldric Voss',
  avatar: null,
  campaign_id: 1,
  factions: null,
  topics: [
    {
      topic_id: 12,
      topic_title: 'The Merchant\'s Secret',
      post_ids: [101, 134, 158],
    },
    {
      topic_id: 17,
      topic_title: 'Council of Shadows',
      post_ids: [312],
    },
    {
      topic_id: 23,
      topic_title: 'Beneath the Old Quarter',
      post_ids: [445, 467, 489, 502],
    },
  ],
  custom_fields: {
    custom_fields: {
      description: {
        content: 'Lord Aldric Voss is the aging governor of Thornhaven, appointed by the Crown some thirty years ago. Once a celebrated war hero, he now rules the city from behind closed doors, seldom seen in public. Rumours persist that his prolonged isolation is not by choice — that something within the palace keeps him confined.',
        content_html: '<p>Lord Aldric Voss is the aging governor of Thornhaven, appointed by the Crown some thirty years ago. Once a celebrated war hero, he now rules the city from behind closed doors, seldom seen in public.</p><p>Rumours persist that his prolonged isolation is not by choice — that something within the palace keeps him confined.</p>',
      },
    },
    field_config: [
      {
        field_type: 'textarea',
        human_field_name: 'Description',
        machine_field_name: 'description',
        content_field_type: 'long_text',
        order: 1,
      },
    ],
  },
};

@Component({
  selector: 'app-npc-character',
  host: { class: 'pun-page' },
  imports: [RouterLink],
  templateUrl: './npc-character.component.html',
  styleUrl: './npc-character.component.css',
  standalone: true,
})
export class NpcCharacterComponent {
  npc: NpcCharacter = MOCK_NPC;
  openTopics = new Set<number>();

  toggleTopic(topicId: number): void {
    if (this.openTopics.has(topicId)) {
      this.openTopics.delete(topicId);
    } else {
      this.openTopics.add(topicId);
    }
  }

  get fields(): { name: string; html: string }[] {
    const config = this.npc.custom_fields.field_config;
    const values = this.npc.custom_fields.custom_fields;
    return config
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(f => ({
        name: f.human_field_name,
        html: values[f.machine_field_name]?.content_html ?? '',
      }))
      .filter(f => f.html);
  }
}
