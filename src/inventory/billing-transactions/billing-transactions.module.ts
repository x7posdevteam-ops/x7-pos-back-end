import { Module } from '@nestjs/common';
import { BillingTransactionsService } from './billing-transactions.service';
import { BillingTransactionsController } from './billing-transactions.controller';
import { ReceiptsModule } from './receipts/receipts.module';
import { ReceiptItemModule } from './receipt-item/receipt-item.module';
import { ReceiptTaxModule } from './receipt-tax/receipt-tax.module';

@Module({
    imports: [ReceiptsModule, ReceiptItemModule, ReceiptTaxModule],
    controllers: [BillingTransactionsController],
    providers: [BillingTransactionsService],
})
export class BillingTransactionsModule { }
