import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RemindersService, UpdateReminderSettingsDto } from './reminders.service';
import { Roles, CurrentUser } from '../common/decorators';
import { AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payment Reminders & Scheduler')
@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('settings')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Get reminder settings (Owner only)' })
  getSettings() {
    return this.remindersService.getSettings();
  }

  @Patch('settings')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Update reminder repeat days, send time or owner phone (Owner only)' })
  updateSettings(@Body() dto: UpdateReminderSettingsDto) {
    return this.remindersService.updateSettings(dto);
  }

  @Post('trigger')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Manually trigger daily overdue reminders run (Owner only / Testing)' })
  triggerRun() {
    return this.remindersService.runDailyReminderJob();
  }

  @Get('staff/overdue')
  @Roles('OWNER', 'STAFF')
  @ApiOperation({ summary: 'List overdue bills created by the current staff member' })
  getMyOverdueBills(@CurrentUser() user: AuthUser) {
    return this.remindersService.getStaffOverdueBills(user.id);
  }
}
