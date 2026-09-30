import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Ledger & Cash/Bank Books')
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('party/:partyId')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get party statement (Owner gets full ledger, Staff gets bill statuses)' })
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
  @ApiOperation({ summary: 'Cash book with running balance (Owner only)' })
  getCashBook() {
    return this.ledgerService.getCashBook();
  }

  @Get('bank-book')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Bank book with running balance per bank account (Owner only)' })
  getBankBook(@Query('bank_account_id') bankAccountId?: string) {
    return this.ledgerService.getBankBook(bankAccountId);
  }
}
