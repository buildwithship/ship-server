import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ApplicationsModule } from './applications/applications.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { MakersModule } from './makers/makers.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RecruitmentsModule } from './recruitments/recruitments.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MakersModule,
    ProjectsModule,
    RecruitmentsModule,
    ApplicationsModule,
    NotificationsModule,
    HealthModule,
  ],
})
export class AppModule {}
