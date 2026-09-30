import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto } from './vouchers.dto';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Money Vouchers (Receipt & Payment)')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List cash and bank vouchers with staff isolation and filters' })
  @ApiQuery({ name: 'party_id', required: false })
  @ApiQuery({ name: 'kind', required: false, enum: ['RECEIPT', 'PAYMENT'] })
  @ApiQuery({ name: 'mode', required: false, enum: ['CASH', 'BANK'] })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('party_id') partyId?: string,
    @Query('kind') kind?: string,
    @Query('mode') mode?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.vouchersService.findAll(
      user,
      partyId,
      kind,
      mode,
      Number(limit),
      Number(offset),
    );
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get single voucher by ID with allocations' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.vouchersService.findOne(id, user);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Record Receipt or Payment with bill allocations' })
  create(
    @Body() dto: CreateVoucherDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vouchersService.create(dto, user);
  }

  @Put(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Owner edit voucher using compensating reversing rows (Owner only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVoucherDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vouchersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Soft-delete and reverse voucher, restoring bill status (Owner only)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.vouchersService.softDelete(id, user);
  }
}
