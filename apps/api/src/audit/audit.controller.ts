import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators';

@ApiTags('Audit Log')
@Controller('audit')
@Roles('OWNER')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List immutable audit log trail with before/after state diffs (Owner only)' })
  findAll(
    @Query('actor_id') actorId?: string,
    @Query('table_name') tableName?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.auditService.findAll(actorId, tableName, Number(limit), Number(offset));
  }
}
