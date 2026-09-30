import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { Roles } from '../common/decorators';

@ApiTags('Stock Register')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('register')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get current stock balance in pieces and Kg for all items with category and search filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Filter by item name' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by item category' })
  getStockRegister(
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.stockService.getStockRegister(search, category);
  }

  @Get('movements')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get stock movements log across all items' })
  @ApiQuery({ name: 'source_type', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getAllMovements(
    @Query('source_type') sourceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.stockService.getAllMovements(
      sourceType,
      startDate,
      endDate,
      Number(limit),
      Number(offset),
    );
  }

  @Get('movements/:itemId')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get stock movements log and current balance for a specific item' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  getItemMovements(
    @Param('itemId') itemId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.stockService.getItemMovements(
      itemId,
      Number(limit),
      Number(offset),
      startDate,
      endDate,
    );
  }
}
