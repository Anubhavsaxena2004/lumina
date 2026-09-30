import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService, CreateStaffDto, UpdateStaffDto } from './users.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Staff Management')
@Controller('staff')
@Roles('OWNER')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members (Owner only)' })
  findAll() {
    return this.usersService.findAllStaff();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new staff account (Owner only)' })
  create(
    @Body() dto: CreateStaffDto,
    @CurrentUser() owner: AuthUser,
  ) {
    return this.usersService.createStaff(dto, owner.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member details (Owner only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.usersService.updateStaff(id, dto);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset staff password (Owner only)' })
  resetPassword(
    @Param('id') id: string,
    @Body('password') password?: string,
  ) {
    return this.usersService.resetPassword(id, password);
  }
}
