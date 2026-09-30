import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Ledger & Cash/Bank Books')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('party/:partyId')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({
    summary: 'Get party statement (Owner gets full ledger statement with running balance, Staff gets only own bill statuses)',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'ISO date or timestamp (e.g. 2026-01-01)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'ISO date or timestamp (e.g. 2026-12-31)' })
  getPartyStatement(
    @Param('partyId') partyId: string,
    @CurrentUser() user: AuthUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.getPartyStatement(partyId, user, startDate, endDate);
  }

  @Get('dues/combined')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Combined pending dues per customer across all staff entries (Owner only)' })
  getCombinedCustomerDues() {
    return this.ledgerService.getCombinedCustomerDues();
  }

  @Get('cash-book')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Cash book with running balance and date range filter (Owner only)' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getCashBook(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.getCashBook(startDate, endDate);
  }

  @Get('bank-book')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Bank book with running balance per bank account (Owner only)' })
  @ApiQuery({ name: 'bank_account_id', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getBankBook(
    @Query('bank_account_id') bankAccountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ledgerService.getBankBook(bankAccountId, startDate, endDate);
  }
}
