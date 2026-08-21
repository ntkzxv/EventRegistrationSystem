import { Routes } from '@angular/router';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { AdminEventManagementComponent } from './components/admin-event-management/admin-event-management.component';

export const routes: Routes = [
  {
    path: '',
    component: MyEventsComponent,
  },
  {
    path: 'my-events',
    component: MyEventsComponent,
  },
  {
    path: 'admin',
    component: AdminEventManagementComponent,
  },
  {
    path: 'admin/events',
    component: AdminEventManagementComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
