import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './sales.dto';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sales Entries')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List sales (Staff sees own entries only, Owner sees all)' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('party_id') partyId?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.salesService.findAll(user, partyId, Number(limit), Number(offset));
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get single sale with lines and payment status' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.salesService.findOne(id, user);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Create new sale with stock deduction and ledger debit' })
  create(@Body() dto: CreateSaleDto, @CurrentUser() user: AuthUser) {
    return this.salesService.create(dto, user);
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Soft-delete sale with reversing ledger/stock entries (Owner only)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.salesService.softDelete(id, user);
  }
}
