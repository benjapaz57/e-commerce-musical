import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminCatalogController } from './admin-catalog.controller.js';
import { AdminSystemController } from './admin-system.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdminUsersController, AdminCatalogController, AdminSystemController],
  providers: [AdminGuard],
})
export class AdminModule {}
