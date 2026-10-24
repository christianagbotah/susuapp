import { Global, Module } from '@nestjs/common';
import { DataStoreService } from './data-store.service';

/**
 * Global data module — makes the in-memory DataStoreService
 * available to every feature module without re-importing.
 */
@Global()
@Module({
  providers: [DataStoreService],
  exports: [DataStoreService],
})
export class DataModule {}
