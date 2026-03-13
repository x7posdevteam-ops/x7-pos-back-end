import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { BillingTransactionsModule } from './billing-transactions/billing-transactions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsInventoryModule } from './products-inventory/products-inventory.module';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService],
  imports: [TypeOrmModule.forFeature([ProductsInventoryModule]), BillingTransactionsModule],
})
export class InventoryModule { }
