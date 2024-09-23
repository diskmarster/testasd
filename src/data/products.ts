import { db, TRX } from "@/lib/database";
import { NewProduct, Product, productTable } from "@/lib/database/schema/inventory";

export const product = {
    create: async function(newProduct: NewProduct, trx: TRX = db): Promise<Product | undefined> {
        const product = await trx.insert(productTable).values(newProduct).returning()
        return product[0]
    },
    
}