import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { Roles } from '../common/decorators';

@ApiTags('Owner Dashboard')
@Controller('dashboard')
@Roles('OWNER')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get aggregated business KPIs, top dues, and cash/bank balances (Owner only)' })
  getMetrics() {
    return this.dashboardService.getOwnerMetrics();
  }
}
