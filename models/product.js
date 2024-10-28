class Product {
    constructor(id, name, price, category, description, imageUrl, stock, color = 'N/A', size = 'N/A') {
        this.id = id;
        this.name = name;
        this.price = price;
        this.category = category;
        this.description = description;
        this.imageUrl = imageUrl;
        this.stock = stock;
        this.color = color;
        this.size = size;
        this.createdAt = new Date(); // Automatically set the createdAt timestamp
    }
}

export default Product;
