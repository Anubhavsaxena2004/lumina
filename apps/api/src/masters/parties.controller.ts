import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PartiesService, CreatePartyDto, UpdatePartyDto } from './parties.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Masters: Parties')
@Controller('parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List parties with optional search by name or phone' })
  findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.partiesService.findAll(search, type, Number(limit), Number(offset));
  }

  @Get(':id')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Get single party details and current running balance' })
  findOne(@Param('id') id: string) {
    return this.partiesService.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'Create a new customer or supplier party' })
  create(
    @Body() dto: CreatePartyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.partiesService.create(dto, user.id);
  }

  @Patch(':id')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update party details (Owner only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePartyDto,
  ) {
    return this.partiesService.update(id, dto);
  }
}
