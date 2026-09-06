// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core & Platform Modules
import { AuthModule } from './auth/auth.module';
import { ConfigurationModule } from './core/configuration/configuration.module';
import { CoreModule } from './core/core.module';
import { PlatformSaasModule } from './platform-saas/platform-saas.module';
import { MailModule } from './mail/mail.module';
import { RealtimeModule } from './realtime/realtime.module';
import { OnboardingModule } from './onboarding/onboarding.module';

// Business & Operations Modules
import { AccountPayableModule } from './finance-hr/account-payable/account-payable.module';
import { CommerceModule } from './commerce/commerce.module';
import { GrowthModule } from './growth/growth.module';
import { FinanceHrModule } from './finance-hr/finance-hr.module';
import { HrModule } from './finance-hr/hr/hr.module';
import { InventoryModule } from './inventory/inventory.module';
import { RestaurantOperationsModule } from './restaurant-operations/restaurant-operations.module';

// Billing & Transactions Modules
import { ReceiptItemModule } from './core/billing-transactions/receipt-item/receipt-item.module';
import { ReceiptTaxModule } from './core/billing-transactions/receipt-tax/receipt-tax.module';
import { ReceiptsModule } from './core/billing-transactions/receipts/receipts.module';

// POS & Analytics
import { OrderItemModule } from './restaurant-operations/pos/order-item/order-item.module';
import { OrdersModule } from './restaurant-operations/pos/orders/orders.module';
import { KitchenAnalyticsModule } from './restaurant-operations/kitchen-display-system/kitchen-analytics/kitchen-analytics.module';
import { ModifierAnalyticsModule } from './restaurant-operations/pos/modifier-analytics/modifier-analytics.module';

// Payroll
import { PayrollAdjustmentsModule } from './finance-hr/payroll/payroll-adjustments/payroll-adjustments.module';
import { PayrollEntriesModule } from './finance-hr/payroll/payroll-entries/payroll-entries.module';
import { PayrollRunsModule } from './finance-hr/payroll/payroll-runs/payroll-runs.module';
import { PayrollTaxDetailsModule } from './finance-hr/payroll/payroll-tax-details/payroll-tax-details.module';

// Delivery System
import { DeliverySystemModule } from './commerce/delivery-system/delivery-system.module';
import { DeliveryZoneModule } from './commerce/delivery-system/delivery-zone/delivery-zone.module';
import { DeliveryFeeModule } from './commerce/delivery-system/delivery-fee/delivery-fee.module';
import { DeliveryDriverModule } from './commerce/delivery-system/delivery-driver/delivery-driver.module';
import { DeliveryTrackingModule } from './commerce/delivery-system/delivery-tracking/delivery-tracking.module';
import { DeliveryAssignmentModule } from './commerce/delivery-system/delivery-assignment/delivery-assignment.module';

// Configuration Rules
import { MerchantTaxRuleModule } from './core/configuration/merchant-tax-rule/merchant-tax-rule.module';
import { MerchantOvertimeRuleModule } from './core/configuration/merchant-overtime-rule/merchant-overtime-rule.module';
import { MerchantPayrollRuleModule } from './core/configuration/merchant-payroll-rule/merchant-payroll-rule.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get('NODE_ENV') === 'development';
        return {
          type: 'postgres',
          host: config.get('DB_HOST'),
          port: parseInt(config.get('DB_PORT', '5432')),
          username: config.get('DB_USERNAME'),
          password: config.get('DB_PASSWORD'),
          database: config.get('DB_NAME'),

          // Only print SQL queries in development
          logging: isDev,

          // Automatic loading of all entities declared in each submodule (forFeature)
          autoLoadEntities: true,

          synchronize: false,
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
            max: 5,
            idleTimeoutMillis: 10000,
            connectionTimeoutMillis: 10000,
            prepare: false,
            statement_timeout: 10000,
          },
        };
      },
    }),
    AccountPayableModule,
    AuthModule,
    OnboardingModule,
    ConfigurationModule,
    CoreModule,
    HrModule,
    InventoryModule,
    MailModule,
    OrderItemModule,
    OrdersModule,
    PayrollAdjustmentsModule,
    PayrollEntriesModule,
    PayrollRunsModule,
    PayrollTaxDetailsModule,
    ReceiptItemModule,
    ReceiptTaxModule,
    ReceiptsModule,
    RestaurantOperationsModule,
    PlatformSaasModule,
    CommerceModule,
    GrowthModule,
    FinanceHrModule,
    DeliverySystemModule,
    DeliveryZoneModule,
    DeliveryFeeModule,
    DeliveryDriverModule,
    DeliveryTrackingModule,
    DeliveryAssignmentModule,
    RealtimeModule,
    MerchantTaxRuleModule,
    MerchantOvertimeRuleModule,
    MerchantPayrollRuleModule,
    KitchenAnalyticsModule,
    ModifierAnalyticsModule,
  ],
})
export class AppModule {}
