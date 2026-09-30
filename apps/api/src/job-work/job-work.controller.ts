import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JobWorkService, CreateJobWorkDto } from './job-work.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Job Work (Polish & Meena)')
@Controller('job-work')
export class JobWorkController {
  constructor(private readonly jobWorkService: JobWorkService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List job work entries with staff isolation' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.jobWorkService.findAll(user, Number(limit), Number(offset));
  }

  @Get('balances')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get current pending job work net weight per party and item' })
  getBalances() {
    return this.jobWorkService.getBalances();
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Record Polish or Meena Issue/Receive entry' })
  create(
    @Body() dto: CreateJobWorkDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.jobWorkService.create(dto, user);
  }
}
