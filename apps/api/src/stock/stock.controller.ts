import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { Roles } from '../common/decorators';

@ApiTags('Stock Register')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('register')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get current stock balance in pieces and Kg for all items' })
  getStockRegister() {
    return this.stockService.getStockRegister();
  }

  @Get('movements/:itemId')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get stock movements log for a specific item' })
  getItemMovements(
    @Param('itemId') itemId: string,
    @Query('limit') limit = 50,
  ) {
    return this.stockService.getItemMovements(itemId, Number(limit));
  }
}
