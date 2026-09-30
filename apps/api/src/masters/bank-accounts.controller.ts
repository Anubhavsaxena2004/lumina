import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BankAccountsService, CreateBankAccountDto } from './bank-accounts.service';
import { Roles } from '../common/decorators';

@ApiTags('Masters: Bank Accounts')
@Controller('bank-accounts')
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List business bank accounts with running balances' })
  findAll() {
    return this.bankAccountsService.findAll();
  }

  @Post()
  @Roles('OWNER')
  @ApiOperation({ summary: 'Add a new bank account (Owner only)' })
  create(@Body() dto: CreateBankAccountDto) {
    return this.bankAccountsService.create(dto);
  }
}
