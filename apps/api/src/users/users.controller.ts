import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateStaffRequestDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  mobileNumber?: string;
}

export class UpdateStaffRequestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetStaffPasswordDto {
  @IsOptional()
  @IsString()
  password?: string;
}

@ApiTags('Staff Management')
@Controller('users/staff')
@Roles('OWNER')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all staff members with last login time (Owner only)' })
  findAll() {
    return this.usersService.findAllStaff();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get staff member by ID (Owner only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findStaffById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new individual staff account (Owner only, unlimited staff)' })
  create(
    @Body() dto: CreateStaffRequestDto,
    @CurrentUser() owner: AuthUser,
  ) {
    return this.usersService.createStaff(dto, owner.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member details (Owner only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffRequestDto,
  ) {
    return this.usersService.updateStaff(id, dto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate staff member, immediately revoking access (Owner only)' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivateStaff(id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate deactivated staff member (Owner only)' })
  reactivate(@Param('id') id: string) {
    return this.usersService.reactivateStaff(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset staff password (Owner only)' })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetStaffPasswordDto,
  ) {
    return this.usersService.resetPassword(id, dto?.password);
  }
}
