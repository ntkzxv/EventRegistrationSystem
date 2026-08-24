import { Routes } from '@angular/router';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { AdminEventManagementComponent } from './components/admin-event-management/admin-event-management.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { EventListComponent } from './components/event-list/event-list.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'events', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'events',
    component: EventListComponent,
  },
  {
  path: 'events/:id',
  component: EventDetailComponent
  },
  {
    path: 'my-events',
    component: MyEventsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminEventManagementComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/events',
    component: AdminEventManagementComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'admin-event-management',
    component: AdminEventManagementComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent,
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
