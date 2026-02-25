import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {

  constructor(private router: Router) {}

  totalResellers = 148;
  totalClients   = 3420;
  totalDevices   = 8750;
  activeDevices  = 6890;

  get activePercentage(): number {
    return Math.round((this.activeDevices / this.totalDevices) * 100);
  }

  get inactivePercentage(): number {
    return 100 - this.activePercentage;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  formatNumber(n: number): string {
    return n.toLocaleString('fr-TN');
  }

  recentActivity = [
    { type: 'reseller', message: 'New reseller registered', name: 'TechVision SARL', time: '2 min ago',  icon: 'reseller' },
    { type: 'client',   message: 'New client added',        name: 'Société Elyes',  time: '14 min ago', icon: 'client'   },
    { type: 'device',   message: 'Device went offline',     name: 'Device #4821',   time: '32 min ago', icon: 'device'   },
    { type: 'client',   message: 'New client added',        name: 'Alpha Corp',     time: '1h ago',     icon: 'client'   },
    { type: 'reseller', message: 'Reseller updated',        name: 'NetPlus Tunis',  time: '2h ago',     icon: 'reseller' },
  ];
}