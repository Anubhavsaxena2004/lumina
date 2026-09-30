import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PurchasesService, CreatePurchaseDto } from './purchases.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Purchase Entries')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List purchases with staff isolation' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.purchasesService.findAll(user, Number(limit), Number(offset));
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Create new purchase entry (adds stock & ledger credit)' })
  create(
    @Body() dto: CreatePurchaseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.purchasesService.create(dto, user);
  }
}
