export class InventoryPage {
    constructor(page) {
        this.page = page;
        this.cartBadge = this.page.locator('.shopping_cart_badge');
        
        
    }

async addToCart(products) {
    const items = Array.isArray(products) ? products : [products];
    for (const product of items) {
        await this.page.click(`#add-to-cart-${product}`);
    }
}

    async goToCart() {
    await this.page.click('.shopping_cart_link');
    }

    async getCartCount() {
return await this.cartBadge.textContent();

    }
async getProductName() {
    return await this.page.locator('.inventory_item_name').textContent();
}


}