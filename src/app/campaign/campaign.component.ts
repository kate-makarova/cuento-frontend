import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Campaign } from '../models/Campaign';

const MOCK_CAMPAIGN: Campaign = {
  id: 1,
  title: 'The Shadow of Thornhaven',
  summary: 'A dark tale of intrigue and betrayal set in the cursed city of Thornhaven, where the line between the living and the dead has grown dangerously thin. The players must navigate the city\'s labyrinthine politics while uncovering an ancient conspiracy.',
  status: 1,
  date_created: '2024-01-15T10:00:00Z',
  start_date: '2024-02-01T00:00:00Z',
  end_date: null,
  is_gm: true,
  game_masters: [
    { id: 1, username: 'Storyteller_Kate', avatar: null },
  ],
  npc_characters: [
    { id: 1, name: 'Lord Aldric Voss', avatar: null, custom_fields: { custom_fields: {}, field_config: [] }, factions: null, campaign_id: 1 },
    { id: 2, name: 'The Weeping Oracle', avatar: null, custom_fields: { custom_fields: {}, field_config: [] }, factions: null, campaign_id: 1 },
    { id: 3, name: 'Sister Maren', avatar: null, custom_fields: { custom_fields: {}, field_config: [] }, factions: null, campaign_id: 1 },
    { id: 4, name: 'Guildmaster Petra', avatar: null, custom_fields: { custom_fields: {}, field_config: [] }, factions: null, campaign_id: 1 },
    { id: 5, name: 'The Pale Constable', avatar: null, custom_fields: { custom_fields: {}, field_config: [] }, factions: null, campaign_id: 1 },
  ],
  characters: [
    { id: 10, name: 'Eris Darkmantle', avatar: null },
    { id: 11, name: 'Brother Cael', avatar: null },
    { id: 12, name: 'Vivienne Ashford', avatar: null },
    { id: 13, name: 'Tobias Renne', avatar: null },
  ],
  episodes: [
    { id: 101, name: 'Arrival in Thornhaven' },
    { id: 102, name: 'The Merchant\'s Secret' },
    { id: 103, name: 'Beneath the Old Quarter' },
    { id: 104, name: 'The Night of Lanterns' },
    { id: 105, name: 'A Deal with the Dead' },
  ],
};

const STATUS_LABELS: Record<number, string> = {
  1: 'Active',
  2: 'Completed',
  3: 'On Hold',
  4: 'Planned',
};

@Component({
  selector: 'app-campaign',
  host: { class: 'pun-page' },
  imports: [RouterLink, DatePipe],
  templateUrl: './campaign.component.html',
  styleUrl: './campaign.component.css',
  standalone: true,
})
export class CampaignComponent {
  campaign: Campaign = MOCK_CAMPAIGN;

  statusLabel(status: number): string {
    return STATUS_LABELS[status] ?? String(status);
  }

  editCampaign(): void {}
  addNpc(): void {}
  addCharacter(): void {}
  removeCharacter(id: number): void {}
  addEpisode(): void {}
  removeEpisode(id: number): void {}
}
