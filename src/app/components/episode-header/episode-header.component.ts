import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-episode-header',
  imports: [
    RouterLink
  ],
  templateUrl: './episode-header.component.html',
  styleUrl: './episode-header.component.css'
})
export class EpisodeHeaderComponent {
  headerData = {
    title: "Осада Арракина: Начало",
    image: "assets/scenes/arrakeen-night.jpg",
    location: "Арракин, Дворцовый квартал",
    time: "Ночь, 3-й день после высадки",
    summary: "Тени удлиняются над столицей. Имперские войска заняли ключевые позиции, но в глубине жилых кварталов зреет сопротивление. Воздух пропитан запахом озона и пряности.",
    participants: [
      { id: 101, name: "Soren the Exile" },
      { id: 102, name: "Valerius Vance" },
      { id: 105, name: "Lady Jessica" }
    ]
  };
}
