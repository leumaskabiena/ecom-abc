class CartItem {
    constructor(id, userId, productId, quantity = 1, size = null, color = null, guestId = null) {
        this.id = id;
        this.userId = userId;
        this.productId = productId;
        this.quantity = quantity;
        this.size = size;
        this.color = color;
        this.guestId = guestId;
        this.createdAt = new Date(); // Automatically set the createdAt timestamp
    }
}

export default CartItem;
