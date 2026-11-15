import { Request, Response } from 'express';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';
import { Product, DEFAULT_CATEGORIES } from '../../../../shared';

export class ProductController {
  public getProducts(req: Request, res: Response) {
    const { categoryId, vendorId, brand, minPrice, maxPrice, search, sort, page = '1', limit = '20' } = req.query;

    const parsedMinPrice = minPrice ? parseFloat(minPrice as string) : undefined;
    const parsedMaxPrice = maxPrice ? parseFloat(maxPrice as string) : undefined;

    const allProducts = db.getProducts({
      categoryId: categoryId as string,
      vendorId: vendorId as string,
      brand: brand as string,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
      search: search as string,
      sort: sort as string,
    });

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = allProducts.slice(startIndex, startIndex + limitNum);

    res.json({
      products: paginated,
      total: allProducts.length,
      page: pageNum,
      totalPages: Math.ceil(allProducts.length / limitNum),
    });
  }

  public getProductById(req: Request, res: Response) {
    const { productId } = req.params;
    const product = db.findProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  }

  public getCategories(_req: Request, res: Response) {
    res.json(DEFAULT_CATEGORIES);
  }

  public createProduct(req: AuthenticatedRequest, res: Response) {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ error: 'Only registered vendors can create products' });
    }

    const vendor = db.findVendorByOwnerUid(req.user.uid);
    if (!vendor) {
      return res.status(400).json({ error: 'No associated vendor profile found for this user' });
    }

    const body = req.body;
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const categoryMatch = DEFAULT_CATEGORIES.find((c) => c.id === body.categoryId);

    const newProduct: Product = {
      productId,
      vendorId: vendor.vendorId,
      vendorName: vendor.businessName,
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      categoryName: body.categoryName || categoryMatch?.name || 'General',
      brand: body.brand,
      sku: body.sku,
      price: body.price,
      discount: body.discount || 0,
      stock: body.stock || 0,
      images: body.images || [],
      variants: body.variants || [],
      specifications: body.specifications || {},
      shippingPolicy: body.shippingPolicy || vendor.businessPolicies.shipping,
      returnPolicy: body.returnPolicy || vendor.businessPolicies.returns,
      status: body.status || 'active',
      rating: 5.0,
      reviewCount: 0,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : true,
      isTrending: body.isTrending !== undefined ? Boolean(body.isTrending) : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.addProduct(newProduct);
    res.status(201).json(newProduct);
  }

  public updateProduct(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId } = req.params;
    const existing = db.findProductById(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Role check: vendor must own product, or admin can moderate
    if (req.user.role === 'vendor') {
      const vendor = db.findVendorByOwnerUid(req.user.uid);
      if (!vendor || vendor.vendorId !== existing.vendorId) {
        return res.status(403).json({ error: 'You do not have permission to edit this product' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updated = db.updateProduct(productId, req.body);
    res.json(updated);
  }

  public deleteProduct(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId } = req.params;
    const existing = db.findProductById(productId);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (req.user.role === 'vendor') {
      const vendor = db.findVendorByOwnerUid(req.user.uid);
      if (!vendor || vendor.vendorId !== existing.vendorId) {
        return res.status(403).json({ error: 'You do not have permission to delete this product' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const success = db.deleteProduct(productId);
    res.json({ message: 'Product archived successfully', success });
  }
}

export const productController = new ProductController();
