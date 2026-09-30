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
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './vouchers.dto';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Money Vouchers (Receipt & Payment)')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List cash and bank vouchers' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.vouchersService.findAll(user, Number(limit), Number(offset));
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

  @Delete(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Soft-delete and reverse voucher (Owner only)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.vouchersService.softDelete(id, user);
  }
}
