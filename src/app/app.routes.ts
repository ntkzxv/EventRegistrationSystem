import { Routes } from '@angular/router';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { AdminEventManagementComponent } from './components/admin-event-management/admin-event-management.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { EventListComponent } from './components/event-list/event-list.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  {
    path: 'events',
    component: EventListComponent,
  },
  {
  path: 'events/:id',
  component: EventDetailComponent
  },
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
    path: 'admin-event-management',
    component: AdminEventManagementComponent,
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
