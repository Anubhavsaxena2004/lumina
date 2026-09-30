import { Module } from '@nestjs/common';
import { PartiesService } from './parties.service';
import { PartiesController } from './parties.controller';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsController } from './bank-accounts.controller';

@Module({
  controllers: [PartiesController, ItemsController, BankAccountsController],
  providers: [PartiesService, ItemsService, BankAccountsService],
  exports: [PartiesService, ItemsService, BankAccountsService],
})
export class MastersModule {}
