import { Response } from 'express';
import { db } from '../../services/dataStore';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CartItem } from '../../../../shared';

export class CartController {
  public getCart(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const cart = db.getCart(req.user.uid);
    res.json(cart);
  }

  public addItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId, quantity = 1, selectedVariant } = req.body;
    const product = db.findProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
    }

    const cart = db.getCart(req.user.uid);
    const existingIndex = cart.items.findIndex((item) => item.productId === productId);

    const priceAfterDiscount = product.discount > 0
      ? Number((product.price * (1 - product.discount / 100)).toFixed(2))
      : product.price;

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ error: 'Cannot add more units than currently in stock' });
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].selectedVariant = selectedVariant || cart.items[existingIndex].selectedVariant;
    } else {
      const newItem: CartItem = {
        productId: product.productId,
        vendorId: product.vendorId,
        title: product.title,
        price: priceAfterDiscount,
        discount: product.discount,
        image: product.images[0],
        quantity,
        selectedVariant,
        maxStock: product.stock,
      };
      cart.items.push(newItem);
    }

    cart.updatedAt = new Date().toISOString();
    db.saveCart(cart);
    res.json(cart);
  }

  public updateItemQuantity(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer or zero' });
    }

    const cart = db.getCart(req.user.uid);

    if (quantity === 0) {
      cart.items = cart.items.filter((item) => item.productId !== productId);
    } else {
      const product = db.findProductById(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (quantity > product.stock) {
        return res.status(400).json({ error: `Only ${product.stock} units available in stock` });
      }
      const item = cart.items.find((i) => i.productId === productId);
      if (item) {
        item.quantity = quantity;
      }
    }

    cart.updatedAt = new Date().toISOString();
    db.saveCart(cart);
    res.json(cart);
  }

  public removeItem(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { productId } = req.params;
    const cart = db.getCart(req.user.uid);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    cart.updatedAt = new Date().toISOString();
    db.saveCart(cart);
    res.json(cart);
  }

  public clearCart(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const cart = db.getCart(req.user.uid);
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
    db.saveCart(cart);
    res.json(cart);
  }
}

export const cartController = new CartController();
