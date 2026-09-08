import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { KitchenAnalyticsService } from './kitchen-analytics.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PrepTimeResponseDto } from './dto/prep-time-response.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/platform-saas/users/constants/role.enum';
import { Scope } from 'src/platform-saas/users/constants/scope.enum';
import { Scopes } from 'src/auth/decorators/scopes.decorator';
import { GetCancelledOrdersDto } from './dto/get-cancelled-orders.dto';

@ApiTags('Restaurant operations - Kitchen Display System - Kitchen Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kitchen-analytics')
export class KitchenAnalyticsController {
  constructor(private readonly service: KitchenAnalyticsService) {}

  @Roles(UserRole.PORTAL_ADMIN, UserRole.MERCHANT_ADMIN)
  @Scopes(
    Scope.ADMIN_PORTAL,
    Scope.MERCHANT_WEB,
    Scope.MERCHANT_ANDROID,
    Scope.MERCHANT_IOS,
    Scope.MERCHANT_CLOVER,
  )
  @Get('prep-time')
  @ApiOperation({
    summary:
      'Get average preparation time grouped by category, station, day and hour',
  })
  @ApiOkResponse({ type: PrepTimeResponseDto })
  async getPrepTime(@CurrentUser() user: AuthenticatedUser) {
    const merchantId = user.merchant.id;

    const data = await this.service.getAveragePrepTime(merchantId);

    return {
      statusCode: 200,
      message: 'Prep time analytics retrieved successfully',
      data,
    };
  }

  @Get('cancelled-orders')
  @Roles(UserRole.PORTAL_ADMIN, UserRole.MERCHANT_ADMIN)
  async getCancelledOrders(
    @Query() query: GetCancelledOrdersDto,
    @Request() req: AuthenticatedUser,
  ) {
    const data = await this.service.getCancelledKitchenOrders(
      req.merchant.id,
      query.startDate,
      query.endDate,
    );

    return {
      statusCode: 200,
      message: 'Cancelled kitchen orders retrieved successfully',
      data,
    };
  }

  @Get('cancelled-orders/summary')
  @Roles(UserRole.PORTAL_ADMIN, UserRole.MERCHANT_ADMIN)
  async getSummary(@Request() req: AuthenticatedUser) {
    const data = await this.service.getCancellationSummary(req.merchant.id);

    return {
      statusCode: 200,
      message: 'Cancellation summary retrieved successfully',
      data,
    };
  }
}
