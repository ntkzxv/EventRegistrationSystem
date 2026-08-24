import { Routes } from '@angular/router';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { AdminEventManagementComponent } from './components/admin-event-management/admin-event-management.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { EventListComponent } from './components/event-list/event-list.component';
import { EventDetailComponent } from './components/event-detail/event-detail.component';
<<<<<<< HEAD
import { RegisterComponent } from './components/users/register.component';

=======
import { LoginComponent } from './components/login/login.component';
>>>>>>> b453a5118d2c12bd7e21823bf198544358e990ed
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'events',
    component: EventListComponent,
  },
  {
    path: 'events/:id',
    component: EventDetailComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'users/register',
    component: RegisterComponent,
  },
  {
    path: 'users',
    component: RegisterComponent,
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
