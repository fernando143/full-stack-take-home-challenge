import { Module } from '@nestjs/common';
import { DatabaseErrorHandler } from './exceptions/database-error.handler';

@Module({
  providers: [DatabaseErrorHandler],
  exports: [DatabaseErrorHandler],
})
export class CommonModule {}
