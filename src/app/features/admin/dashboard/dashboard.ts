import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslationService } from '../../../service/translation.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: true,
  imports: [CommonModule]
})
export class Dashboard {
  totalResellers = 148;
  totalClients   = 3420;
  totalDevices   = 8750;
  activeDevices  = 6890;

  recentActivity = [
    { icon: 'reseller', labelKey: 'act_reseller_reg', sub: 'TechVision SARL', time: '2',  unit: 'min_ago' },
    { icon: 'client',   labelKey: 'act_client_added', sub: 'Société Elyes',  time: '14', unit: 'min_ago' },
    { icon: 'device',   labelKey: 'act_device_off',   sub: 'Device #4821',   time: '32', unit: 'min_ago' },
    { icon: 'client',   labelKey: 'act_client_added', sub: 'Alpha Corp',     time: '1',  unit: 'hr_ago'  },
    { icon: 'reseller', labelKey: 'act_reseller_upd', sub: 'NetPlus Tunis',  time: '2',  unit: 'hr_ago'  },
  ];

  readonly circumference = 2 * Math.PI * 42;

  constructor(
    private router: Router,
    public i18n: TranslationService,
  ) {}

  get activePercent(): number {
    return Math.round((this.activeDevices / this.totalDevices) * 100);
  }

  get inactiveDevices(): number {
    return this.totalDevices - this.activeDevices;
  }

  get activeOffset(): number {
    return this.circumference * (1 - this.activeDevices / this.totalDevices);
  }

  fmt(value: number): string {
    return new Intl.NumberFormat().format(value);
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}